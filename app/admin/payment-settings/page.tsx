import { getSiteSettings } from '@/lib/settings'
import { CreditCard } from 'lucide-react'
import PaymentSettingsForm from './PaymentSettingsForm'

export const dynamic = 'force-dynamic'

export default async function PaymentSettingsPage() {
  const settings = await getSiteSettings()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-500" /> Payment Settings
        </h1>
        <p className="text-sm text-gray-400 mt-1">Configure payout provider. Secret API keys stay in .env.local — never in the database.</p>
      </div>

      <PaymentSettingsForm initial={settings.payoutConfig} />
    </div>
  )
}
