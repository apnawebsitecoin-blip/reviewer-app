import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import UserActions from './UserActions'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: users } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">Users ({(users ?? []).length})</h1>
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-gray-400 text-left">
                <th className="px-4 py-3">नाम</th>
                <th className="px-4 py-3">Trust Score</th>
                <th className="px-4 py-3">Wallet</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(users ?? []).map(u => (
                <tr key={u.id} className={u.is_blocked ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{u.name ?? 'No name'}</p>
                    <p className="text-xs text-gray-400">{u.referral_code}</p>
                  </td>
                  <td className="px-4 py-3 text-yellow-600 font-medium">{u.trust_score}</td>
                  <td className="px-4 py-3 text-green-600 font-medium">{formatCurrency(u.wallet_balance)}</td>
                  <td className="px-4 py-3">
                    {u.is_admin && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs mr-1">Admin</span>}
                    {u.is_blocked && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">Blocked</span>}
                    {!u.is_admin && !u.is_blocked && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">Active</span>}
                  </td>
                  <td className="px-4 py-3">
                    <UserActions userId={u.id} isBlocked={u.is_blocked} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
