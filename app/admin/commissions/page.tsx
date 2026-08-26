import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import CommissionActions from './CommissionActions'
import AddCommissionForm from './AddCommissionForm'
import { DollarSign } from 'lucide-react'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid:      'bg-emerald-50 text-emerald-700 border border-emerald-100',
    confirmed: 'bg-blue-50 text-blue-700 border border-blue-100',
    pending:   'bg-amber-50 text-amber-700 border border-amber-100',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${styles[status] ?? 'bg-gray-50 text-gray-600 border border-gray-100'}`}>
      {status}
    </span>
  )
}

export default async function AdminCommissionsPage() {
  const supabase = await createClient()

  const { data: commissions } = await supabase
    .from('commissions')
    .select('*, profiles(name), clicks(product_id, products(name))')
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: clicks } = await supabase
    .from('clicks')
    .select('id, product_id, reviewer_id, clicked_at, profiles(name), products(name)')
    .order('clicked_at', { ascending: false })
    .limit(50)

  const list = commissions ?? []

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Commissions</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage and track reviewer earnings</p>
        </div>
        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm font-bold px-3 py-1 rounded-full">
          {list.length} records
        </span>
      </div>

      {/* Add commission form */}
      <AddCommissionForm clicks={(clicks ?? []) as any[]} />

      {/* Commission list */}
      <div className="mt-6">
        {list.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-12 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-emerald-300" />
            </div>
            <p className="text-sm text-gray-400">Koi commission record nahi</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Reviewer</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sale Amount</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Reviewer Share</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {list.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-gray-900">{(c.profiles as any)?.name ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3.5 text-gray-700 font-medium">
                        {formatCurrency(c.sale_amount)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-emerald-700">{formatCurrency(c.reviewer_share)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400">
                        {formatDate(c.created_at)}
                      </td>
                      <td className="px-4 py-3.5">
                        <CommissionActions commissionId={c.id} currentStatus={c.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
