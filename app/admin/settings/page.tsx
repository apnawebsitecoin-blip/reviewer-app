import { getSiteSettings } from '@/lib/settings'
import SettingsForm from './SettingsForm'
import { Settings2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SiteSettingsPage() {
  const settings = await getSiteSettings()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Settings2 className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Site Settings</h1>
          <p className="text-xs text-gray-400">Changes save instantly to the live site</p>
        </div>
      </div>

      <SettingsForm initial={settings} />
    </div>
  )
}
