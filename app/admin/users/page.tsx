import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import UserActions from './UserActions'
import PremiumToggle from './PremiumToggle'
import { Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const list = users ?? []

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Users</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage reviewer accounts</p>
        </div>
        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm font-bold px-3 py-1 rounded-full">
          {list.length} users
        </span>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-12 text-center">
          <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Koi user nahi mila</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Trust Score</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Wallet</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Premium</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {list.map(u => (
                  <tr key={u.id} className={`hover:bg-gray-50/70 transition-colors ${u.is_blocked ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                          {(u.name ?? 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{u.name ?? 'No name'}</p>
                          <p className="text-xs text-gray-400 font-mono">{u.referral_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-sm">
                        ⭐ {u.trust_score}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-emerald-700">{formatCurrency(u.wallet_balance)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {u.is_admin && (
                          <span className="bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                            Admin
                          </span>
                        )}
                        {u.is_blocked ? (
                          <span className="bg-red-50 text-red-700 border border-red-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                            Blocked
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <PremiumToggle userId={u.id} isPremium={u.is_premium ?? false} />
                    </td>
                    <td className="px-4 py-3.5">
                      <UserActions userId={u.id} isBlocked={u.is_blocked} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
