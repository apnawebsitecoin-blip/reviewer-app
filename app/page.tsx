import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { TrendingUp, Star, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()

  // Trending: most clicks
  const { data: trending } = await supabase
    .from('clicks')
    .select('product_id')
    .order('clicked_at', { ascending: false })
    .limit(200)

  const clickCounts: Record<string, number> = {}
  ;(trending ?? []).forEach(c => { clickCounts[c.product_id] = (clickCounts[c.product_id] ?? 0) + 1 })
  const trendingIds = Object.entries(clickCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id]) => id)

  let trendingProducts: any[] = []
  if (trendingIds.length > 0) {
    const { data } = await supabase.from('products').select('*').in('id', trendingIds)
    trendingProducts = data ?? []
  } else {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(8)
    trendingProducts = data ?? []
  }

  // Most reviewed
  const { data: reviewCounts } = await supabase
    .from('reviews')
    .select('product_id')
    .eq('verified', true)

  const reviewCountMap: Record<string, number> = {}
  ;(reviewCounts ?? []).forEach(r => { reviewCountMap[r.product_id] = (reviewCountMap[r.product_id] ?? 0) + 1 })
  const mostReviewedIds = Object.entries(reviewCountMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id]) => id)

  let mostReviewed: any[] = []
  if (mostReviewedIds.length > 0) {
    const { data } = await supabase.from('products').select('*').in('id', mostReviewedIds)
    mostReviewed = data ?? []
  }

  // Collections
  const { data: collections } = await supabase.from('collections').select('*').order('created_at', { ascending: false }).limit(4)

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl p-8 md:p-12 mb-10 text-center">
        <h1 className="text-2xl md:text-4xl font-bold mb-3">असली खरीदारों के सच्चे रिव्यू</h1>
        <p className="text-indigo-100 mb-6 text-sm md:text-base">हर रिव्यूअर ने प्रोडक्ट खुद खरीदा है। कोई नकली रिव्यू नहीं।</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/products" className="bg-white text-indigo-600 font-semibold px-6 py-2.5 rounded-full hover:bg-indigo-50 transition">
            प्रोडक्ट देखें
          </Link>
          <Link href="/auth/signup" className="border border-white text-white px-6 py-2.5 rounded-full hover:bg-white/10 transition">
            रिव्यूअर बनें
          </Link>
        </div>
      </section>

      {/* Collections */}
      {collections && collections.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" /> Best Collections
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {collections.map(col => (
              <Link key={col.id} href={`/products?collection=${col.id}`}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 border rounded-xl p-4 hover:shadow-md transition text-center">
                <p className="text-sm font-semibold text-indigo-700">{col.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      <ProductSection title="ट्रेंडिंग प्रोडक्ट" icon={<TrendingUp className="w-5 h-5 text-red-500" />} products={trendingProducts} />

      {/* Most Reviewed */}
      {mostReviewed.length > 0 && (
        <ProductSection title="सबसे ज़्यादा रिव्यू वाले" icon={<Star className="w-5 h-5 text-yellow-500" />} products={mostReviewed} />
      )}

      <div className="text-center mt-6">
        <Link href="/products" className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:underline">
          सभी प्रोडक्ट देखें <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

function ProductSection({ title, icon, products }: { title: string; icon: React.ReactNode; products: any[] }) {
  if (!products.length) return null
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">{icon}{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map(p => (
          <Link key={p.id} href={`/products/${p.id}`}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden group">
            <div className="relative h-40 bg-gray-100">
              {p.image_url ? (
                <Image src={p.image_url} alt={p.name} fill className="object-cover group-hover:scale-105 transition" />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-300 text-3xl">📦</div>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-gray-800 line-clamp-2">{p.name}</p>
              {p.price && <p className="text-indigo-600 font-bold text-sm mt-1">{formatCurrency(p.price)}</p>}
              {p.category && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-1 inline-block">{p.category}</span>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
