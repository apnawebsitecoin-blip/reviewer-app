import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const REFERRAL_BONUS = 20
// Flag (but don't block) if more than this many referral bonuses from one IP in 24h
const SUSPICIOUS_IP_THRESHOLD = 3

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const admin = createAdminClient()

  // Read new user's profile for referred_by and idempotency check
  const { data: profile } = await admin
    .from('profiles')
    .select('referred_by, referral_bonus_paid_at')
    .eq('id', user.id)
    .single()

  if (!profile?.referred_by) return NextResponse.json({ ok: true, skipped: 'no_referrer' })

  // Idempotent: don't double-credit if page is reloaded or route called twice
  if (profile.referral_bonus_paid_at) return NextResponse.json({ ok: true, skipped: 'already_paid' })

  // Self-referral guard (shouldn't reach here, but defend in depth)
  if (profile.referred_by === user.id) return NextResponse.json({ ok: false, error: 'self_referral' }, { status: 400 })

  // IP-based fraud signal: flag if 3+ accounts from same IP claimed a referral bonus today
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown'
  const oneDayAgo = new Date(Date.now() - 86_400_000).toISOString()

  const { count: ipBonusCount } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('signup_ip', ip)
    .not('referral_bonus_paid_at', 'is', null)
    .gte('referral_bonus_paid_at', oneDayAgo)

  // Credit both wallets atomically via DB function (no read-modify-write race)
  await Promise.all([
    admin.rpc('fn_increment_wallet', { p_user_id: profile.referred_by, p_amount: REFERRAL_BONUS }),
    admin.rpc('fn_increment_wallet', { p_user_id: user.id, p_amount: REFERRAL_BONUS }),
  ])

  // Mark bonus paid + record IP for future fraud checks
  await admin
    .from('profiles')
    .update({ referral_bonus_paid_at: new Date().toISOString(), signup_ip: ip })
    .eq('id', user.id)

  const suspicious = (ipBonusCount ?? 0) >= SUSPICIOUS_IP_THRESHOLD
  return NextResponse.json({ ok: true, suspicious })
}
