'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Plus, Loader2 } from 'lucide-react'

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition bg-white'
const LABEL = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'

interface Click {
  id: string
  product_id: string
  reviewer_id: string
  clicked_at: string
  profiles?: { name: string }
  products?: { name: string }
}

export default function AddCommissionForm({ clicks }: { clicks: Click[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ click_id: '', sale_amount: '', total_commission: '' })

  const selectedClick = clicks.find(c => c.id === form.click_id)
  const saleAmt = parseFloat(form.sale_amount) || 0
  const totalComm = parseFloat(form.total_commission) || 0
  const reviewerShare = totalComm * 0.6
  const platformShare = totalComm * 0.4
  const buyerShare = totalComm * 0.1

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClick) return
    setLoading(true)
    await supabase.from('commissions').insert({
      click_id: form.click_id,
      reviewer_id: selectedClick.reviewer_id,
      sale_amount: saleAmt,
      total_commission: totalComm,
      reviewer_share: reviewerShare,
      platform_share: platformShare,
      buyer_share: buyerShare,
      status: 'pending',
    })
    setForm({ click_id: '', sale_amount: '', total_commission: '' })
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Plus className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-sm font-bold text-gray-800">Naya Commission Record Jodo</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="border-t border-gray-100 p-5 space-y-4">
          <div>
            <label className={LABEL}>Click Select Karo</label>
            <select
              value={form.click_id}
              onChange={e => setForm(p => ({ ...p, click_id: e.target.value }))}
              required
              className={INPUT}
            >
              <option value="">-- Click Chuno --</option>
              {clicks.map(c => (
                <option key={c.id} value={c.id}>
                  {(c.products as any)?.name ?? c.product_id} — {(c.profiles as any)?.name ?? c.reviewer_id} — {new Date(c.clicked_at).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Sale Amount (₹)</label>
              <input
                type="number"
                required
                value={form.sale_amount}
                onChange={e => setForm(p => ({ ...p, sale_amount: e.target.value }))}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Network Commission (₹)</label>
              <input
                type="number"
                required
                value={form.total_commission}
                onChange={e => setForm(p => ({ ...p, total_commission: e.target.value }))}
                className={INPUT}
              />
            </div>
          </div>

          {totalComm > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Commission Breakdown</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Reviewer (60%)</span>
                <span className="font-semibold text-emerald-600">₹{reviewerShare.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Platform (40%)</span>
                <span className="font-semibold text-indigo-600">₹{platformShare.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Buyer Cashback (10% of platform)</span>
                <span className="font-semibold text-blue-500">₹{buyerShare.toFixed(2)}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Jod raha hai…</> : <><Plus className="w-4 h-4" /> Commission Record Jodo</>}
          </button>
        </form>
      )}
    </div>
  )
}
