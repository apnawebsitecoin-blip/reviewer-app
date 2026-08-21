export function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export function getSentimentColor(sentiment: string) {
  if (sentiment === 'positive') return 'text-green-600'
  if (sentiment === 'negative') return 'text-red-500'
  return 'text-yellow-500'
}

export function getSentimentBg(sentiment: string) {
  if (sentiment === 'positive') return 'bg-green-100 text-green-800'
  if (sentiment === 'negative') return 'bg-red-100 text-red-800'
  return 'bg-yellow-100 text-yellow-800'
}

export function buildAffiliateUrl(originalUrl: string, platform: string | null, reviewerId: string): string {
  const tag = process.env.NEXT_PUBLIC_AFFILIATE_TAG || 'REVIEWAPP-21'
  try {
    const url = new URL(originalUrl)
    if (platform === 'amazon') {
      url.searchParams.set('tag', tag)
      url.searchParams.set('subid', reviewerId)
    } else if (platform === 'flipkart') {
      url.searchParams.set('affid', tag)
      url.searchParams.set('subid', reviewerId)
    } else {
      url.searchParams.set('ref', tag)
      url.searchParams.set('subid', reviewerId)
    }
    return url.toString()
  } catch {
    return originalUrl
  }
}

export async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export function isDetailedReview(text: string): boolean {
  if (!text || text.split(' ').length < 50) return false
  const keywords = ['लेकिन', 'कमी', 'problem', 'issue', 'however', 'but', 'cons', 'pros', 'though', 'although', 'खराब', 'अच्छा']
  return keywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()))
}
