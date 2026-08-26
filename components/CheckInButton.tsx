'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CalendarCheck, Flame } from 'lucide-react'

interface Props { userId: string }

const REWARDS = [
  { streakMin: 30, amount: 20 },
  { streakMin: 7,  amount: 10 },
  { streakMin: 0,  amount: 5  },
]

function rewardForStreak(streak: number) {
  return REWARDS.find(r => streak >= r.streakMin)?.amount ?? 5
}


export default function CheckInButton({ userId }: Props) {
  const t = useTranslations('checkin')
  const supabase = createClient()
  const router = useRouter()
  const [checkedIn, setCheckedIn] = useState(false)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [doing, setDoing] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    supabase
      .from('daily_checkins')
      .select('checked_in_at')
      .eq('user_id', userId)
      .order('checked_in_at', { ascending: false })
      .limit(31)
      .then(({ data }) => {
        const dates = (data ?? []).map((r: any) => r.checked_in_at as string)
        const todayDone = dates[0] === today
        setCheckedIn(todayDone)

        // compute streak from sorted desc dates, skipping today if done
        let s = todayDone ? 1 : 0
        const cursor = new Date()
        if (todayDone) cursor.setDate(cursor.getDate() - 1)
        for (let i = todayDone ? 1 : 0; i < dates.length; i++) {
          const expected = cursor.toISOString().split('T')[0]
          if (dates[i] === expected) { s++; cursor.setDate(cursor.getDate() - 1) }
          else break
        }
        setStreak(s)
        setLoading(false)
      })
  }, [userId])

  const handleCheckIn = async () => {
    setDoing(true)
    const reward = rewardForStreak(streak)
    const { error } = await supabase
      .from('daily_checkins')
      .insert({ user_id: userId, checked_in_at: today, reward_amount: reward })
    if (!error) {
      setCheckedIn(true)
      setStreak(s => s + 1)
      router.refresh()
    }
    setDoing(false)
  }

  if (loading) return <div className="h-20 bg-gray-50 rounded-2xl animate-pulse" />

  const reward = rewardForStreak(streak)
  const nextReward = streak >= 30 ? null : streak >= 7 ? { at: 30, amount: 20 } : { at: 7, amount: 10 }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-amber-800 flex items-center gap-2 mb-1">
            <CalendarCheck className="w-4 h-4" />{t('title')}
          </h2>
          <p className="text-xs text-amber-600">{t('subtitle')}</p>
          {streak > 0 && (
            <p className="text-xs font-semibold text-orange-600 mt-1 flex items-center gap-1">
              <Flame className="w-3 h-3" />{t('streak', { days: streak })}
            </p>
          )}
          {nextReward && (
            <p className="text-xs text-amber-500 mt-0.5">{t('nextTier', { days: nextReward.at - streak, amount: nextReward.amount })}</p>
          )}
        </div>

        {checkedIn ? (
          <div className="text-center">
            <p className="text-green-600 font-bold text-sm">{t('checkedIn')}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t('nextCheckin')}</p>
          </div>
        ) : (
          <button
            onClick={handleCheckIn}
            disabled={doing}
            className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-60 flex items-center gap-2"
          >
            <CalendarCheck className="w-4 h-4" />
            {t('checkIn')} · ₹{reward}
          </button>
        )}
      </div>

      {/* Streak progress dots */}
      {streak > 0 && (
        <div className="flex gap-1 mt-3 flex-wrap">
          {Array.from({ length: Math.min(streak, 30) }).map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full ${i < streak ? 'bg-amber-400' : 'bg-amber-100'}`} />
          ))}
        </div>
      )}
    </div>
  )
}
