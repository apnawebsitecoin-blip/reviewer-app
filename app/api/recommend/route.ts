import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const budget   = parseInt(searchParams.get('budget') ?? '0', 10)
  const category = searchParams.get('category') ?? ''

  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('id, name, price, image_url, platform, category, original_url')
    .not('price', 'is', null)

  if (budget > 0)                     query = query.lte('price', budget)
  if (category && category !== 'all') query = query.eq('category', category)

  // Prefer featured, then sort by price descending (best value near budget)
  query = query.order('is_featured', { ascending: false })
               .order('price', { ascending: false })
               .limit(6)

  const { data: products, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ products: products ?? [] })
}
