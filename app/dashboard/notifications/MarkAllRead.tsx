'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function MarkAllRead({ userId }: { userId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const markRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId)
    router.refresh()
  }
  return (
    <button onClick={markRead} className="text-sm text-indigo-600 hover:underline">सभी read करें</button>
  )
}
