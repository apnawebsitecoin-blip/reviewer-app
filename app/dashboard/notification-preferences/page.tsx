'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Bell, Check } from 'lucide-react'

interface Prefs {
  wallet_credit: boolean
  withdrawal_update: boolean
  price_drop: boolean
}

const DEFAULT_PREFS: Prefs = { wallet_credit: true, withdrawal_update: true, price_drop: true }

function Toggle({ label, hint, value, onChange }: {
  label: string; hint: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${value ? 'bg-indigo-600' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

export default function NotificationPreferencesPage() {
  const t = useTranslations('notifications')
  const supabase = createClient()
  const router = useRouter()
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)
      const { data } = await supabase.from('profiles').select('notification_prefs').eq('id', user.id).single()
      if (data?.notification_prefs) setPrefs({ ...DEFAULT_PREFS, ...data.notification_prefs })
      setLoading(false)
    })
  }, [])

  const save = async () => {
    if (!userId) return
    await supabase.from('profiles').update({ notification_prefs: prefs }).eq('id', userId)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="h-48 bg-white rounded-2xl animate-pulse" />

  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl shadow p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
        <Bell className="w-5 h-5 text-indigo-500" />{t('title')}
      </h1>
      <p className="text-xs text-gray-400 mb-6">{t('pushNote')}</p>

      <div className="bg-gray-50 rounded-xl px-4 mb-6">
        <Toggle label={t('walletCredit')}      hint={t('walletCreditDesc')}      value={prefs.wallet_credit}      onChange={v => setPrefs(p => ({ ...p, wallet_credit: v }))} />
        <Toggle label={t('withdrawalUpdate')}  hint={t('withdrawalUpdateDesc')}  value={prefs.withdrawal_update}  onChange={v => setPrefs(p => ({ ...p, withdrawal_update: v }))} />
        <Toggle label={t('priceDrop')}         hint={t('priceDropDesc')}         value={prefs.price_drop}         onChange={v => setPrefs(p => ({ ...p, price_drop: v }))} />
      </div>

      <button
        onClick={save}
        className="w-full bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 font-semibold flex items-center justify-center gap-2"
      >
        {saved ? <><Check className="w-4 h-4" />{t('saved')}</> : t('save')}
      </button>
    </div>
  )
}
