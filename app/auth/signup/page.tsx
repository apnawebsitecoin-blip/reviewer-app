'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ShoppingBag, Loader2, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'

// ── Module-level: stable component reference across renders ────────────────────
interface FieldProps {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  minLength?: number
  placeholder?: string
  uppercase?: boolean
  focused: string | null
  onFocus: (id: string) => void
  onBlur: () => void
  brand: string
}

function AuthField({
  id, label, type = 'text', value, onChange, required = false,
  minLength, placeholder, uppercase, focused, onFocus, onBlur, brand,
}: FieldProps) {
  const active = focused === id
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-widest">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
        onFocus={() => onFocus(id)}
        onBlur={onBlur}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        style={{
          borderColor: active ? brand : '#e5e7eb',
          boxShadow:   active ? `0 0 0 3px ${brand}22` : 'none',
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        className={`w-full border rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white ${uppercase ? 'uppercase' : ''}`}
      />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const t = useTranslations('auth.signup')
  const supabase = createClient()
  const router = useRouter()
  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [focused, setFocused]         = useState<string | null>(null)
  const [brand, setBrand]             = useState('#6366f1')

  useEffect(() => {
    const b = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim()
    if (b) setBrand(b)
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    let referredById: string | null = null
    if (referralCode.trim()) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id, referral_code')
        .eq('referral_code', referralCode.trim().toUpperCase())
        .single()
      if (referrer) referredById = referrer.id
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    if (!data.user)  { setError(t('failed')); setLoading(false); return }

    const referralCodeGenerated = data.user.id.substring(0, 8).toUpperCase()

    if (referredById && referralCode.trim().toUpperCase() === referralCodeGenerated) {
      setError(t('selfReferralError'))
      setLoading(false)
      return
    }

    await supabase.from('profiles').upsert(
      { id: data.user.id, name: name.trim(), referral_code: referralCodeGenerated, referred_by: referredById },
      { onConflict: 'id' }
    )

    if (referredById) {
      const { data: referrerProfile } = await supabase
        .from('profiles').select('wallet_balance').eq('id', referredById).single()
      if (referrerProfile) {
        await supabase.from('profiles')
          .update({ wallet_balance: (referrerProfile.wallet_balance ?? 0) + 20 })
          .eq('id', referredById)
      }
      await supabase.from('profiles').update({ wallet_balance: 20 }).eq('id', data.user.id)
    }

    fetch('/api/auth/log-ip', { method: 'POST' }).catch(() => {})
    router.push('/dashboard')
    router.refresh()
  }

  const fieldProps = { focused, onFocus: setFocused, onBlur: () => setFocused(null), brand }

  return (
    <div className="min-h-[calc(100vh-80px)] relative flex items-center justify-center py-12 overflow-hidden -mx-4 sm:-mx-6 px-4">
      {/* Animated brand blobs */}
      <div
        className="auth-blob-1 absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[130px] opacity-[0.18] pointer-events-none"
        style={{ background: brand }}
      />
      <div
        className="auth-blob-2 absolute -bottom-40 -right-40 w-[420px] h-[420px] rounded-full blur-[110px] opacity-[0.12] pointer-events-none"
        style={{ background: brand }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-[0_8px_40px_rgba(0,0,0,0.11)] border border-white/80"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.15 }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${brand}, ${brand}bb)` }}
          >
            <ShoppingBag className="w-7 h-7 text-white" />
          </motion.div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <AuthField id="name"     label={t('name')}     value={name}     onChange={setName}     required {...fieldProps} />
          <AuthField id="email"    label={t('email')}    type="email"     value={email}    onChange={setEmail}    required {...fieldProps} />
          <AuthField id="password" label={t('password')} type="password"  value={password} onChange={setPassword} required minLength={6} {...fieldProps} />
          <AuthField
            id="referral"
            label={t('referral')}
            value={referralCode}
            onChange={setReferralCode}
            placeholder={t('referralPlaceholder')}
            uppercase
            {...fieldProps}
          />

          {error && (
            <motion.p
              key={error}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm text-red-500 flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.015 }}
            whileTap={{ scale: loading ? 1 : 0.96 }}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 mt-1"
            style={{ background: brand, boxShadow: `0 4px 16px ${brand}44` }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />{t('loading')}
              </span>
            ) : t('submit')}
          </motion.button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          {t('hasAccount')}{' '}
          <Link href="/auth/login" className="font-bold hover:underline" style={{ color: brand }}>
            {t('loginLink')}
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
