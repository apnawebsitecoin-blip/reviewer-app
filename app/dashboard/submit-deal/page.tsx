'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ShoppingBag, Link2, CheckCircle2, Loader2,
  AlertCircle, RefreshCw, ArrowRight,
} from 'lucide-react'

const CATEGORIES = [
  'Electronics', 'Fashion', 'Home & Kitchen', 'Beauty & Personal Care',
  'Books', 'Sports & Outdoors', 'Toys & Games', 'Grocery', 'Automotive', 'Health', 'Other',
]

type Mode = 'link' | 'manual'
type LinkPhase = 'idle' | 'fetching' | 'ready'

export default function SubmitDealPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mode, setMode]           = useState<Mode>('link')
  const [linkUrl, setLinkUrl]     = useState('')
  const [linkPhase, setLinkPhase] = useState<LinkPhase>('idle')
  const [fetchError, setFetchError] = useState('')

  const [productName, setProductName]   = useState('')
  const [productUrl, setProductUrl]     = useState('')
  const [price, setPrice]               = useState('')
  const [category, setCategory]         = useState('')
  const [imageUrl, setImageUrl]         = useState('')
  const [description, setDescription]   = useState('')

  const [submitting, setSubmitting]     = useState(false)
  const [success, setSuccess]           = useState(false)
  const [submitError, setSubmitError]   = useState('')

  const handleFetch = async () => {
    if (!linkUrl.startsWith('http')) return
    setLinkPhase('fetching')
    setFetchError('')
    try {
      const res = await fetch('/api/scrape-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkUrl }),
      })
      const data = await res.json()
      setProductUrl(linkUrl)
      setProductName(data.name ?? '')
      setPrice(data.price != null ? String(data.price) : '')
      setImageUrl(data.image_url ?? '')
      setLinkPhase('ready')
      if (data.error) setFetchError(data.error)
    } catch {
      setFetchError('Network error — manually fill karo')
      setProductUrl(linkUrl)
      setLinkPhase('ready')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { error } = await supabase.from('community_deals').insert({
      user_id: user.id,
      product_name: productName.trim(),
      product_url: productUrl.trim(),
      price: price ? parseFloat(price) : null,
      category: category || null,
      image_url: imageUrl.trim() || null,
      description: description.trim() || null,
    })

    if (error) { setSubmitError(error.message); setSubmitting(false); return }
    setSuccess(true)
    setSubmitting(false)
  }

  const reset = () => {
    setMode('link'); setLinkUrl(''); setLinkPhase('idle'); setFetchError('')
    setProductName(''); setProductUrl(''); setPrice(''); setCategory('')
    setImageUrl(''); setDescription(''); setSuccess(false); setSubmitError('')
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Deal Submitted!</h2>
          <p className="text-sm text-gray-500 mb-1">Admin review ke baad catalog mein add hoga.</p>
          <p className="text-xs text-gray-400 mb-7">Approve hone par notification milegi.</p>
          <button
            onClick={reset}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-2.5 rounded-xl text-sm font-bold transition-colors"
          >
            Aur deal submit karo
          </button>
        </div>
      </div>
    )
  }

  const showForm = mode === 'manual' || linkPhase === 'ready'

  // ── Main ─────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Product Suggest Karo</h1>
          <p className="text-xs text-gray-400 mt-0.5">Admin approval ke baad catalog mein add hoga</p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1.5 mb-5 bg-gray-100 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => { setMode('link'); setLinkPhase('idle'); setFetchError('') }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all ${
            mode === 'link' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" /> Add via Link
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all ${
            mode === 'manual' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" /> Manual Form
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

        {/* ── Link mode: URL input ────────────────────────────────────────────── */}
        {mode === 'link' && linkPhase === 'idle' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              Amazon, Flipkart, Meesho, Myntra ya kisi bhi platform ka product URL paste karo.
              System naam, price aur image auto-fetch kar lega — phir tum verify/edit karke submit karo.
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && linkUrl.startsWith('http') && handleFetch()}
                placeholder="https://amazon.in/dp/... ya Flipkart/Meesho link"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleFetch}
                disabled={!linkUrl.startsWith('http')}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
              >
                <ArrowRight className="w-4 h-4" /> Fetch
              </button>
            </div>
          </div>
        )}

        {/* ── Link mode: fetching ─────────────────────────────────────────────── */}
        {mode === 'link' && linkPhase === 'fetching' && (
          <div className="flex items-center gap-3 py-4">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-700">Product details fetch ho raha hai…</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{linkUrl}</p>
            </div>
          </div>
        )}

        {/* ── Link mode: back + partial warning ──────────────────────────────── */}
        {mode === 'link' && linkPhase === 'ready' && (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => { setLinkPhase('idle'); setFetchError('') }}
              className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try another URL
            </button>
            {fetchError && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" /> {fetchError}
              </p>
            )}
          </div>
        )}

        {/* ── Shared editable form ────────────────────────────────────────────── */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Image preview + Product name */}
            <div className="flex gap-3 items-start">
              {/* Live image thumbnail */}
              <div className="shrink-0">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt=""
                    className="w-16 h-16 object-cover rounded-xl border border-gray-100 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-2xl text-gray-300">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                  Product Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  required
                  placeholder="Product ka naam…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Product URL */}
            {mode === 'manual' ? (
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                  Product URL <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  value={productUrl}
                  onChange={e => setProductUrl(e.target.value)}
                  required
                  placeholder="https://amazon.in/dp/..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Source URL</label>
                <p className="text-xs text-gray-400 truncate bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">{productUrl}</p>
              </div>
            )}

            {/* Price + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Price ₹</label>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  min="0"
                  placeholder="999"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Image URL (editable so user can fix missing/wrong image) */}
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://… (auto-filled if found)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Why is this a good deal?</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Community ko batao kyun yeh deal achha hai…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>

            {submitError && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{submitError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
              ) : 'Submit Deal for Approval'}
            </button>

            <p className="text-[11px] text-center text-gray-400">
              Yeh deal directly live nahi hoga — admin review ke baad catalog mein add hoga
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
