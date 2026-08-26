'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface Props {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  productName: string
  productUrl: string
  price: number | null
  category: string | null
}

export default function DealActions({ id, status, productName, productUrl, price, category }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [showReject, setShowReject] = useState(false)
  const [adminNote, setAdminNote] = useState('')

  const approve = async () => {
    setLoading('approve')

    // Update community_deal status
    await supabase
      .from('community_deals')
      .update({ status: 'approved' })
      .eq('id', id)

    // Insert into products table
    await supabase.from('products').insert({
      name: productName,
      original_url: productUrl,
      price: price ?? null,
      category: category ?? null,
    })

    setLoading(null)
    router.refresh()
  }

  const reject = async () => {
    setLoading('reject')
    await supabase
      .from('community_deals')
      .update({ status: 'rejected', admin_note: adminNote.trim() || null })
      .eq('id', id)
    setLoading(null)
    setShowReject(false)
    router.refresh()
  }

  if (status === 'approved') {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
      </span>
    )
  }

  if (status === 'rejected') {
    return (
      <span className="flex items-center gap-1 text-xs text-red-500 font-semibold">
        <XCircle className="w-3.5 h-3.5" /> Rejected
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      <div className="flex gap-2">
        <button
          onClick={approve}
          disabled={loading !== null}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
        >
          {loading === 'approve'
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <CheckCircle2 className="w-3.5 h-3.5" />}
          Approve
        </button>
        <button
          onClick={() => setShowReject(v => !v)}
          disabled={loading !== null}
          className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
        >
          <XCircle className="w-3.5 h-3.5" />
          Reject
        </button>
      </div>

      {showReject && (
        <div className="flex gap-2 w-full mt-1">
          <input
            type="text"
            value={adminNote}
            onChange={e => setAdminNote(e.target.value)}
            placeholder="Reason (optional)"
            className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-400"
          />
          <button
            onClick={reject}
            disabled={loading !== null}
            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-60"
          >
            {loading === 'reject' ? '…' : 'Confirm'}
          </button>
        </div>
      )}
    </div>
  )
}
