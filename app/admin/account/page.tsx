import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserCircle } from 'lucide-react'
import AccountSettingsForm from './AccountSettingsForm'

export const dynamic = 'force-dynamic'

export default async function AccountSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
          <UserCircle className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage your admin login credentials</p>
        </div>
      </div>

      <AccountSettingsForm currentEmail={user.email ?? ''} />
    </div>
  )
}
