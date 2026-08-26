'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, Banknote } from 'lucide-react'

export default function CommissionActions({
  commissionId,
  currentStatus,
}: {
  commissionId: string
  currentStatus: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const update = async (status: string) => {
    setLoading(true)
    await supabase.from('commissions').update({ status }).eq('id', commissionId)
    router.refresh()
    setLoading(false)
  }

  if (currentStatus === 'paid') {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5" /> Paid
      </span>
    )
  }

  return (
    <div className="flex gap-2">
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      ) : currentStatus === 'pending' ? (
        <button
          onClick={() => update('confirmed')}
          className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Confirm
        </button>
      ) : (
        <button
          onClick={() => update('paid')}
          className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        >
          <Banknote className="w-3.5 h-3.5" /> Mark Paid
        </button>
      )}
    </div>
  )
}
