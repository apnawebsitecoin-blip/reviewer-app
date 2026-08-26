const APP_ID  = process.env.ONESIGNAL_APP_ID  ?? ''
const API_KEY = process.env.ONESIGNAL_REST_API_KEY ?? ''

interface PushPayload {
  playerIds: string[]
  title: string
  message: string
  url?: string
}

export async function sendPush({ playerIds, title, message, url }: PushPayload) {
  if (!APP_ID || !API_KEY || playerIds.length === 0) return
  await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Basic ${API_KEY}`,
    },
    body: JSON.stringify({
      app_id:             APP_ID,
      include_player_ids: playerIds,
      headings:           { en: title },
      contents:           { en: message },
      ...(url ? { url } : {}),
    }),
  })
}

// Convenience: look up user's player_id + prefs, then send if opted-in
export async function notifyUser(
  supabase: any,
  userId: string,
  opts: {
    title: string
    message: string
    url?: string
    prefKey: 'wallet_credit' | 'withdrawal_update' | 'price_drop'
  }
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('onesignal_player_id, notification_prefs')
    .eq('id', userId)
    .single()

  if (!profile?.onesignal_player_id) return
  if (profile.notification_prefs?.[opts.prefKey] === false) return

  await sendPush({ playerIds: [profile.onesignal_player_id], ...opts })
}
