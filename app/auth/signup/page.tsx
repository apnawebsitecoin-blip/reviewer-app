'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function SignupPage() {
  const t = useTranslations('auth.signup')
  const supabase = createClient()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Referral lookup
    let referredById: string | null = null
    if (referralCode.trim()) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', referralCode.trim().toUpperCase())
        .single()
      if (referrer) referredById = referrer.id
    }

    // Create auth user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError(t('failed'))
      setLoading(false)
      return
    }

    // Manually create profile (trigger backup — works even if DB trigger is absent)
    const referralCodeGenerated = data.user.id.substring(0, 8).toUpperCase()
    await supabase.from('profiles').upsert(
      {
        id: data.user.id,
        name: name.trim(),
        referral_code: referralCodeGenerated,
        referred_by: referredById,
      },
      { onConflict: 'id' }
    )

    // Referral bonus ₹20 for referrer
    if (referredById) {
      const { data: referrerProfile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', referredById)
        .single()
      if (referrerProfile) {
        await supabase
          .from('profiles')
          .update({ wallet_balance: (referrerProfile.wallet_balance ?? 0) + 20 })
          .eq('id', referredById)
      }
      // Bonus for new user too
      await supabase
        .from('profiles')
        .update({ wallet_balance: 20 })
        .eq('id', data.user.id)
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <ShoppingBag className="w-10 h-10 text-indigo-600 mb-2" />
          <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
          <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('referral')}</label>
            <input type="text" value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())}
              placeholder={t('referralPlaceholder')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60 font-medium">
            {loading ? t('loading') : t('submit')}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          {t('hasAccount')}{' '}
          <Link href="/auth/login" className="text-indigo-600 hover:underline">{t('loginLink')}</Link>
        </p>
      </div>
    </div>
  )
}
