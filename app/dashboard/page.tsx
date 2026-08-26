import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, getSentimentBg } from '@/lib/utils'
import { Wallet, Star, MousePointerClick, TrendingUp, Heart, Bell, ShoppingBag, Crown } from 'lucide-react'
import WithdrawButton from './WithdrawButton'
import VideoUploadForm from '@/components/VideoUploadForm'
import CheckInButton from '@/components/CheckInButton'
import ReferralTierCard from '@/components/ReferralTierCard'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [supabase, t] = await Promise.all([createClient(), getTranslations('dashboard')])
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const [
    { data: reviews },
    { count: clickCount },
    { data: commissions },
    { count: referralCount },
  ] = await Promise.all([
    supabase.from('reviews').select('*, products(id, name, category)').eq('reviewer_id', user.id).order('created_at', { ascending: false }),
    supabase.from('clicks').select('*', { count: 'exact', head: true }).eq('reviewer_id', user.id),
    supabase.from('commissions').select('*').eq('reviewer_id', user.id).order('created_at', { ascending: false }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('referred_by', user.id),
  ])

  const pendingEarnings   = (commissions ?? []).filter(c => c.status === 'pending').reduce((s, c) => s + c.reviewer_share, 0)
  const confirmedEarnings = (commissions ?? []).filter(c => c.status === 'confirmed').reduce((s, c) => s + c.reviewer_share, 0)
  const paidEarnings      = (commissions ?? []).filter(c => c.status === 'paid').reduce((s, c) => s + c.reviewer_share, 0)

  const categoryMap: Record<string, number> = {}
  ;(reviews ?? []).filter(r => r.verified).forEach(r => {
    const cat = (r.products as any)?.category ?? 'Other'
    categoryMap[cat] = (categoryMap[cat] ?? 0) + 1
  })
  const expertCategories = Object.entries(categoryMap).filter(([, count]) => count >= 5).map(([cat]) => cat)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">{t('titlePage')}</h1>
        <div className="text-sm text-gray-500">{t('greeting', { name: profile.name ?? user.email })}</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Wallet className="w-5 h-5 text-green-500" />}  label={t('wallet')}      value={formatCurrency(profile.wallet_balance)} />
        <StatCard icon={<Star className="w-5 h-5 text-yellow-500" />}   label={t('statTrust')}   value={String(profile.trust_score)} />
        <StatCard icon={<Star className="w-5 h-5 text-indigo-500" />}   label={t('statReviews')} value={String((reviews ?? []).length)} />
        <StatCard icon={<MousePointerClick className="w-5 h-5 text-pink-500" />} label={t('statClicks')} value={String(clickCount ?? 0)} />
      </div>

      <div className="bg-white rounded-2xl shadow p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-gray-500">{t('wallet')}</p>
            <p className="text-3xl font-bold text-gray-800">{formatCurrency(profile.wallet_balance)}</p>
            {profile.wallet_balance < 100 && (
              <p className="text-xs text-orange-500 mt-1">{t('withdrawMin')}</p>
            )}
          </div>
          <WithdrawButton walletBalance={profile.wallet_balance} panNumber={profile.pan_number} upiId={profile.upi_id} userId={user.id} />
        </div>
      </div>

      {/* Daily Check-in */}
      <CheckInButton userId={user.id} />

      <VideoUploadForm />

      {/* Referral Tier Card */}
      <ReferralTierCard referralCount={referralCount ?? 0} referralCode={profile.referral_code ?? ''} />

      {expertCategories.length > 0 && (
        <div className="bg-white rounded-2xl shadow p-5 mb-6">
          <h2 className="font-bold text-gray-800 mb-3">{t('expertBadges')}</h2>
          <div className="flex flex-wrap gap-2">
            {expertCategories.map(cat => (
              <span key={cat} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                {t('expertBadge', { cat })}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-5 mb-6">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-500" />{t('earningsTitle')}</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-yellow-50 rounded-xl">
            <p className="text-xs text-yellow-600">{t('statusPending')}</p>
            <p className="font-bold text-yellow-700">{formatCurrency(pendingEarnings)}</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-xl">
            <p className="text-xs text-green-600">{t('statusConfirmed')}</p>
            <p className="font-bold text-green-700">{formatCurrency(confirmedEarnings)}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">{t('statusPaidOut')}</p>
            <p className="font-bold text-gray-700">{formatCurrency(paidEarnings)}</p>
          </div>
        </div>
        {(commissions ?? []).length === 0 && (
          <p className="text-sm text-gray-400 text-center">{t('noCommission')}</p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow p-5">
        <div className="flex justify-end gap-4 mb-2">
          <Link href="/dashboard/wishlist" className="text-sm text-pink-500 hover:underline flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />{t('wishlistLink')}
          </Link>
          <Link href="/dashboard/submit-deal" className="text-sm text-green-600 hover:underline flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5" />{t('submitDealLink')}
          </Link>
          <Link href="/pricing" className="text-sm text-amber-600 hover:underline flex items-center gap-1">
            <Crown className="w-3.5 h-3.5" />{t('premiumLink')}
          </Link>
          <Link href="/dashboard/notification-preferences" className="text-sm text-indigo-500 hover:underline flex items-center gap-1">
            <Bell className="w-3.5 h-3.5" />{t('notifPrefsLink')}
          </Link>
          <Link href="/dashboard/profile" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
            {t('profileSettings')}
          </Link>
        </div>
        <h2 className="font-bold text-gray-800 mb-4">{t('myReviews')}</h2>
        {(reviews ?? []).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm mb-3">{t('noReviewsMsg')}</p>
            <Link href="/products" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
              {t('reviewCta')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(reviews ?? []).map(r => (
              <div key={r.id} className="flex items-center justify-between border rounded-xl p-3 gap-3">
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${r.product_id}`} className="text-sm font-medium text-gray-800 hover:text-indigo-600 line-clamp-1">
                    {(r.products as any)?.name ?? 'Product'}
                  </Link>
                  <p className="text-xs text-gray-400">{formatDate(r.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {r.detailed_badge && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{t('detailedBadge')}</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getSentimentBg(r.sentiment)}`}>{r.sentiment}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {r.verified ? t('statusVerified') : t('statusPending')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-gray-500 text-xs">{icon}{label}</div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  )
}
