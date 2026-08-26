import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { ArrowDownToLine } from 'lucide-react'
import WithdrawalActions from './WithdrawalActions'
import type { WithdrawalStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<WithdrawalStatus, string> = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  paid:     'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default async function WithdrawalRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: filterStatus } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('withdrawal_requests')
    .select('*, profiles(id, name)')
    .order('created_at', { ascending: false })

  if (filterStatus && filterStatus !== 'all') {
    query = query.eq('status', filterStatus)
  }

  const { data: requests } = await query

  const tabs: { label: string; value: string }[] = [
    { label: 'All',      value: 'all'      },
    { label: 'Pending',  value: 'pending'  },
    { label: 'Approved', value: 'approved' },
    { label: 'Paid',     value: 'paid'     },
    { label: 'Rejected', value: 'rejected' },
  ]

  const activeTab = filterStatus ?? 'all'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ArrowDownToLine className="w-5 h-5 text-indigo-500" /> Withdrawal Requests
        </h1>
        <p className="text-sm text-gray-400 mt-1">{requests?.length ?? 0} requests</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {tabs.map(tab => (
          <a
            key={tab.value}
            href={tab.value === 'all' ? '/admin/withdrawal-requests' : `/admin/withdrawal-requests?status=${tab.value}`}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              activeTab === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {!requests || requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
          No withdrawal requests found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment Details</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{(req.profiles as any)?.name ?? '—'}</p>
                    <p className="text-xs text-gray-400 font-mono">{req.user_id.slice(0, 8)}…</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-900">{formatCurrency(req.amount)}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 space-y-0.5">
                    {req.upi_id      && <p>UPI: <span className="font-mono text-gray-700">{req.upi_id}</span></p>}
                    {req.pan_number  && <p>PAN: <span className="font-mono text-gray-700">{req.pan_number}</span></p>}
                    {req.bank_account && <p>A/C: <span className="font-mono text-gray-700">{req.bank_account}</span></p>}
                    {req.bank_ifsc   && <p>IFSC: <span className="font-mono text-gray-700">{req.bank_ifsc}</span></p>}
                    {req.admin_note  && <p className="text-orange-500 italic mt-1">Note: {req.admin_note}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_BADGE[req.status as WithdrawalStatus]}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(req.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <WithdrawalActions id={req.id} currentStatus={req.status as WithdrawalStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
