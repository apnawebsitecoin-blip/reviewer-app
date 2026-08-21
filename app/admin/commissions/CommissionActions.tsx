'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CommissionActions({ commissionId, currentStatus }: { commissionId: string; currentStatus: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const update = async (status: string) => {
    setLoading(true)
    await supabase.from('commissions').update({ status }).eq('id', commissionId)
    router.refresh()
    setLoading(false)
  }

  if (currentStatus === 'paid') return <span className="text-xs text-gray-400">Paid ✓</span>

  return (
    <div className="flex gap-2">
      {currentStatus === 'pending' && (
        <button onClick={() => update('confirmed')} disabled={loading}
          className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700 disabled:opacity-60">
          Confirm
        </button>
      )}
      {currentStatus === 'confirmed' && (
        <button onClick={() => update('paid')} disabled={loading}
          className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-700 disabled:opacity-60">
          Mark Paid
        </button>
      )}
    </div>
  )
}
