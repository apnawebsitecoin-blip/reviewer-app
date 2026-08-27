import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import ProductDetailClient from './ProductDetailClient'
import AnimatedReviewList from './AnimatedReviewList'
import { ClientSentimentChart, ClientQASection, ClientPriceHistoryChart } from './ClientComponents'
import CouponSection from '@/components/CouponSection'
import VideoReviewsSection from '@/components/VideoReviewsSection'
import SocialProofWidget from '@/components/SocialProofWidget'
import { formatCurrency, getSentimentBg } from '@/lib/utils'
import { getSiteSettings } from '@/lib/settings'
import { getTranslations } from 'next-intl/server'
import type { Coupon, VideoReview } from '@/lib/types'

export const revalidate = 30

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [supabase, settings, t] = await Promise.all([createClient(), getSiteSettings(), getTranslations('product')])

  const { data: product } = await supabase.from('products').select('*').eq('id', id).single()
  if (!product) notFound()

  const [
    { data: reviews },
    { data: { user } },
    { data: videoRows },
    { data: allCoupons },
    { count: wishlistCount },
    { count: todayViews },
  ] = await Promise.all([
    supabase.from('reviews').select('*, profiles(id, name, trust_score)').eq('product_id', id).eq('verified', true).order('created_at', { ascending: false }),
    supabase.auth.getUser(),
    supabase.from('video_reviews').select('*, profiles(name)').eq('product_id', id).eq('status', 'live').order('created_at', { ascending: false }),
    supabase.from('coupons').select('*').eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('wishlists').select('*', { count: 'exact', head: true }).eq('product_id', id),
    supabase.from('clicks').select('*', { count: 'exact', head: true }).eq('product_id', id).gte('clicked_at', new Date(Date.now() - 86400000).toISOString()),
  ])

  const { data: wishlistRow } = user
    ? await supabase.from('wishlists').select('id').eq('user_id', user.id).eq('product_id', id).maybeSingle()
    : { data: null }
  const initialWishlisted = !!wishlistRow

  const verifiedReviews = reviews ?? []
  const positive = verifiedReviews.filter(r => r.sentiment === 'positive').length
  const neutral  = verifiedReviews.filter(r => r.sentiment === 'neutral').length
  const negative = verifiedReviews.filter(r => r.sentiment === 'negative').length

  const videoReviews: VideoReview[] = (videoRows as VideoReview[]) ?? []

  const now = new Date()
  const coupons: Coupon[] = (allCoupons ?? []).filter((c: Coupon) => {
    if (c.expires_at && new Date(c.expires_at) < now) return false
    if (c.product_id && c.product_id !== product.id) return false
    if (!c.product_id && c.category && c.category !== product.category) return false
    return true
  })

  const brand = settings.brandColor

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Product Hero Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="md:grid md:grid-cols-[380px_1fr]">

          {/* Image */}
          <div className="relative aspect-square bg-gray-50 flex-shrink-0">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                unoptimized
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl text-gray-200">📦</div>
            )}

            {/* Platform pill */}
            {product.platform && (
              <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[11px] font-bold text-gray-700 px-2.5 py-1 rounded-full shadow-sm border border-white/60">
                {product.platform}
              </span>
            )}

            {/* Featured / Sponsored badges */}
            {(product.is_featured || product.is_sponsored) && (
              <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                {product.is_featured && (
                  <span className="bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                    ★ Featured
                  </span>
                )}
                {product.is_sponsored && (
                  <span className="bg-sky-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                    Sponsored
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="p-6 md:p-8 flex flex-col gap-4">

            {/* Category */}
            {product.category && (
              <span
                className="inline-flex self-start text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full animate-fsu"
                style={{ background: brand + '18', color: brand }}
              >
                {product.category}
              </span>
            )}

            {/* Product name */}
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 leading-tight animate-fsu-1">
              {product.name}
            </h1>

            {/* Price */}
            {product.price ? (
              <p className="text-3xl font-black animate-fsu-2" style={{ color: brand }}>
                {formatCurrency(product.price)}
              </p>
            ) : null}

            {/* Social proof */}
            <div className="animate-fsu-3">
              <SocialProofWidget
                viewCount={todayViews ?? 0}
                wishlistCount={wishlistCount ?? 0}
                reviewCount={verifiedReviews.length}
              />
            </div>

            {/* Coupons */}
            {settings.featureFlags?.showCoupons !== false && coupons.length > 0 && (
              <CouponSection coupons={coupons} />
            )}

            {/* Affiliate note */}
            <p className="text-[11px] text-gray-400 italic -mt-1">{t('affiliateDisclosure')}</p>

            {/* Action buttons */}
            <ProductDetailClient
              product={product}
              user={user}
              initialWishlisted={initialWishlisted}
              brand={brand}
            />

            {/* Price history */}
            {settings.featureFlags?.showPriceHistory !== false && product.price && (
              <ClientPriceHistoryChart productId={product.id} currentPrice={product.price} />
            )}
          </div>
        </div>
      </div>

      {/* ── Reviews Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">
            {t('reviewsCount', { count: verifiedReviews.length })}
          </h2>
        </div>

        <ClientSentimentChart positive={positive} neutral={neutral} negative={negative} />

        <div className="mt-6">
          <AnimatedReviewList reviews={verifiedReviews} brand={brand} />
        </div>
      </div>

      {/* ── Video Reviews ── */}
      {settings.featureFlags?.showVideoReviews !== false && videoReviews.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <VideoReviewsSection videos={videoReviews} />
        </div>
      )}

      {/* ── Q&A ── */}
      <ClientQASection productId={id} user={user} />
    </div>
  )
}
