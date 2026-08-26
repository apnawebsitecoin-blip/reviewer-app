'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Banknote } from 'lucide-react'
import type { WithdrawalStatus } from '@/lib/types'

interface Props {
  id: string
  currentStatus: WithdrawalStatus
}

export default function WithdrawalActions({ id, currentStatus }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showReject, setShowReject] = useState(false)
  const [note, setNote] = useState('')

  const update = async (status: WithdrawalStatus, admin_note?: string) => {
    setLoading(status)
    const { data: req } = await supabase
      .from('withdrawal_requests')
      .update({ status, ...(admin_note !== undefined ? { admin_note } : {}) })
      .eq('id', id)
      .select('user_id, amount')
      .single()

    if (req) {
      fetch('/api/admin/notify-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: req.user_id, status, amount: req.amount }),
      }).catch(() => {})
    }

    setLoading(null)
    setShowReject(false)
    router.refresh()
  }

  if (currentStatus === 'paid') {
    return <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Paid</span>
  }

  if (currentStatus === 'rejected') {
    return <span className="text-xs font-bold text-red-500 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />Rejected</span>
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      <div className="flex gap-2">
        {currentStatus === 'pending' && (
          <button
            onClick={() => update('approved')}
            disabled={loading !== null}
            className="flex items-center gap-1 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {loading === 'approved' ? '…' : 'Approve'}
          </button>
        )}
        {currentStatus === 'approved' && (
          <button
            onClick={() => update('paid')}
            disabled={loading !== null}
            className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Banknote className="w-3.5 h-3.5" />
            {loading === 'paid' ? '…' : 'Mark Paid'}
          </button>
        )}
        {(currentStatus === 'pending' || currentStatus === 'approved') && (
          <button
            onClick={() => setShowReject(v => !v)}
            disabled={loading !== null}
            className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 text-xs px-3 py-1.5 rounded-lg hover:bg-red-100 disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            Reject
          </button>
        )}
      </div>

      {showReject && (
        <div className="flex gap-2 w-full">
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Reason (optional)"
            className="flex-1 border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-red-400"
          />
          <button
            onClick={() => update('rejected', note)}
            disabled={loading !== null}
            className="bg-red-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading === 'rejected' ? '…' : 'Confirm'}
          </button>
        </div>
      )}
    </div>
  )
}
