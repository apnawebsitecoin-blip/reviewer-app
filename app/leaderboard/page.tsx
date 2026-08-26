import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { Trophy, Star } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const [supabase, t] = await Promise.all([createClient(), getTranslations('leaderboard')])

  const { data: topEarners } = await supabase
    .from('profiles')
    .select('id, name, wallet_balance, trust_score, referral_code')
    .eq('is_blocked', false)
    .order('wallet_balance', { ascending: false })
    .limit(20)

  const { data: topTrust } = await supabase
    .from('profiles')
    .select('id, name, trust_score, wallet_balance')
    .eq('is_blocked', false)
    .order('trust_score', { ascending: false })
    .limit(20)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="w-7 h-7 text-yellow-500" />
        <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Earners */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
            <h2 className="text-white font-bold flex items-center gap-2">{t('topEarners')}</h2>
            <p className="text-green-100 text-xs">{t('highestBalance')}</p>
          </div>
          <div className="divide-y">
            {(topEarners ?? []).map((user, index) => (
              <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                <span className={`text-lg font-bold w-6 text-center ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-gray-300'}`}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                </span>
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                  {(user.name ?? 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{user.name ?? t('user')}</p>
                  <p className="text-xs text-gray-400">{t('trustLabel', { score: user.trust_score })}</p>
                </div>
                <span className="text-green-600 font-bold text-sm">{formatCurrency(user.wallet_balance)}</span>
              </div>
            ))}
            {(topEarners ?? []).length === 0 && (
              <p className="p-4 text-center text-gray-400 text-sm">{t('noEarners')}</p>
            )}
          </div>
        </div>

        {/* Top Trust Scores */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
            <h2 className="text-white font-bold flex items-center gap-2"><Star className="w-4 h-4" />{t('mostTrusted')}</h2>
            <p className="text-indigo-100 text-xs">{t('highestTrust')}</p>
          </div>
          <div className="divide-y">
            {(topTrust ?? []).map((user, index) => (
              <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                <span className={`text-lg font-bold w-6 text-center ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-gray-300'}`}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                </span>
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">
                  {(user.name ?? 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{user.name ?? t('user')}</p>
                  <p className="text-xs text-gray-400">{t('walletLabel', { amount: formatCurrency(user.wallet_balance) })}</p>
                </div>
                <span className="text-yellow-500 font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400" />{user.trust_score}
                </span>
              </div>
            ))}
            {(topTrust ?? []).length === 0 && (
              <p className="p-4 text-center text-gray-400 text-sm">{t('noReviewers')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
