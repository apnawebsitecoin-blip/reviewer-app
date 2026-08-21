'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ReviewForm from '@/components/ReviewForm'
import { ShoppingCart, Share2, Bell, RotateCcw } from 'lucide-react'
import type { Product } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

interface Props {
  product: Product
  user: User | null
}

export default function ProductDetailClient({ product, user }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [alertPrice, setAlertPrice] = useState('')
  const [showAlertForm, setShowAlertForm] = useState(false)
  const [alertSaved, setAlertSaved] = useState(false)

  const handleBuyNow = async () => {
    const reviewerId = user?.id ?? 'anonymous'
    window.open(`/api/track-click?product_id=${product.id}&reviewer_id=${reviewerId}`, '_blank')
  }

  const handleWhatsAppShare = () => {
    const url = `${window.location.origin}/products/${product.id}?ref=${user?.id ?? ''}`
    const text = `Check out this product on ReviewApp: ${product.name} - ${url}`
    if (navigator.share) {
      navigator.share({ title: product.name, url })
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }
  }

  const handleMarkReturned = async () => {
    if (!user) return
    await supabase.from('reviews').update({ later_returned: true })
      .eq('product_id', product.id).eq('reviewer_id', user.id)
    router.refresh()
  }

  const handlePriceAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { router.push('/auth/login'); return }
    await supabase.from('price_alerts').upsert({ user_id: user.id, product_id: product.id, target_price: parseFloat(alertPrice) })
    setAlertSaved(true)
    setShowAlertForm(false)
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={handleBuyNow}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 font-semibold transition">
          <ShoppingCart className="w-4 h-4" />अभी खरीदें
        </button>

        {user && (
          <button onClick={() => setShowReviewForm(true)}
            className="flex items-center gap-2 border border-indigo-600 text-indigo-600 px-4 py-2.5 rounded-xl hover:bg-indigo-50 font-medium transition">
            + रिव्यू जोड़ें
          </button>
        )}

        <button onClick={handleWhatsAppShare}
          className="flex items-center gap-2 bg-green-500 text-white px-4 py-2.5 rounded-xl hover:bg-green-600 transition">
          <Share2 className="w-4 h-4" />Share
        </button>

        <button onClick={() => setShowAlertForm(!showAlertForm)}
          className="flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition">
          <Bell className="w-4 h-4" />{alertSaved ? 'Alert Set ✓' : 'Price Alert'}
        </button>

        {user && (
          <button onClick={handleMarkReturned}
            className="flex items-center gap-2 border border-orange-300 text-orange-500 px-4 py-2.5 rounded-xl hover:bg-orange-50 transition text-sm">
            <RotateCcw className="w-4 h-4" />Returned?
          </button>
        )}
      </div>

      {showAlertForm && (
        <form onSubmit={handlePriceAlert} className="flex gap-2 mt-3">
          <input type="number" placeholder="Target price (₹)" value={alertPrice} onChange={e => setAlertPrice(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          <button type="submit" className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm">Set Alert</button>
        </form>
      )}

      {showReviewForm && (
        <ReviewForm
          productId={product.id}
          onClose={() => setShowReviewForm(false)}
          onSuccess={() => { setShowReviewForm(false); router.refresh() }}
        />
      )}
    </>
  )
}
