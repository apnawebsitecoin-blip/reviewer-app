'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Zap, Plus, Trash2, Loader2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/lib/types'

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition bg-white'
const LABEL = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'

interface FlashDeal {
  id: string; product_id: string; flash_price: number
  label: string; ends_at: string; is_active: boolean; created_at: string
  products?: { name: string; price: number | null }
}

const EMPTY = { product_id: '', flash_price: '', label: '⚡ Flash Deal', ends_at: '' }

// Default ends_at: 24 hours from now in local datetime-local format
function defaultEndsAt() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 16)
}

export default function AdminFlashDealsPage() {
  const supabase = createClient()
  const [deals,    setDeals]    = useState<FlashDeal[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [form,     setForm]     = useState({ ...EMPTY, ends_at: defaultEndsAt() })

  useEffect(() => {
    supabase.from('flash_deals').select('*, products(name, price)').order('created_at', { ascending: false })
      .then(({ data }) => setDeals((data as FlashDeal[]) ?? []))
    supabase.from('products').select('id, name, price, category').order('name')
      .then(({ data }) => setProducts((data as Product[]) ?? []))
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data } = await supabase.from('flash_deals').insert({
      product_id:  form.product_id,
      flash_price: parseFloat(form.flash_price),
      label:       form.label,
      ends_at:     new Date(form.ends_at).toISOString(),
      is_active:   true,
    }).select('*, products(name, price)').single()
    if (data) setDeals(prev => [data as FlashDeal, ...prev])
    setForm({ ...EMPTY, ends_at: defaultEndsAt() })
    setOpen(false)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await supabase.from('flash_deals').delete().eq('id', id)
    setDeals(prev => prev.filter(d => d.id !== id))
    setDeleting(null)
  }

  const handleToggle = async (deal: FlashDeal) => {
    setToggling(deal.id)
    await supabase.from('flash_deals').update({ is_active: !deal.is_active }).eq('id', deal.id)
    setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, is_active: !d.is_active } : d))
    setToggling(null)
  }

  const now = new Date()

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Flash Deals</h1>
          <p className="text-sm text-gray-400 mt-0.5">Limited-time discounted deals — homepage par countdown timer ke saath dikhai denge</p>
        </div>
        <span className="bg-amber-50 text-amber-700 border border-amber-100 text-sm font-bold px-3 py-1 rounded-full">
          {deals.filter(d => d.is_active && new Date(d.ends_at) > now).length} live
        </span>
      </div>

      {/* Add form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] overflow-hidden mb-6">
        <button type="button" onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-sm font-bold text-gray-800">Naya Flash Deal Banao</span>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {open && (
          <form onSubmit={handleAdd} className="border-t border-gray-100 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Product *</label>
              <select required value={form.product_id} onChange={e => set('product_id', e.target.value)} className={INPUT}>
                <option value="">-- Product chuno --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.price ? ` — ${formatCurrency(p.price)}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL}>Flash Price (₹) *</label>
              <input type="number" min="0" step="0.01" required
                value={form.flash_price} onChange={e => set('flash_price', e.target.value)}
                placeholder="e.g. 799" className={INPUT} />
            </div>

            <div>
              <label className={LABEL}>Deal Label</label>
              <input type="text" value={form.label} onChange={e => set('label', e.target.value)} className={INPUT} />
            </div>

            <div>
              <label className={LABEL}>Deal Ends At *</label>
              <input type="datetime-local" required
                value={form.ends_at} onChange={e => set('ends_at', e.target.value)} className={INPUT} />
            </div>

            <div className="sm:col-span-2">
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {loading ? 'Ban raha hai…' : 'Flash Deal Banao'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* List */}
      {deals.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-12 text-center">
          <Zap className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Abhi koi flash deal nahi</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {deals.map(deal => {
            const endsAt  = new Date(deal.ends_at)
            const expired = endsAt < now
            const origPrice = (deal.products as any)?.price
            const saving = origPrice ? origPrice - deal.flash_price : null
            const savePct = saving && origPrice ? Math.round((saving / origPrice) * 100) : null

            return (
              <div key={deal.id}
                className={`bg-white rounded-xl border shadow-[0_1px_4px_rgba(0,0,0,0.07)] px-5 py-4 flex items-center gap-4 flex-wrap hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition-shadow ${(!deal.is_active || expired) ? 'opacity-60 border-gray-100' : 'border-gray-100'}`}>

                {/* Discount badge */}
                <div className="bg-amber-50 border border-amber-100 text-amber-700 font-black text-sm px-3 py-1.5 rounded-lg shrink-0 text-center min-w-[64px]">
                  {savePct ? `-${savePct}%` : `₹${deal.flash_price}`}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{(deal.products as any)?.name ?? '—'}</p>
                    {expired && <span className="text-[10px] font-bold bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full">Expired</span>}
                    {!deal.is_active && !expired && <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs text-gray-400">
                    <span>Flash: <strong className="text-red-500">{formatCurrency(deal.flash_price)}</strong></span>
                    {origPrice && <span>Original: <strong className="text-gray-600">{formatCurrency(origPrice)}</strong></span>}
                    <span>Ends: {endsAt.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Toggle */}
                <button onClick={() => handleToggle(deal)} disabled={toggling === deal.id}
                  className="p-2 text-gray-300 hover:text-indigo-500 rounded-lg transition-colors disabled:opacity-50">
                  {toggling === deal.id
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : deal.is_active ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5" />}
                </button>

                {/* Delete */}
                <button onClick={() => handleDelete(deal.id)} disabled={deleting === deal.id}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                  {deleting === deal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
