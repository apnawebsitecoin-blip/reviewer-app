'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Loader2, Save } from 'lucide-react'

const CATEGORIES = ['Electronics', 'Beauty', 'Kitchen', 'Fashion', 'Health', 'Books', 'Sports', 'Home', 'Toys', 'Other']
const PLATFORMS  = ['amazon', 'flipkart', 'meesho', 'myntra', 'other']
const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition bg-white'
const LABEL = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'

export interface EditableProduct {
  id: string
  name: string
  image_url: string | null
  price: number | null
  platform: string | null
  original_url: string
  category: string | null
}

interface Props {
  product: EditableProduct
  onClose: () => void
}

export default function EditProductModal({ product, onClose }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name:         product.name ?? '',
    image_url:    product.image_url ?? '',
    price:        product.price != null ? String(product.price) : '',
    platform:     product.platform ?? 'amazon',
    original_url: product.original_url ?? '',
    category:     product.category ?? 'Electronics',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('products').update({
      name:         form.name,
      image_url:    form.image_url || null,
      price:        form.price ? parseFloat(form.price) : null,
      platform:     form.platform,
      original_url: form.original_url,
      category:     form.category,
    }).eq('id', product.id)
    if (err) { setError(err.message); setLoading(false); return }
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-base font-black text-gray-900">Edit Product</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Current image preview */}
        {form.image_url && (
          <div className="px-5 pt-4 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.image_url} alt={form.name} className="w-14 h-14 object-cover rounded-xl border border-gray-100 shadow-sm" />
            <p className="text-xs text-gray-400">Current image preview — update URL below to change</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Product Name *</label>
            <input type="text" required value={form.name}
              onChange={e => set('name', e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Affiliate URL *</label>
            <input type="url" required value={form.original_url}
              onChange={e => set('original_url', e.target.value)}
              className={INPUT} placeholder="https://amazon.in/dp/..." />
          </div>
          <div>
            <label className={LABEL}>Price (₹)</label>
            <input type="number" value={form.price}
              onChange={e => set('price', e.target.value)} className={INPUT} placeholder="999" />
          </div>
          <div>
            <label className={LABEL}>Image URL</label>
            <input type="url" value={form.image_url}
              onChange={e => set('image_url', e.target.value)} className={INPUT} placeholder="https://..." />
          </div>
          <div>
            <label className={LABEL}>Platform</label>
            <select value={form.platform} onChange={e => set('platform', e.target.value)} className={INPUT}>
              {PLATFORMS.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className={INPUT}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {error && (
            <p className="col-span-full text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="col-span-full flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-60">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
