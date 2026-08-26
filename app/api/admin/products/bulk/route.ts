import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface ProductRow {
  name: string
  price?: string | number | null
  category?: string | null
  platform?: string | null
  original_url: string
  image_url?: string | null
}

export async function POST(req: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const products: ProductRow[] = body.products

  if (!Array.isArray(products) || products.length === 0) {
    return NextResponse.json({ error: 'No products provided', inserted: 0 }, { status: 400 })
  }

  const rows = products.map(p => ({
    name: String(p.name).trim(),
    price: p.price !== '' && p.price != null ? parseFloat(String(p.price)) : null,
    category: p.category ? String(p.category).trim() || null : null,
    platform: p.platform ? String(p.platform).trim() || null : null,
    original_url: String(p.original_url).trim(),
    image_url: p.image_url ? String(p.image_url).trim() || null : null,
  }))

  const { data, error } = await supabase.from('products').insert(rows).select('id')

  if (error) {
    return NextResponse.json({ error: error.message, inserted: 0 }, { status: 500 })
  }

  return NextResponse.json({ inserted: data?.length ?? 0 })
}
