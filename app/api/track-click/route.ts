import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildAffiliateUrl } from '@/lib/utils'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DAILY_CLICK_CAP = 10  // max unique-IP clicks per reviewer per product per day

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('product_id')
  const reviewerId = searchParams.get('reviewer_id')

  if (!productId) {
    return NextResponse.json({ error: 'product_id required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const supabase = await createClient()

  const { data: product } = await admin.from('products').select('original_url, platform').eq('id', productId).single()
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  // Get logged-in user (to prevent self-click)
  const { data: { user } } = await supabase.auth.getUser()

  if (reviewerId && reviewerId !== 'anonymous') {
    // Validate reviewer_id is a well-formed UUID that exists in profiles —
    // prevents forged attribution to arbitrary user IDs
    if (!UUID_RE.test(reviewerId)) {
      const affiliateUrl = buildAffiliateUrl(product.original_url, product.platform, 'platform')
      return NextResponse.redirect(affiliateUrl)
    }

    const { data: reviewerProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', reviewerId)
      .single()

    if (!reviewerProfile) {
      const affiliateUrl = buildAffiliateUrl(product.original_url, product.platform, 'platform')
      return NextResponse.redirect(affiliateUrl)
    }

    // Anti-fraud: prevent self-click (always redirect, never record)
    if (user && user.id === reviewerId) {
      const affiliateUrl = buildAffiliateUrl(product.original_url, product.platform, reviewerId)
      return NextResponse.redirect(affiliateUrl)
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString()
    const oneDayAgo    = new Date(Date.now() - 86_400_000).toISOString()

    // Dedup: same IP + same product within 60 seconds (burst protection)
    const { count: recentBurst } = await admin
      .from('clicks')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)
      .eq('ip_address', ip)
      .gte('clicked_at', oneMinuteAgo)

    if ((recentBurst ?? 0) > 0) {
      const affiliateUrl = buildAffiliateUrl(product.original_url, product.platform, reviewerId)
      return NextResponse.redirect(affiliateUrl)
    }

    // Daily cap: max 10 unique-IP clicks per reviewer per product per day
    const { count: dailyCount } = await admin
      .from('clicks')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)
      .eq('reviewer_id', reviewerId)
      .gte('clicked_at', oneDayAgo)

    if ((dailyCount ?? 0) < DAILY_CLICK_CAP) {
      await admin.from('clicks').insert({
        product_id: productId,
        reviewer_id: reviewerId,
        ip_address: ip,
      })
    }
  }

  const effectiveReviewerId = reviewerId && reviewerId !== 'anonymous' ? reviewerId : 'platform'
  const affiliateUrl = buildAffiliateUrl(product.original_url, product.platform, effectiveReviewerId)
  return NextResponse.redirect(affiliateUrl)
}
