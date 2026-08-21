import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import ProductDetailClient from './ProductDetailClient'
import { ClientSentimentChart, ClientQASection } from './ClientComponents'
import { formatCurrency, formatDate, getSentimentBg } from '@/lib/utils'

export const revalidate = 30

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase.from('products').select('*').eq('id', id).single()
  if (!product) notFound()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, profiles(id, name, trust_score)')
    .eq('product_id', id)
    .eq('verified', true)
    .order('created_at', { ascending: false })

  const verifiedReviews = reviews ?? []

  const positive = verifiedReviews.filter(r => r.sentiment === 'positive').length
  const neutral = verifiedReviews.filter(r => r.sentiment === 'neutral').length
  const negative = verifiedReviews.filter(r => r.sentiment === 'negative').length

  const { data: { user } } = await supabase.auth.getUser()

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

            <p className="text-xs text-gray-400 mt-3 italic">
              इस लिंक से खरीदने पर हमें कमीशन मिल सकता है (affiliate disclosure)।
            </p>

            <ProductDetailClient product={product} user={user} />
          </div>
        </div>

        <div className="p-6 border-t">
          <h2 className="font-bold text-gray-800 mb-4 text-lg">
            रिव्यू ({verifiedReviews.length})
          </h2>

          <ClientSentimentChart positive={positive} neutral={neutral} negative={negative} />

          <div className="mt-6 space-y-4">
            {verifiedReviews.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">अभी तक कोई वेरिफाइड रिव्यू नहीं। पहले बनें!</p>
            ) : (
              verifiedReviews.map(review => (
                <div key={review.id} className="border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                        {((review.profiles as any)?.name ?? 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">{(review.profiles as any)?.name ?? 'Anonymous'}</span>
                          {review.detailed_badge && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Detailed ⭐</span>
                          )}
                          {(review.profiles as any)?.trust_score >= 5 && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Trusted</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSentimentBg(review.sentiment)}`}>
                      {review.sentiment === 'positive' ? '👍 सकारात्मक' : review.sentiment === 'negative' ? '👎 नकारात्मक' : '😐 तटस्थ'}
                    </span>
                  </div>
                  {review.review_text && <p className="text-sm text-gray-600">{review.review_text}</p>}
                  {review.later_returned && (
                    <p className="text-xs text-orange-500 mt-2 italic">⚠️ Reviewer later returned this item</p>
                  )}
                  {review.media_url && (
                    <a href={review.media_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-indigo-500 hover:underline mt-2 block">📷 प्रूफ देखें</a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ClientQASection productId={id} user={user} />
    </div>
  )
}
