import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import ProductDetailClient from './ProductDetailClient'
import { ClientSentimentChart, ClientQASection, ClientPriceHistoryChart } from './ClientComponents'
import CouponSection from '@/components/CouponSection'
import VideoReviewsSection from '@/components/VideoReviewsSection'
import SocialProofWidget from '@/components/SocialProofWidget'
import { formatCurrency, formatDate, getSentimentBg } from '@/lib/utils'
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="md:flex">
          <div className="relative md:w-80 h-64 md:h-auto bg-gray-100 flex-shrink-0">
            {product.image_url ? (
              <Image src={product.image_url} alt={product.name} fill className="object-cover" unoptimized />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-200 text-6xl">📦</div>
            )}
          </div>
          <div className="p-6 flex-1">
            <div>
              {product.category && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full capitalize">{product.category}</span>
              )}
              <h1 className="text-xl font-bold text-gray-800 mt-2">{product.name}</h1>
              {product.platform && <p className="text-sm text-gray-400 capitalize mt-1">{product.platform}</p>}
              {product.price && <p className="text-2xl font-bold text-indigo-600 mt-2">{formatCurrency(product.price)}</p>}
            </div>

            <SocialProofWidget
              viewCount={todayViews ?? 0}
              wishlistCount={wishlistCount ?? 0}
              reviewCount={verifiedReviews.length}
            />

            {settings.featureFlags?.showCoupons !== false && coupons.length > 0 && <CouponSection coupons={coupons} />}

            <p className="text-xs text-gray-400 mt-3 italic">{t('affiliateDisclosure')}</p>

            <ProductDetailClient product={product} user={user} initialWishlisted={initialWishlisted} />

            {settings.featureFlags?.showPriceHistory !== false && product.price && (
              <ClientPriceHistoryChart productId={product.id} currentPrice={product.price} />
            )}
          </div>
        </div>

        <div className="p-6 border-t">
          <h2 className="font-bold text-gray-800 mb-4 text-lg">
            {t('reviewsCount', { count: verifiedReviews.length })}
          </h2>

          <ClientSentimentChart positive={positive} neutral={neutral} negative={negative} />

          <div className="mt-6 space-y-4">
            {verifiedReviews.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">{t('noReviews')}</p>
            ) : (
              verifiedReviews.map(review => (
                <div key={review.id} className="border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                        {((review.profiles as any)?.name ?? 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-800">{(review.profiles as any)?.name ?? t('anonymous')}</span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{t('verifiedPurchase')}</span>
                          {review.detailed_badge && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{t('detailedBadge')}</span>
                          )}
                          {(review.profiles as any)?.trust_score >= 5 && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{t('trustedBadge')}</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSentimentBg(review.sentiment)}`}>
                      {review.sentiment === 'positive' ? t('positive') : review.sentiment === 'negative' ? t('negative') : t('neutral')}
                    </span>
                  </div>
                  {review.review_text && <p className="text-sm text-gray-600">{review.review_text}</p>}
                  {review.later_returned && (
                    <p className="text-xs text-orange-500 mt-2 italic">{t('returnedWarning')}</p>
                  )}
                  {review.media_url && (
                    <a href={review.media_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-indigo-500 hover:underline mt-2 block">{t('viewProof')}</a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {settings.featureFlags?.showVideoReviews !== false && videoReviews.length > 0 && (
          <div className="p-6 border-t">
            <VideoReviewsSection videos={videoReviews} />
          </div>
        )}
      </div>

      <ClientQASection productId={id} user={user} />
    </div>
  )
}
