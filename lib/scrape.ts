// Shared product-scraping logic used by admin and user-facing API routes.

// ── Platform detection ─────────────────────────────────────────────────────────
export function detectPlatform(url: string): string {
  const u = url.toLowerCase()
  if (u.includes('amazon.in') || u.includes('amazon.com')) return 'Amazon'
  if (u.includes('flipkart.com'))  return 'Flipkart'
  if (u.includes('meesho.com'))    return 'Meesho'
  if (u.includes('myntra.com'))    return 'Myntra'
  if (u.includes('snapdeal.com'))  return 'Snapdeal'
  if (u.includes('ajio.com'))      return 'AJIO'
  if (u.includes('nykaa.com'))     return 'Nykaa'
  if (u.includes('jiomart.com'))   return 'JioMart'
  if (u.includes('tatacliq.com'))  return 'Tata CLiQ'
  return 'Other'
}

// ── HTML entity decoder ────────────────────────────────────────────────────────
function decode(s: string): string {
  return s
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim()
}

// ── Meta-tag extraction ────────────────────────────────────────────────────────
function extractMeta(html: string, property: string): string | null {
  const pats = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"'<>]+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"'<>]+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"'<>]+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"'<>]+)["'][^>]+name=["']${property}["']`, 'i'),
  ]
  for (const p of pats) {
    const m = html.match(p)
    if (m?.[1]) return decode(m[1])
  }
  return null
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return m ? decode(m[1].trim()) : null
}

// ── Price extraction ───────────────────────────────────────────────────────────
function extractPrice(html: string, platform: string): number | null {
  const try1 = (p: RegExp) => html.match(p)?.[1] ?? null
  let raw: string | null = null

  if (platform === 'Amazon') {
    raw =
      try1(/"priceAmount":(\d+\.?\d*)/)             ??
      try1(/\\"priceAmount\\":(\d+\.?\d*)/)          ??
      try1(/class="a-price-whole"[^>]*>\s*([\d,]+)/) ??
      try1(/"price":"INR ([\d,]+)"/)                 ??
      null
  } else if (platform === 'Flipkart') {
    raw =
      try1(/"finalPrice":(\d+)/)          ??
      try1(/"selling_price":(\d+)/)       ??
      try1(/class="_30jeq3[^"]*"[^>]*>₹([\d,]+)/) ??
      null
  }

  if (!raw) raw = try1(/₹\s*([\d,]+)/)
  if (!raw) return null
  const n = parseFloat(raw.replace(/,/g, ''))
  return isNaN(n) ? null : n
}

// ── Amazon image extraction (multiple fallback layers) ─────────────────────────
function extractAmazonImage(html: string): string | null {
  // 1. data-old-hires — direct high-resolution URL, most reliable
  const oldHires = html.match(/data-old-hires="(https?:[^"]+)"/)
  if (oldHires?.[1]) return oldHires[1]

  // 2. data-a-dynamic-image — JSON map of { url: [width, height] }
  //    Amazon HTML-encodes the attribute value, so decode first.
  const dynRaw = html.match(/data-a-dynamic-image="([^"]+)"/)
  if (dynRaw?.[1]) {
    try {
      const map: Record<string, [number, number]> = JSON.parse(decode(dynRaw[1]))
      const entries = Object.entries(map).filter(([url]) => url.startsWith('https://'))
      if (entries.length > 0) {
        // Prefer largest (highest resolution)
        entries.sort((a, b) => b[1][0] * b[1][1] - a[1][0] * a[1][1])
        return entries[0][0]
      }
    } catch {}
  }

  // 3. #landingImage src (may be a smaller thumbnail but beats nothing)
  const landing =
    html.match(/id="landingImage"[^>]*\ssrc="(https?:[^"]+)"/) ??
    html.match(/src="(https?:[^"]+)"[^>]*\sid="landingImage"/)
  if (landing?.[1] && !landing[1].includes('transparent-pixel')) return landing[1]

  // 4. JSON-LD @type Product image field
  const ldBlocks = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
  for (const [, inner] of ldBlocks) {
    if (!inner.includes('"Product"')) continue
    const img =
      inner.match(/"image"\s*:\s*"(https?:[^"]+)"/) ??
      inner.match(/"image"\s*:\s*\[\s*"(https?:[^"]+)"/)
    if (img?.[1]) return img[1]
  }

  // 5. hiRes key inside colorImages / image-gallery JS objects
  const hiRes = html.match(/"hiRes"\s*:\s*"(https?:[^"]+)"/)
  if (hiRes?.[1]) return hiRes[1]

  // 6. large key (lower quality but available)
  const large = html.match(/"large"\s*:\s*"(https?:[^"]+)"/)
  if (large?.[1]) return large[1]

  return null
}

