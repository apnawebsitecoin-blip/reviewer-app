import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scrapeProduct } from '@/lib/scrape'

export const maxDuration = 15

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const url: string = body?.url ?? ''
  if (!url.startsWith('http')) {
    return NextResponse.json({ error: 'Valid URL required' }, { status: 400 })
  }

  return NextResponse.json(await scrapeProduct(url))
}
