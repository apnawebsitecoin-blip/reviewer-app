'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, ChevronDown } from 'lucide-react'

const CATEGORIES = ['Electronics', 'Beauty', 'Kitchen', 'Fashion', 'Health', 'Books', 'Sports', 'Home', 'Toys', 'Other']
const PLATFORMS = ['amazon', 'flipkart', 'meesho', 'myntra', 'other']

export default function AddProductForm() {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', image_url: '', price: '', platform: 'amazon', original_url: '', category: 'Electronics' })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.from('products').insert({
      name: form.name, image_url: form.image_url || null,
      price: form.price ? parseFloat(form.price) : null,
      platform: form.platform, original_url: form.original_url, category: form.category
    })
    if (error) { setError(error.message); setLoading(false); return }
    setForm({ name: '', image_url: '', price: '', platform: 'amazon', original_url: '', category: 'Electronics' })
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50">
        <span className="font-semibold text-gray-800 flex items-center gap-2"><Plus className="w-4 h-4 text-indigo-600" />नया Product जोड़ें</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="p-5 pt-0 border-t grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Product Name *', key: 'name', type: 'text', required: true, placeholder: 'Product का नाम' },
            { label: 'Image URL', key: 'image_url', type: 'url', required: false, placeholder: 'https://...' },
            { label: 'Price (₹)', key: 'price', type: 'number', required: false, placeholder: '999' },
            { label: 'Original URL *', key: 'original_url', type: 'url', required: true, placeholder: 'https://amazon.in/dp/...' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
              <input type={f.type} required={f.required} placeholder={f.placeholder}
                value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Platform</label>
            <select value={form.platform} onChange={e => setForm(prev => ({ ...prev, platform: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-red-500 col-span-full">{error}</p>}
          <button type="submit" disabled={loading}
            className="col-span-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60 font-medium">
            {loading ? 'जोड़ा जा रहा है...' : 'Product जोड़ें'}
          </button>
        </form>
      )}
    </div>
  )
}