// ── Title sanity check ─────────────────────────────────────────────────────────
const BAD_TITLE_EXACT = new Set([
  'amazon.in', 'amazon.com', 'flipkart.com', 'meesho.com', 'myntra.com',
  'snapdeal.com', 'ajio.com', 'nykaa.com', 'jiomart.com', 'tata cliq',
  'buy online', 'online shopping', 'shop online', 'best price', 'home',
  'products', 'shop', 'welcome', 'just a moment', 'access denied',
  '404', 'page not found', 'error', 'sign in', 'login', 'please wait',
  'checking your browser', 'robot check',
])
const DOMAIN_RE = /^(www\.)?[a-z0-9-]+\.(in|com|co\.in|net|org|io|pk)(\s*[-|].*)?$/i

function isBadTitle(name: string): boolean {
  if (!name) return true
  const lower = name.toLowerCase().trim()
  if (BAD_TITLE_EXACT.has(lower)) return true
  if (DOMAIN_RE.test(name)) return true
  const genericPrefixes = ['buy online', 'online shopping', 'shop online', 'just a moment', 'access denied']
  return genericPrefixes.some(p => lower.startsWith(p))
}

// ── Result type ────────────────────────────────────────────────────────────────
export interface ScrapeResult {
  original_url: string
  platform: string
  name: string
  price: number | null
  image_url: string
  error: string | null       // title/blocking error — null when name was found
  image_error: string | null // set when image could not be extracted
}

// ── Main scrape function ───────────────────────────────────────────────────────
export async function scrapeProduct(url: string): Promise<ScrapeResult> {
  const platform = detectPlatform(url)
  const empty = (error: string): ScrapeResult => ({
    original_url: url, platform, name: '', price: null, image_url: '', error, image_error: null,
  })

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    })

    if (!res.ok) return empty(`HTTP ${res.status} — page blocked or unavailable`)
    if (!(res.headers.get('content-type') ?? '').includes('html'))
      return empty('Non-HTML response (page may require login or is blocked)')

    const html = await res.text()

    // ── Name ─────────────────────────────────────────────────────────────────
    let name = extractMeta(html, 'og:title') ?? extractTitle(html) ?? ''
    name = name.replace(/\s*[-–|]\s*(Amazon\.in|Amazon\.com|Flipkart|Myntra|Meesho|Nykaa|AJIO|JioMart|Snapdeal)[^\n]*/gi, '').trim()
    if (isBadTitle(name)) name = ''

    // ── Image ────────────────────────────────────────────────────────────────
    let image_url = extractMeta(html, 'og:image') ?? ''
    if (image_url.startsWith('//')) image_url = 'https:' + image_url

    // Amazon: og:image is often a tiny thumbnail or missing — try specific selectors
    if (platform === 'Amazon' && (!image_url || image_url.includes('transparent'))) {
      image_url = extractAmazonImage(html) ?? ''
    }

    const image_error = !image_url
      ? platform === 'Amazon'
        ? 'Image nahi mila — Amazon product page kholo, product image par right-click karo aur "Copy image address" karke yahan paste karo'
        : 'Image nahi mila — product page se manually copy karke paste karo'
      : null

    // ── Price ────────────────────────────────────────────────────────────────
    const metaPrice =
      extractMeta(html, 'og:price:amount') ??
      extractMeta(html, 'product:price:amount') ??
      extractMeta(html, 'price')
    const price = metaPrice
      ? (parseFloat(metaPrice.replace(/,/g, '')) || null)
      : extractPrice(html, platform)

    const nameError = !name ? 'Title fetch nahi hua — manually fill karo' : null

    return { original_url: url, platform, name, price, image_url, error: nameError, image_error }
  } catch (e: any) {
    const msg = e?.name === 'TimeoutError' ? 'Timed out after 12s' : (e?.message ?? 'Fetch failed')
    return empty(msg)
  }
}
