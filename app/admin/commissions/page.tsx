import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import CommissionActions from './CommissionActions'
import AddCommissionForm from './AddCommissionForm'

export const dynamic = 'force-dynamic'

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

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">Commission Management</h1>

      <AddCommissionForm clicks={(clicks ?? []) as any[]} />

      <div className="mt-6 space-y-3">
        {(commissions ?? []).length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">कोई commission record नहीं</div>
        ) : (
          (commissions ?? []).map(c => (
            <div key={c.id} className="bg-white rounded-xl shadow p-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm">{(c.profiles as any)?.name ?? 'User'}</p>
                <p className="text-xs text-gray-400">{formatDate(c.created_at)}</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap text-sm">
                <span>Sale: {formatCurrency(c.sale_amount)}</span>
                <span className="text-green-600 font-medium">Reviewer: {formatCurrency(c.reviewer_share)}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  c.status === 'paid' ? 'bg-green-100 text-green-700' :
                  c.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                }`}>{c.status}</span>
              </div>
              <CommissionActions commissionId={c.id} currentStatus={c.status} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
