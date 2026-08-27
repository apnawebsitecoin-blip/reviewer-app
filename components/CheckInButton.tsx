'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CalendarCheck, Flame } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [justDone, setJustDone] = useState(false)

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
      setJustDone(true)
      router.refresh()
    }
    setDoing(false)
  }

  if (loading) return <div className="h-24 bg-amber-50 rounded-2xl animate-pulse mb-6" />

  const reward = rewardForStreak(streak)
  const nextReward = streak >= 30 ? null : streak >= 7 ? { at: 30, amount: 20 } : { at: 7, amount: 10 }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-black text-amber-800 flex items-center gap-2 mb-1">
            <CalendarCheck className="w-4 h-4" />{t('title')}
          </h2>
          <p className="text-xs text-amber-600">{t('subtitle')}</p>
          {streak > 0 && (
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs font-bold text-orange-600 mt-1 flex items-center gap-1"
            >
              <Flame className="w-3 h-3" />{t('streak', { days: streak })}
            </motion.p>
          )}
          {nextReward && (
            <p className="text-xs text-amber-500 mt-0.5">
              {t('nextTier', { days: nextReward.at - streak, amount: nextReward.amount })}
            </p>
          )}
        </div>

        <AnimatePresence mode="wait">
          {checkedIn ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="text-center"
            >
              <p className="text-green-600 font-black text-sm flex items-center gap-1.5">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.1 }}
                >
                  ✓
                </motion.span>
                {t('checkedIn')}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{t('nextCheckin')}</p>
            </motion.div>
          ) : (
            <motion.button
              key="btn"
              onClick={handleCheckIn}
              disabled={doing}
              whileHover={{ scale: 1.04, boxShadow: '0 6px 20px rgba(245,158,11,0.35)' }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60 flex items-center gap-2"
            >
              <CalendarCheck className="w-4 h-4" />
              {t('checkIn')} · ₹{reward}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Streak dots with stagger */}
      {streak > 0 && (
        <motion.div
          className="flex gap-1 mt-3 flex-wrap"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        >
          {Array.from({ length: Math.min(streak, 30) }).map((_, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { scale: 0, opacity: 0 },
                show: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 500, damping: 25 } },
              }}
              className="w-3 h-3 rounded-full bg-amber-400"
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}
