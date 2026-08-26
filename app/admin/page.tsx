import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import {
  Users, Package, Star, MousePointerClick,
  DollarSign, Clock, TrendingUp, CheckCircle2,
} from 'lucide-react'

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

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const { count: todayClicks } = await supabase
    .from('clicks').select('*', { count: 'exact', head: true })
    .gte('clicked_at', todayStart.toISOString())

  const totalPaid = (commData ?? [])
    .filter(c => c.status === 'paid')
    .reduce((s, c) => s + c.reviewer_share, 0)

  const stats = [
    { label: 'Total Users',       value: totalUsers ?? 0,          Icon: Users,             iconBg: '#EFF6FF', iconColor: '#2563EB' },
    { label: 'Products Listed',   value: totalProducts ?? 0,       Icon: Package,           iconBg: '#EEF2FF', iconColor: '#4F46E5' },
    { label: 'Verified Reviews',  value: verifiedReviews ?? 0,     Icon: CheckCircle2,      iconBg: '#F0FDF4', iconColor: '#16A34A' },
    { label: 'Pending Reviews',   value: pendingReviews ?? 0,      Icon: Clock,             iconBg: '#FFFBEB', iconColor: '#D97706' },
    { label: 'Clicks Today',      value: todayClicks ?? 0,         Icon: TrendingUp,        iconBg: '#FFF1F2', iconColor: '#E11D48' },
    { label: 'Total Clicks',      value: totalClicks ?? 0,         Icon: MousePointerClick, iconBg: '#F5F3FF', iconColor: '#7C3AED' },
    { label: 'Commission Paid',   value: formatCurrency(totalPaid), Icon: DollarSign,       iconBg: '#F0FDF4', iconColor: '#059669' },
    { label: 'Total Stars',       value: (verifiedReviews ?? 0) + (pendingReviews ?? 0), Icon: Star, iconBg: '#FFF7ED', iconColor: '#EA580C' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-gray-900">Analytics Overview</h1>
        <p className="text-sm text-gray-400 mt-0.5">Real-time snapshot of your platform</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, Icon, iconBg, iconColor }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
              style={{ background: iconBg }}
            >
              <Icon className="w-4.5 h-4.5" style={{ color: iconColor, width: 18, height: 18 }} />
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{value}</p>
            <p className="text-xs font-medium text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
