import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function detectPlatform(url: string): string {
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

function decode(s: string): string {
  return s
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim()
}

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
      try1(/"finalPrice":(\d+)/) ??
      try1(/"selling_price":(\d+)/) ??
      try1(/class="_30jeq3[^"]*"[^>]*>₹([\d,]+)/) ??
      null
  }
  if (!raw) raw = try1(/₹\s*([\d,]+)/)
  if (!raw) return null
  const n = parseFloat(raw.replace(/,/g, ''))
  return isNaN(n) ? null : n
}

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

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const url: string = body?.url ?? ''
  if (!url.startsWith('http')) {
    return NextResponse.json({ error: 'Valid URL required' }, { status: 400 })
  }

  const platform = detectPlatform(url)
  const empty = (error: string) =>
    NextResponse.json({ original_url: url, platform, name: '', price: null, image_url: '', error })

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
      signal: AbortSignal.timeout(12000),
      redirect: 'follow',
    })

    if (!res.ok) return empty(`HTTP ${res.status} — manually fill karo`)
    if (!(res.headers.get('content-type') ?? '').includes('html'))
      return empty('Non-HTML response — manually fill karo')

    const html = await res.text()

    let name = extractMeta(html, 'og:title') ?? extractTitle(html) ?? ''
    name = name.replace(/\s*[-–|]\s*(Amazon\.in|Amazon\.com|Flipkart|Myntra|Meesho|Nykaa|AJIO|JioMart|Snapdeal)[^\n]*/gi, '').trim()
    if (isBadTitle(name)) name = ''

    let image_url = extractMeta(html, 'og:image') ?? ''
    if (image_url.startsWith('//')) image_url = 'https:' + image_url

    const metaPrice =
      extractMeta(html, 'og:price:amount') ??
      extractMeta(html, 'product:price:amount') ??
      extractMeta(html, 'price')
    const price = metaPrice
      ? (parseFloat(metaPrice.replace(/,/g, '')) || null)
      : extractPrice(html, platform)

    const nameError = !name ? 'Title nahi mila — naam manually bharo' : null

    return NextResponse.json({ original_url: url, platform, name, price, image_url, error: nameError })
  } catch (e: any) {
    const msg = e?.name === 'TimeoutError' ? 'Timed out (12s) — manually fill karo' : (e?.message ?? 'Fetch failed')
    return empty(msg)
  }
}
