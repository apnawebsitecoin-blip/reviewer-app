'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Ban, CheckCircle } from 'lucide-react'

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
    <button onClick={toggle} disabled={loading}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition disabled:opacity-50 ${
        isBlocked ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'
      }`}>
      {isBlocked ? <><CheckCircle className="w-3 h-3" />Unblock</> : <><Ban className="w-3 h-3" />Block</>}
    </button>
  )
}
