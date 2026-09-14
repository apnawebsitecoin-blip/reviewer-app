import { createClient } from '@/lib/supabase/server'
import { getSiteSettings } from '@/lib/settings'
import ProductsClient from './ProductsClient'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const [supabase, settings] = await Promise.all([createClient(), getSiteSettings()])

  // categories: prefer dedicated table, fall back to site_settings.categories
  let categories: string[] = []
  try {
    const { data } = await supabase
      .from('categories')
      .select('name')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    if (data && data.length > 0) categories = data.map((c: { name: string }) => c.name)
  } catch { /* table may not exist yet */ }

  if (categories.length === 0) {
    categories = settings.categories.map(c => c.label)
  }

  // platforms: dedicated table
  let platforms: string[] = []
  try {
    const { data } = await supabase
      .from('platforms')
      .select('name')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    if (data && data.length > 0) platforms = data.map((p: { name: string }) => p.name)
  } catch { /* table may not exist yet — no platform filter shown */ }

  return <ProductsClient categories={categories} platforms={platforms} />
}
