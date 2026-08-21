import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { Users, Package, Star, MousePointerClick, DollarSign } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: totalProducts },
    { count: verifiedReviews },
    { count: pendingReviews },
    { count: totalClicks },
    { data: commData },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('verified', true),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('verified', false),
    supabase.from('clicks').select('*', { count: 'exact', head: true }),
    supabase.from('commissions').select('reviewer_share, status'),
  ])

  const todayStart = new Date(); todayStart.setHours(0,0,0,0)
  const { count: todayClicks } = await supabase.from('clicks').select('*', { count: 'exact', head: true }).gte('clicked_at', todayStart.toISOString())

  const totalPaid = (commData ?? []).filter(c => c.status === 'paid').reduce((s, c) => s + c.reviewer_share, 0)

  const stats = [
    { icon: <Users className="w-5 h-5 text-blue-500" />, label: 'Total Users', value: totalUsers ?? 0 },
    { icon: <Package className="w-5 h-5 text-indigo-500" />, label: 'Products', value: totalProducts ?? 0 },
    { icon: <Star className="w-5 h-5 text-green-500" />, label: 'Verified Reviews', value: verifiedReviews ?? 0 },
    { icon: <Star className="w-5 h-5 text-yellow-500" />, label: 'Pending Reviews', value: pendingReviews ?? 0 },
    { icon: <MousePointerClick className="w-5 h-5 text-pink-500" />, label: 'Clicks Today', value: todayClicks ?? 0 },
    { icon: <MousePointerClick className="w-5 h-5 text-purple-500" />, label: 'Total Clicks', value: totalClicks ?? 0 },
    { icon: <DollarSign className="w-5 h-5 text-emerald-500" />, label: 'Commission Paid Out', value: formatCurrency(totalPaid) },
  ]

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">Analytics Overview</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">{s.icon}{s.label}</div>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
