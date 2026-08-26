'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2 } from 'lucide-react'

export default function ReviewActions({ reviewId, reviewerId }: { reviewId: string; reviewerId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  const approve = async () => {
    setLoading('approve')
    await supabase.from('reviews').update({ verified: true }).eq('id', reviewId)
    await supabase.from('notifications').insert({
      user_id: reviewerId,
      message: 'आपका रिव्यू approve हो गया! अब आपका review सबको दिखेगा। 🎉',
    })
    router.refresh()
    setLoading(null)
  }

  const reject = async () => {
    setLoading('reject')
    await supabase.from('reviews').delete().eq('id', reviewId)
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={approve}
        disabled={!!loading}
        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
      >
        {loading === 'approve'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Check className="w-3.5 h-3.5" />}
        Approve
      </button>
      <button
        onClick={reject}
        disabled={!!loading}
        className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
      >
        {loading === 'reject'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <X className="w-3.5 h-3.5" />}
        Reject
      </button>
    </div>
  )
}
