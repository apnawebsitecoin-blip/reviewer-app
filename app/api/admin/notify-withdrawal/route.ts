import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { notifyUser } from '@/lib/onesignal'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!admin?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, status, amount } = await req.json() as {
    userId: string; status: string; amount: number
  }

  const title =
    status === 'approved' ? 'Withdrawal Approved ✓' :
    status === 'paid'     ? 'Payment Sent 💸' :
    status === 'rejected' ? 'Withdrawal Rejected' : 'Withdrawal Update'

  const message =
    status === 'approved' ? `Your withdrawal of ₹${amount} has been approved.` :
    status === 'paid'     ? `₹${amount} has been transferred to your account.` :
    status === 'rejected' ? `Your withdrawal of ₹${amount} was rejected. Check your wallet — amount refunded.` :
    `Your withdrawal status changed to ${status}.`

  // In-app notification
  await supabase.from('notifications').insert({ user_id: userId, message })

  // Push notification
  await notifyUser(supabase, userId, {
    title,
    message,
    url: '/dashboard',
    prefKey: 'withdrawal_update',
  })

  return NextResponse.json({ ok: true })
}
