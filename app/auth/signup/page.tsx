'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

export default function SignupPage() {
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
      setError('Signup failed — please try again')
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
          <h1 className="text-2xl font-bold text-gray-800">साइनअप करें</h1>
          <p className="text-sm text-gray-500">ReviewApp के साथ रिव्यू करके कमाएं</p>
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">नाम</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code (वैकल्पिक)</label>
            <input type="text" value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())}
              placeholder="किसी का referral code"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60 font-medium">
            {loading ? 'अकाउंट बन रहा है...' : 'साइनअप करें'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          पहले से अकाउंट है?{' '}
          <Link href="/auth/login" className="text-indigo-600 hover:underline">लॉगिन करें</Link>
        </p>
      </div>
    </div>
  )
}
