import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, getSentimentBg } from '@/lib/utils'
import { Wallet, Star, MousePointerClick, TrendingUp, Heart, Bell, ShoppingBag, Crown, ChevronRight } from 'lucide-react'
import WithdrawButton from './WithdrawButton'
import VideoUploadForm from '@/components/VideoUploadForm'
import CheckInButton from '@/components/CheckInButton'
import ReferralTierCard from '@/components/ReferralTierCard'
import DashboardStatCard from './DashboardStatCard'
import FadeInSection from '@/components/FadeInSection'
import CountUp from '@/components/CountUp'
import { getTranslations } from 'next-intl/server'
import { motion } from 'framer-motion'

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fsu">
        <h1 className="text-xl font-black text-gray-900 tracking-tight">{t('titlePage')}</h1>
        <div className="text-sm text-gray-500">{t('greeting', { name: profile.name ?? user.email })}</div>
      </div>

      {/* Stat cards */}
      <FadeInSection className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <DashboardStatCard icon={<Wallet className="w-5 h-5 text-green-500" />}         label={t('wallet')}      value={profile.wallet_balance ?? 0} prefix="₹" />
        <DashboardStatCard icon={<Star className="w-5 h-5 text-yellow-500" />}           label={t('statTrust')}   value={profile.trust_score ?? 0} />
        <DashboardStatCard icon={<Star className="w-5 h-5 text-indigo-500" />}           label={t('statReviews')} value={(reviews ?? []).length} />
        <DashboardStatCard icon={<MousePointerClick className="w-5 h-5 text-pink-500" />} label={t('statClicks')}  value={clickCount ?? 0} />
      </FadeInSection>

      {/* Submit Deal CTA */}
      <FadeInSection delay={0.05} className="mb-6">
        <Link href="/dashboard/submit-deal">
          <div
            className="relative overflow-hidden rounded-2xl p-5 flex items-center justify-between gap-4 hover:opacity-95 active:opacity-90 transition-opacity cursor-pointer"
            style={{ background: 'linear-gradient(120deg, var(--brand) 0%, color-mix(in srgb, var(--brand) 75%, #000) 100%)' }}
          >
            {/* Decorative circles */}
            <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Community Deals</p>
              <h3 className="text-base font-black text-white leading-snug">
                Product suggest karo, reward pao! 🎁
              </h3>
              <p className="text-xs text-white/70 mt-1">
                Link paste karo — naam, price, image auto-fill
              </p>
            </div>

            <div className="relative shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </div>
        </Link>
      </FadeInSection>

      {/* Wallet card */}
      <FadeInSection delay={0.07} className="mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('wallet')}</p>
              <p className="text-3xl font-black text-gray-900">
                <CountUp value={profile.wallet_balance ?? 0} prefix="₹" />
              </p>
              {(profile.wallet_balance ?? 0) < 100 && (
                <p className="text-xs text-orange-500 mt-1">{t('withdrawMin')}</p>
              )}
            </div>
            <WithdrawButton
              walletBalance={profile.wallet_balance}
              panNumber={profile.pan_number}
              upiId={profile.upi_id}
              userId={user.id}
            />
          </div>
        </div>
      </FadeInSection>

      {/* Daily Check-in */}
      <FadeInSection delay={0.08}>
        <CheckInButton userId={user.id} />
      </FadeInSection>

      <FadeInSection delay={0.1}>
        <VideoUploadForm />
      </FadeInSection>

      {/* Referral Tier */}
      <FadeInSection delay={0.12}>
        <ReferralTierCard referralCount={referralCount ?? 0} referralCode={profile.referral_code ?? ''} />
      </FadeInSection>

      {/* Expert badges */}
      {expertCategories.length > 0 && (
        <FadeInSection delay={0.14} className="mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-black text-gray-900 mb-3">{t('expertBadges')}</h2>
            <div className="flex flex-wrap gap-2">
              {expertCategories.map(cat => (
                <span key={cat} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {t('expertBadge', { cat })}
                </span>
              ))}
            </div>
          </div>
        </FadeInSection>
      )}

      {/* Earnings breakdown */}
      <FadeInSection delay={0.16} className="mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />{t('earningsTitle')}
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-yellow-50 rounded-xl">
              <p className="text-xs text-yellow-600 font-medium mb-1">{t('statusPending')}</p>
              <p className="font-black text-yellow-700">
                <CountUp value={pendingEarnings} prefix="₹" />
              </p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <p className="text-xs text-green-600 font-medium mb-1">{t('statusConfirmed')}</p>
              <p className="font-black text-green-700">
                <CountUp value={confirmedEarnings} prefix="₹" />
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 font-medium mb-1">{t('statusPaidOut')}</p>
              <p className="font-black text-gray-700">
                <CountUp value={paidEarnings} prefix="₹" />
              </p>
            </div>
          </div>
          {(commissions ?? []).length === 0 && (
            <p className="text-sm text-gray-400 text-center">{t('noCommission')}</p>
          )}
        </div>
      </FadeInSection>

      {/* Reviews */}
      <FadeInSection delay={0.18}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-end gap-4 mb-2 flex-wrap">
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

          <h2 className="font-black text-gray-900 mb-4">{t('myReviews')}</h2>

          {(reviews ?? []).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm mb-3">{t('noReviewsMsg')}</p>
              <Link href="/products" className="text-white px-5 py-2.5 rounded-xl text-sm font-bold bg-brand hover-bg-brand transition-opacity hover:opacity-90">
                {t('reviewCta')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {(reviews ?? []).map(r => (
                <div key={r.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-3 gap-3 hover:shadow-sm transition-shadow duration-150">
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${r.product_id}`} className="text-sm font-semibold text-gray-800 hover:underline line-clamp-1">
                      {(r.products as any)?.name ?? 'Product'}
                    </Link>
                    <p className="text-xs text-gray-400">{formatDate(r.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {r.detailed_badge && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{t('detailedBadge')}</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSentimentBg(r.sentiment)}`}>{r.sentiment}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {r.verified ? t('statusVerified') : t('statusPending')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </FadeInSection>
    </div>
  )
}
