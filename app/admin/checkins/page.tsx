'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CalendarCheck, Users, Save, Loader2, AlertTriangle } from 'lucide-react'

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition bg-white'
const LABEL = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'

interface CheckinRow {
  id: string
  user_id: string
  checked_in_at: string
  reward_amount: number
  profiles: { name: string | null } | null
}

interface TopUser {
  user_id: string
  name: string | null
  total: number
}

interface SuspectEntry {
  user_id: string
  name: string | null
  date: string
  count: number
}

export default function AdminCheckinsPage() {
  const supabase = createClient()
  const [todayCount,  setTodayCount]  = useState(0)
  const [weekCount,   setWeekCount]   = useState(0)
  const [monthCount,  setMonthCount]  = useState(0)
  const [recent,      setRecent]      = useState<CheckinRow[]>([])
  const [topUsers,    setTopUsers]    = useState<TopUser[]>([])
  const [suspects,    setSuspects]    = useState<SuspectEntry[]>([])
  const [bonusAmount, setBonusAmount] = useState('5')
  const [savingBonus, setSavingBonus] = useState(false)
  const [bonusSaved,  setBonusSaved]  = useState(false)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    const load = async () => {
      const now      = new Date()
      const todayStr = now.toISOString().split('T')[0]
      const weekAgo  = new Date(now.getTime() - 7  * 86400_000).toISOString().split('T')[0]
      const monthAgo = new Date(now.getTime() - 30 * 86400_000).toISOString().split('T')[0]

      const [
        { count: todayCnt },
        { count: weekCnt },
        { count: monthCnt },
        { data: recentData },
        { data: bonusSetting },
      ] = await Promise.all([
        supabase.from('daily_checkins').select('*', { count: 'exact', head: true }).gte('checked_in_at', todayStr),
        supabase.from('daily_checkins').select('*', { count: 'exact', head: true }).gte('checked_in_at', weekAgo),
        supabase.from('daily_checkins').select('*', { count: 'exact', head: true }).gte('checked_in_at', monthAgo),
        supabase.from('daily_checkins')
          .select('id, user_id, checked_in_at, reward_amount, profiles(name)')
          .order('checked_in_at', { ascending: false })
          .limit(100),
        supabase.from('site_settings').select('value').eq('key', 'checkin_bonus_amount').maybeSingle(),
      ])

      setTodayCount(todayCnt ?? 0)
      setWeekCount(weekCnt ?? 0)
      setMonthCount(monthCnt ?? 0)
      if (bonusSetting?.value) setBonusAmount(bonusSetting.value)

      const rows = (recentData as unknown as CheckinRow[]) ?? []
      setRecent(rows)

      // Compute top users from the fetched window
      const userMap: Record<string, { name: string | null; total: number }> = {}
      for (const row of rows) {
        if (!userMap[row.user_id]) userMap[row.user_id] = { name: row.profiles?.name ?? null, total: 0 }
        userMap[row.user_id].total++
      }
      setTopUsers(
        Object.entries(userMap)
          .map(([user_id, v]) => ({ user_id, ...v }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10)
      )

      // Flag any (user_id, date) pairs that appear more than once in this window
      // (should be prevented by UNIQUE constraint — presence here indicates a schema gap)
      const dayMap: Record<string, { user_id: string; name: string | null; count: number }> = {}
      for (const row of rows) {
        const date = row.checked_in_at.split('T')[0]
        const key  = `${row.user_id}__${date}`
        if (!dayMap[key]) dayMap[key] = { user_id: row.user_id, name: row.profiles?.name ?? null, count: 0 }
        dayMap[key].count++
      }
      setSuspects(
        Object.entries(dayMap)
          .filter(([, v]) => v.count > 1)
          .map(([key, v]) => ({ ...v, date: key.split('__')[1] }))
      )

      setLoading(false)
    }
    load()
  }, [])

  const handleSaveBonus = async () => {
    setSavingBonus(true)
    await supabase.from('site_settings').upsert({ key: 'checkin_bonus_amount', value: bonusAmount }, { onConflict: 'key' })
    setSavingBonus(false)
    setBonusSaved(true)
    setTimeout(() => setBonusSaved(false), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Daily Check-ins</h1>
          <p className="text-sm text-gray-400 mt-0.5">User engagement stats and bonus configuration</p>
        </div>
        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm font-bold px-3 py-1 rounded-full">
          {todayCount} today
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Today',       value: todayCount,  color: 'text-indigo-600' },
          { label: 'Last 7 days', value: weekCount,   color: 'text-green-600'  },
          { label: 'Last 30 days',value: monthCount,  color: 'text-amber-600'  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.value.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">check-ins</p>
          </div>
        ))}
      </div>

      {/* Suspicious flag */}
      {suspects.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">Duplicate check-ins detected</p>
            <p className="text-xs text-red-600 mt-1">
              The following (user, date) pairs appear more than once — a UNIQUE constraint on <code>(user_id, checked_in_at)</code> may be missing. See migration.sql.
            </p>
            <ul className="mt-2 space-y-0.5">
              {suspects.map((s, i) => (
                <li key={i} className="text-xs text-red-700 font-mono">
                  {s.name ?? s.user_id.slice(0, 12)} on {s.date} — {s.count}×
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Bonus config */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarCheck className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-gray-800">Bonus Amount</h2>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Saved as <code className="bg-gray-100 px-1 rounded text-xs">checkin_bonus_amount</code> in site_settings.
            For this to apply to new check-ins, run the trigger in <strong>migration.sql</strong>.
          </p>
          <label className={LABEL}>₹ per check-in</label>
          <div className="flex gap-2">
            <input
              type="number" min="0" step="1"
              value={bonusAmount}
              onChange={e => setBonusAmount(e.target.value)}
              className={INPUT}
            />
            <button
              onClick={handleSaveBonus}
              disabled={savingBonus}
              className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-bold px-3 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition whitespace-nowrap"
            >
              {savingBonus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {bonusSaved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>

        {/* Top users */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-gray-800">Top Users (last 100 check-ins)</h2>
          </div>
          {topUsers.length === 0 ? (
            <p className="text-sm text-gray-400">No check-in data yet.</p>
          ) : (
            <div className="space-y-2.5">
              {topUsers.map((u, i) => (
                <div key={u.user_id} className="flex items-center gap-3">
                  <span className="text-xs font-black text-gray-300 w-4 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{u.name ?? 'Unknown'}</p>
                    <p className="text-xs text-gray-400 font-mono truncate">{u.user_id.slice(0, 18)}…</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full shrink-0">
                    {u.total}×
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent check-ins table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800">Recent Check-ins</h2>
          <span className="text-xs text-gray-400">Latest 100</span>
        </div>
        {recent.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">No check-ins recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">User</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-right px-5 py-3">Reward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{row.profiles?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-gray-400 font-mono">{row.user_id.slice(0, 18)}…</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {new Date(row.checked_in_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-green-600">₹{row.reward_amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
