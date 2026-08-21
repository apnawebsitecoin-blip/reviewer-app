'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ChevronDown, Plus } from 'lucide-react'

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
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50">
        <span className="font-semibold text-gray-800 flex items-center gap-2"><Plus className="w-4 h-4 text-indigo-600" />नया Commission Record जोड़ें</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <form onSubmit={handleSubmit} className="p-5 pt-0 border-t space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Click Select करें</label>
            <select value={form.click_id} onChange={e => setForm(p => ({ ...p, click_id: e.target.value }))} required
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">-- Click चुनें --</option>
              {clicks.map(c => (
                <option key={c.id} value={c.id}>
                  {(c.products as any)?.name ?? c.product_id} — {(c.profiles as any)?.name ?? c.reviewer_id} — {new Date(c.clicked_at).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sale Amount (₹)</label>
              <input type="number" required value={form.sale_amount} onChange={e => setForm(p => ({ ...p, sale_amount: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Network Commission (₹)</label>
              <input type="number" required value={form.total_commission} onChange={e => setForm(p => ({ ...p, total_commission: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          {totalComm > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
              <p className="text-green-600">Reviewer (60%): ₹{reviewerShare.toFixed(2)}</p>
              <p className="text-indigo-600">Platform (40%): ₹{platformShare.toFixed(2)}</p>
              <p className="text-blue-500">Buyer cashback (10% of platform): ₹{buyerShare.toFixed(2)}</p>
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60">
            {loading ? 'जोड़ा जा रहा है...' : 'Commission Record जोड़ें'}
          </button>
        </form>
      )}
    </div>
  )
}
