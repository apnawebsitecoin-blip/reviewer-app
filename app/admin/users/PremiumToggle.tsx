'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Crown, Loader2 } from 'lucide-react'

export default function PremiumToggle({ userId, isPremium }: { userId: string; isPremium: boolean }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    if (isPremium) {
      await supabase
        .from('profiles')
        .update({ is_premium: false, premium_expires_at: null })
        .eq('id', userId)
    } else {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)
      await supabase
        .from('profiles')
        .update({ is_premium: true, premium_expires_at: expiresAt.toISOString() })
        .eq('id', userId)
    }
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={isPremium ? 'Revoke Premium' : 'Grant Premium (30 days)'}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
        isPremium
          ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border border-indigo-200'
          : 'bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-200'
      }`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Crown className={`w-3.5 h-3.5 ${isPremium ? 'text-indigo-600' : 'text-gray-400'}`} />
      )}
      {isPremium ? 'Premium' : 'Free'}
    </button>
  )
}
