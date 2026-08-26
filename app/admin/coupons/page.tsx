'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Ticket, Plus, Trash2, Loader2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-react'
import type { Coupon, Product } from '@/lib/types'

const CATEGORIES = ['Electronics', 'Beauty', 'Kitchen', 'Fashion', 'Health', 'Books', 'Sports', 'Home', 'Toys', 'Other']
const INPUT  = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition bg-white'
const LABEL  = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'

type Scope = 'global' | 'category' | 'product'

const EMPTY_FORM = {
  code: '', title: '',
  discount_type: 'percent' as 'percent' | 'flat',
  discount_value: '',
  scope: 'global' as Scope,
  category: 'Electronics',
  product_id: '',
  expires_at: '',
}

export default function AdminCouponsPage() {
  const supabase = createClient()
  const [coupons,  setCoupons]  = useState<Coupon[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [form,     setForm]     = useState(EMPTY_FORM)

  useEffect(() => {
    supabase.from('coupons').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setCoupons((data as Coupon[]) ?? []))
    supabase.from('products').select('id, name, category').order('name')
      .then(({ data }) => setProducts((data as Product[]) ?? []))
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data } = await supabase.from('coupons').insert({
      code:           form.code.toUpperCase().trim(),
      title:          form.title.trim(),
      discount_type:  form.discount_type,
      discount_value: parseFloat(form.discount_value),
      product_id:     form.scope === 'product'  ? form.product_id  : null,
      category:       form.scope === 'category' ? form.category     : null,
      expires_at:     form.expires_at || null,
      is_active:      true,
    }).select().single()
    if (data) setCoupons(prev => [data as Coupon, ...prev])
    setForm(EMPTY_FORM)
    setOpen(false)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await supabase.from('coupons').delete().eq('id', id)
    setCoupons(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
  }

  const handleToggle = async (coupon: Coupon) => {
    setToggling(coupon.id)
    await supabase.from('coupons').update({ is_active: !coupon.is_active }).eq('id', coupon.id)
    setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
    setToggling(null)
  }

  const activeCoupons   = coupons.filter(c => c.is_active)
  const inactiveCoupons = coupons.filter(c => !c.is_active)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-400 mt-0.5">Product ya category ke liye discount codes manage karo</p>
        </div>
        <span className="bg-amber-50 text-amber-700 border border-amber-100 text-sm font-bold px-3 py-1 rounded-full">
          {activeCoupons.length} active
        </span>
      </div>

      {/* Add form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] overflow-hidden mb-6">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-sm font-bold text-gray-800">Naya Coupon Banao</span>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {open && (
          <form onSubmit={handleAdd} className="border-t border-gray-100 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Code */}
            <div>
              <label className={LABEL}>Coupon Code *</label>
              <input
                value={form.code}
                onChange={e => set('code', e.target.value.toUpperCase())}
                placeholder="SAVE20"
                required
                className={`${INPUT} font-mono tracking-widest uppercase`}
              />
            </div>

            {/* Title */}
            <div>
              <label className={LABEL}>Title / Description *</label>
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Electronics par 20% off"
                required
                className={INPUT}
              />
            </div>

            {/* Discount type + value */}
            <div className="flex gap-3">
              <div className="w-36 shrink-0">
                <label className={LABEL}>Type</label>
                <select value={form.discount_type} onChange={e => set('discount_type', e.target.value)} className={INPUT}>
                  <option value="percent">Percent (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
              </div>
              <div className="flex-1">
                <label className={LABEL}>Value *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.discount_value}
                  onChange={e => set('discount_value', e.target.value)}
                  placeholder={form.discount_type === 'percent' ? '20' : '200'}
                  className={INPUT}
                />
              </div>
            </div>

            {/* Expiry */}
            <div>
              <label className={LABEL}>Expiry Date (optional)</label>
              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={e => set('expires_at', e.target.value)}
                className={INPUT}
              />
            </div>

            {/* Scope */}
            <div className="sm:col-span-2">
              <label className={LABEL}>Scope — Yeh coupon kahan dikhega?</label>
              <div className="flex gap-3 flex-wrap">
                {([
                  { val: 'global',   label: '🌐 Sab Products (Site-wide)' },
                  { val: 'category', label: '📂 Ek Category' },
                  { val: 'product',  label: '📦 Ek Product' },
                ] as { val: Scope; label: string }[]).map(opt => (
                  <label key={opt.val} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      value={opt.val}
                      checked={form.scope === opt.val}
                      onChange={() => set('scope', opt.val)}
                      className="accent-amber-500"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Conditional: category or product selector */}
            {form.scope === 'category' && (
              <div>
                <label className={LABEL}>Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} className={INPUT}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            {form.scope === 'product' && (
              <div>
                <label className={LABEL}>Product</label>
                <select value={form.product_id} onChange={e => set('product_id', e.target.value)} required className={INPUT}>
                  <option value="">-- Product chuno --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
                {loading ? 'Ban raha hai…' : 'Coupon Banao'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Coupon list */}
      {coupons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-12 text-center">
          <Ticket className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Abhi koi coupon nahi — ऊपर se banao</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {[...activeCoupons, ...inactiveCoupons].map(coupon => {
            const expDate  = coupon.expires_at ? new Date(coupon.expires_at) : null
            const isExpired = expDate ? expDate < new Date() : false
            const discLabel = coupon.discount_type === 'percent'
              ? `${coupon.discount_value}% OFF`
              : `₹${coupon.discount_value} OFF`
            const scopeLabel = coupon.product_id
              ? `Product: ${products.find(p => p.id === coupon.product_id)?.name ?? coupon.product_id}`
              : coupon.category
              ? `Category: ${coupon.category}`
              : 'Site-wide'

            return (
              <div
                key={coupon.id}
                className={`bg-white rounded-xl border shadow-[0_1px_4px_rgba(0,0,0,0.07)] px-5 py-4 flex items-center gap-4 flex-wrap hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition-shadow ${
                  !coupon.is_active || isExpired ? 'border-gray-100 opacity-60' : 'border-gray-100'
                }`}
              >
                {/* Discount badge */}
                <div className="bg-amber-50 border border-amber-100 text-amber-700 font-black text-sm px-3 py-1.5 rounded-lg shrink-0 min-w-[72px] text-center">
                  {discLabel}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-sm font-mono font-bold text-gray-900 tracking-widest">{coupon.code}</code>
                    {isExpired && (
                      <span className="text-[10px] font-bold bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full">Expired</span>
                    )}
                    {!coupon.is_active && !isExpired && (
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{coupon.title}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{scopeLabel}</span>
                    {expDate && (
                      <span className="text-[10px] text-gray-400">
                        Expires {expDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Toggle active */}
                <button
                  onClick={() => handleToggle(coupon)}
                  disabled={toggling === coupon.id}
                  title={coupon.is_active ? 'Deactivate' : 'Activate'}
                  className="p-2 text-gray-300 hover:text-indigo-500 rounded-lg transition-colors disabled:opacity-50"
                >
                  {toggling === coupon.id
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : coupon.is_active
                    ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                    : <ToggleLeft className="w-5 h-5" />
                  }
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(coupon.id)}
                  disabled={deleting === coupon.id}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting === coupon.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
