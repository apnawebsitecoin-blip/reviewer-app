import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import AnalyticsExport from './AnalyticsExport'
import {
  Users, Star, CheckCircle2, Package,
  MousePointerClick, DollarSign, TrendingUp, ArrowDownToLine,
  Calendar, BarChart3,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

function StatCard({
  label,
  value,
  icon,
  bg,
  iconColor,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  bg: string
  iconColor: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${bg}`}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      <p className="text-xs font-medium text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [
    { count: totalUsers },
    { count: totalReviews },
    { count: verifiedReviews },
    { count: totalProducts },
    { count: totalClicks },
    { data: commData },
    { data: reviewsWithProducts },
    { count: newUsers },
    { count: newReviews },
    { data: pendingWithdrawals },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('verified', true),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('clicks').select('*', { count: 'exact', head: true }),
    supabase.from('commissions').select('reviewer_share').in('status', ['confirmed', 'paid']),
    supabase.from('reviews').select('product_id, products(name)').eq('verified', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()),
    supabase.from('withdrawal_requests').select('amount').eq('status', 'pending'),
  ])

  const totalCommissions = (commData ?? []).reduce((s, c) => s + (c.reviewer_share ?? 0), 0)

  // Compute top 5 products by review count client-side from joined data
  const productCountMap: Record<string, { name: string; count: number }> = {}
  for (const row of reviewsWithProducts ?? []) {
    const pid = row.product_id
    const name = (row.products as any)?.name
    if (!pid || !name) continue
    if (!productCountMap[pid]) productCountMap[pid] = { name, count: 0 }
    productCountMap[pid].count++
  }
  const topProducts = Object.values(productCountMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(p => ({ name: p.name, review_count: p.count }))

  const pendingWithdrawalCount = pendingWithdrawals?.length ?? 0
  const pendingWithdrawalSum = (pendingWithdrawals ?? []).reduce((s, w) => s + (w.amount ?? 0), 0)

  // Stats object for export
  const exportStats: Record<string, string | number> = {
    'Total Users': totalUsers ?? 0,
    'Total Reviews': totalReviews ?? 0,
    'Verified Reviews': verifiedReviews ?? 0,
    'Total Products': totalProducts ?? 0,
    'Total Clicks': totalClicks ?? 0,
    'Commissions (Confirmed+Paid)': formatCurrency(totalCommissions),
    'New Users This Month': newUsers ?? 0,
    'New Reviews This Month': newReviews ?? 0,
    'Pending Withdrawals Count': pendingWithdrawalCount,
    'Pending Withdrawals Amount': formatCurrency(pendingWithdrawalSum),
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">Platform-wide metrics and insights</p>
        </div>
        <AnalyticsExport stats={exportStats} topProducts={topProducts} />
      </div>

      {/* Main stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users"        value={totalUsers ?? 0}                   bg="bg-blue-50"    iconColor="#2563EB" icon={<Users     style={{ width: 18, height: 18 }} />} />
        <StatCard label="Total Reviews"      value={totalReviews ?? 0}                 bg="bg-indigo-50"  iconColor="#4F46E5" icon={<Star      style={{ width: 18, height: 18 }} />} />
        <StatCard label="Verified Reviews"   value={verifiedReviews ?? 0}              bg="bg-emerald-50" iconColor="#16A34A" icon={<CheckCircle2 style={{ width: 18, height: 18 }} />} />
        <StatCard label="Total Products"     value={totalProducts ?? 0}               bg="bg-purple-50"  iconColor="#7C3AED" icon={<Package   style={{ width: 18, height: 18 }} />} />
        <StatCard label="Total Clicks"       value={totalClicks ?? 0}                 bg="bg-pink-50"    iconColor="#DB2777" icon={<MousePointerClick style={{ width: 18, height: 18 }} />} />
        <StatCard label="Commissions Earned" value={formatCurrency(totalCommissions)}  bg="bg-green-50"   iconColor="#059669" icon={<DollarSign style={{ width: 18, height: 18 }} />} />
        <StatCard label="New Users (Month)"  value={newUsers ?? 0}                    bg="bg-cyan-50"    iconColor="#0891B2" icon={<Calendar  style={{ width: 18, height: 18 }} />} />
        <StatCard label="New Reviews (Month)" value={newReviews ?? 0}                 bg="bg-amber-50"   iconColor="#D97706" icon={<TrendingUp style={{ width: 18, height: 18 }} />} />
      </div>

      {/* Pending Withdrawals summary */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
            <ArrowDownToLine className="w-4 h-4 text-orange-500" />
          </div>
          <h2 className="font-bold text-gray-800">Pending Withdrawals</h2>
        </div>
        <p className="text-sm text-gray-500 ml-11">
          <span className="font-semibold text-gray-900">{pendingWithdrawalCount}</span>{' '}
          request{pendingWithdrawalCount !== 1 ? 's' : ''} totalling{' '}
          <span className="font-semibold text-orange-600">{formatCurrency(pendingWithdrawalSum)}</span>
        </p>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
          </div>
          <h2 className="font-bold text-gray-800">Top 5 Products by Reviews</h2>
        </div>

        {topProducts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No verified review data yet</p>
        ) : (
          <div className="space-y-3">
            {topProducts.map((p, i) => {
              const maxCount = topProducts[0]?.review_count ?? 1
              const pct = Math.round((p.review_count / maxCount) * 100)
              return (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                      <span className="text-sm font-semibold text-gray-800 line-clamp-1 max-w-[280px]">{p.name}</span>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 shrink-0 ml-2">
                      {p.review_count} {p.review_count === 1 ? 'review' : 'reviews'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
