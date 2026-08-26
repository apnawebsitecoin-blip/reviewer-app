import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const payoutConfig = await req.json()

  const { data: existing } = await supabase.from('site_settings').select('settings').eq('id', 1).single()
  const merged = { ...(existing?.settings ?? {}), payoutConfig }

  const { error } = await supabase.from('site_settings').upsert({ id: 1, settings: merged })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
