'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

const CATEGORIES = ['Electronics', 'Beauty', 'Kitchen', 'Fashion', 'Health', 'Books', 'Sports', 'Home', 'Toys', 'Other']
const PLATFORMS  = ['amazon', 'flipkart', 'meesho', 'myntra', 'other']

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition bg-white'
const LABEL = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'

export default function AddProductForm() {
  const supabase = createClient()
  const router   = useRouter()
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [form, setForm] = useState({
    name: '', image_url: '', price: '', platform: 'amazon', original_url: '', category: 'Electronics',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.from('products').insert({
      name: form.name,
      image_url: form.image_url || null,
      price: form.price ? parseFloat(form.price) : null,
      platform: form.platform,
      original_url: form.original_url,
      category: form.category,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setForm({ name: '', image_url: '', price: '', platform: 'amazon', original_url: '', category: 'Electronics' })
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Plus className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-sm font-bold text-gray-800">Naya Product Jodo (Single)</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="border-t border-gray-100 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Product Name *</label>
            <input type="text" required placeholder="Product ka naam" value={form.name}
              onChange={e => set('name', e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Affiliate URL *</label>
            <input type="url" required placeholder="https://amazon.in/dp/..." value={form.original_url}
              onChange={e => set('original_url', e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Price (₹)</label>
            <input type="number" placeholder="999" value={form.price}
              onChange={e => set('price', e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Image URL</label>
            <input type="url" placeholder="https://..." value={form.image_url}
              onChange={e => set('image_url', e.target.value)} className={INPUT} />
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
            <p className="col-span-full text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="col-span-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Jod raha hai…</> : <><Plus className="w-4 h-4" /> Product Jodo</>}
          </button>
        </form>
      )}
    </div>
  )
}
