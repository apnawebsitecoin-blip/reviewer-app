'use client'
import { useState } from 'react'
import { Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PricingUpgradeButton({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter()
  const [showMsg, setShowMsg] = useState(false)

  const handleClick = () => {
    if (!isLoggedIn) {
      router.push('/auth/login')
      return
    }
    setShowMsg(true)
    setTimeout(() => setShowMsg(false), 4000)
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className="w-full py-2.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        <Zap className="w-4 h-4" />
        Upgrade to Premium
      </button>
      {showMsg && (
        <p className="mt-3 text-center text-xs text-indigo-200 bg-white/10 rounded-lg px-3 py-2">
          Payment integration coming soon — contact admin to activate Premium manually.
        </p>
      )}
    </div>
  )
}
