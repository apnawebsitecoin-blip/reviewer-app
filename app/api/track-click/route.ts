import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildAffiliateUrl } from '@/lib/utils'

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
    // Anti-fraud: prevent self-click
    if (user && user.id === reviewerId) {
      const affiliateUrl = buildAffiliateUrl(product.original_url, product.platform, reviewerId)
      return NextResponse.redirect(affiliateUrl)
    }

    // Rate limiting: same IP + same product within 60 seconds
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown'
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()

    const { count } = await admin
      .from('clicks')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)
      .eq('ip_address', ip)
      .gte('clicked_at', oneMinuteAgo)

    if ((count ?? 0) === 0) {
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
