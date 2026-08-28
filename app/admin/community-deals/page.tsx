import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import DealActions from './DealActions'
import Link from 'next/link'
import { ExternalLink, ShoppingBag } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Status = 'pending' | 'approved' | 'rejected'

export default async function AdminCommunityDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const activeStatus = (params.status as Status) ?? 'pending'

  const [{ data: deals }, { count: pendingCount }] = await Promise.all([
    supabase
      .from('community_deals')
      .select('*, profiles(name)')
      .eq('status', activeStatus)
      .order('created_at', { ascending: false }),
    supabase
      .from('community_deals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  const list = deals ?? []

  const tabs: { label: string; value: Status }[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Community Deals</h1>
          <p className="text-sm text-gray-400 mt-0.5">User-submitted product deals</p>
        </div>
        {(pendingCount ?? 0) > 0 && (
          <span className="bg-amber-50 text-amber-700 border border-amber-100 text-sm font-bold px-3 py-1 rounded-full">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <Link
            key={tab.value}
            href={`/admin/community-deals?status=${tab.value}`}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeStatus === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-12 text-center">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-6 h-6 text-indigo-300" />
          </div>
          <p className="text-sm text-gray-400">No {activeStatus} deals</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">URL</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {list.map(deal => (
                  <tr key={deal.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-800 text-sm">
                        {(deal.profiles as any)?.name ?? 'Unknown'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-gray-900 max-w-[180px] line-clamp-1">{deal.product_name}</p>
                      {deal.description && (
                        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{deal.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-gray-900">
                      {deal.price ? formatCurrency(deal.price) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      {deal.category ? (
                        <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
                          {deal.category}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <a
                        href={deal.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> View
                      </a>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400">
                      {formatDate(deal.created_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <DealActions
                        id={deal.id}
                        status={deal.status as 'pending' | 'approved' | 'rejected'}
                        productName={deal.product_name}
                        productUrl={deal.product_url}
                        price={deal.price}
                        category={deal.category}
                        imageUrl={deal.image_url ?? null}
                      />
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
