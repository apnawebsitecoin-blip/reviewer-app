'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'

export default function ReviewActions({ reviewId, reviewerId }: { reviewId: string; reviewerId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const approve = async () => {
    setLoading(true)
    await supabase.from('reviews').update({ verified: true }).eq('id', reviewId)
    // Fallback: send notification in case DB trigger doesn't fire
    await supabase.from('notifications').insert({
      user_id: reviewerId,
      message: 'आपका रिव्यू approve हो गया! अब आपका review सबको दिखेगा। 🎉',
    })
    router.refresh()
    setLoading(false)
  }

  const reject = async () => {
    setLoading(true)
    await supabase.from('reviews').delete().eq('id', reviewId)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex gap-2">
      <button onClick={approve} disabled={loading}
        className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 disabled:opacity-60">
        <Check className="w-3.5 h-3.5" />Approve
      </button>
      <button onClick={reject} disabled={loading}
        className="flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-600 disabled:opacity-60">
        <X className="w-3.5 h-3.5" />Reject
      </button>
    </div>
  )
}
