import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import MarkAllRead from './MarkAllRead'
import { Bell } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Bell className="w-5 h-5" />Notifications</h1>
      </div>
      <div className="bg-white rounded-2xl shadow divide-y">
        {(notifications ?? []).length === 0 ? (
          <div className="p-8 text-center text-gray-400">कोई notification नहीं</div>
        ) : (
          (notifications ?? []).map(n => (
            <div key={n.id} className="p-4 flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-700">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
