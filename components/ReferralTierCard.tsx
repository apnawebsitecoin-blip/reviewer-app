import { getTranslations } from 'next-intl/server'
import { Share2 } from 'lucide-react'
import CopyReferral from '@/app/dashboard/CopyReferral'
import AnimatedProgressBar from '@/components/AnimatedProgressBar'

const TIERS = [
  { key: 'bronze',   min: 0,  bonus: 20, icon: '🥉', bg: 'bg-amber-50',   border: 'border-amber-200',  text: 'text-amber-700',  bar: 'bg-amber-400'  },
  { key: 'silver',   min: 5,  bonus: 30, icon: '🥈', bg: 'bg-slate-50',   border: 'border-slate-200',  text: 'text-slate-700',  bar: 'bg-slate-400'  },
  { key: 'gold',     min: 10, bonus: 50, icon: '🥇', bg: 'bg-yellow-50',  border: 'border-yellow-200', text: 'text-yellow-700', bar: 'bg-yellow-400' },
  { key: 'platinum', min: 25, bonus: 75, icon: '💎', bg: 'bg-purple-50',  border: 'border-purple-200', text: 'text-purple-700', bar: 'bg-purple-400' },
] as const

interface Props {
  referralCount: number
  referralCode: string
}

export default async function ReferralTierCard({ referralCount, referralCode }: Props) {
  const t = await getTranslations('referralTier')
  const tr = await getTranslations('dashboard')

  const current = [...TIERS].reverse().find(tier => referralCount >= tier.min) ?? TIERS[0]
  const nextIndex = TIERS.findIndex(tier => tier.key === current.key) + 1
  const next = nextIndex < TIERS.length ? TIERS[nextIndex] : null

  const progress = next
    ? Math.round(((referralCount - current.min) / (next.min - current.min)) * 100)
    : 100

  return (
    <div className={`${current.bg} border ${current.border} rounded-2xl p-5 mb-6`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className={`font-bold ${current.text} flex items-center gap-2`}>
          <Share2 className="w-4 h-4" />{t('title')}
        </h2>
        <span className={`text-lg font-black ${current.text}`}>{current.icon} {t(current.key as any)}</span>
      </div>

      <div className="flex items-center justify-between mb-2 text-sm">
        <span className={`font-semibold ${current.text}`}>{t('referredCount', { count: referralCount })}</span>
        <span className={`text-xs font-bold ${current.text}`}>{t('bonusPerReferral', { amount: current.bonus })}</span>
      </div>

      {/* Progress bar — animated on scroll into view */}
      <AnimatedProgressBar progress={progress} barClass={current.bar} />

      {next ? (
        <p className={`text-xs ${current.text} opacity-70`}>
          {t('progressTo', { count: next.min - referralCount, tier: t(next.key as any) })}
        </p>
      ) : (
        <p className={`text-xs font-bold ${current.text}`}>{t('atMax')}</p>
      )}

      <div className="mt-4">
        <p className="text-xs text-gray-500 mb-2">{tr('referralDesc')}</p>
        <CopyReferral code={referralCode} />
      </div>
    </div>
  )
}
