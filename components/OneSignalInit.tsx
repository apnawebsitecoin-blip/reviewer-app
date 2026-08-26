'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

declare global {
  interface Window {
    OneSignalDeferred: ((os: any) => void)[]
  }
}

export default function OneSignalInit() {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    if (!appId) return

    window.OneSignalDeferred = window.OneSignalDeferred || []

    const script = document.createElement('script')
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
    script.defer = true
    document.head.appendChild(script)

    window.OneSignalDeferred.push(async (OneSignal: any) => {
      await OneSignal.init({
        appId,
        notifyButton: { enable: false },
        allowLocalhostAsSecureOrigin: true,
      })

      const playerId = OneSignal.User?.PushSubscription?.id
      if (!playerId) return

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').update({ onesignal_player_id: playerId }).eq('id', user.id)
      }
    })

    return () => { document.head.removeChild(script) }
  }, [])

  return null
}
