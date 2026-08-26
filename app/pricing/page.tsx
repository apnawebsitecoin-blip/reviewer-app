import { createClient } from '@/lib/supabase/server'
import { Check, Zap, Crown } from 'lucide-react'
import PricingUpgradeButton from './PricingUpgradeButton'

export const dynamic = 'force-dynamic'

const FREE_FEATURES = [
  'Basic access to all products',
  'Verified review submissions',
  'Wallet earnings & cashback',
  'Referral rewards program',
  'Daily check-in bonuses',
]

const PREMIUM_FEATURES = [
  'Early access to new deals (24h before public)',
  'Priority review verification',
  'Exclusive flash deals for Premium members',
  'Premium badge on profile',
  'All Free tier features included',
]

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isPremiumActive = false
  let premiumExpiresAt: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, premium_expires_at')
      .eq('id', user.id)
      .single()

    if (profile?.is_premium && profile.premium_expires_at) {
      const expires = new Date(profile.premium_expires_at)
      if (expires > new Date()) {
        isPremiumActive = true
        premiumExpiresAt = profile.premium_expires_at
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Choose Your Plan</h1>
        <p className="text-gray-500 text-lg">Start for free, upgrade when you&apos;re ready</p>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Free tier */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_1px_8px_rgba(0,0,0,0.07)] p-8">
          <div className="mb-6">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Free</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-gray-900">₹0</span>
              <span className="text-gray-400 text-sm">/month</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Everything you need to get started</p>
          </div>

          <ul className="space-y-3 mb-8">
            {FREE_FEATURES.map(feature => (
              <li key={feature} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-emerald-600" strokeWidth={2.5} />
                </div>
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="w-full py-2.5 rounded-xl border border-gray-200 text-center text-sm font-semibold text-gray-500 bg-gray-50">
            Current Plan
          </div>
        </div>

        {/* Premium tier */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl shadow-[0_4px_24px_rgba(79,70,229,0.35)] p-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-12 -translate-x-10" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-yellow-300" />
              <p className="text-sm font-bold text-indigo-200 uppercase tracking-wider">Premium</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">₹49</span>
              <span className="text-indigo-300 text-sm">/month</span>
            </div>
            <p className="text-sm text-indigo-200 mt-2">Get the edge with exclusive perks</p>
          </div>

          <ul className="space-y-3 mt-6 mb-8 relative">
            {PREMIUM_FEATURES.map(feature => (
              <li key={feature} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-sm text-indigo-100">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="relative">
            {isPremiumActive ? (
              <div className="w-full py-2.5 rounded-xl bg-white/20 text-center text-sm font-semibold text-white">
                <div className="flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-300" fill="currentColor" />
                  Active Premium
                </div>
                {premiumExpiresAt && (
                  <p className="text-xs text-indigo-200 mt-1">
                    Expires {new Date(premiumExpiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            ) : (
              <PricingUpgradeButton isLoggedIn={!!user} />
            )}
          </div>
        </div>
      </div>

      {/* FAQ note */}
      <p className="text-center text-sm text-gray-400 mt-8">
        Questions? Contact us at{' '}
        <a href="mailto:support@reviewapp.in" className="text-indigo-600 hover:underline">
          support@reviewapp.in
        </a>
      </p>
    </div>
  )
}
