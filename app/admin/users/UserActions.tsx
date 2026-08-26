'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Ban, CheckCircle, Loader2 } from 'lucide-react'

export default function UserActions({ userId, isBlocked }: { userId: string; isBlocked: boolean }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    await supabase.from('profiles').update({ is_blocked: !isBlocked }).eq('id', userId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
        isBlocked
          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100'
          : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-100'
      }`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isBlocked ? (
        <><CheckCircle className="w-3.5 h-3.5" /> Unblock</>
      ) : (
        <><Ban className="w-3.5 h-3.5" /> Block</>
      )}
    </button>
  )
}
