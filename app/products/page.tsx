'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { Search, SlidersHorizontal } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import type { Product } from '@/lib/types'

const CATEGORIES = ['Electronics', 'Beauty', 'Kitchen', 'Fashion', 'Health', 'Books', 'Sports', 'Home', 'Toys', 'Other']

export default function ProductsPage() {
  const t = useTranslations('product')
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [search, category])

  async function fetchProducts() {
    setLoading(true)
    let q = supabase.from('products').select('*').order('created_at', { ascending: false })
    if (search.trim()) q = q.ilike('name', `%${search.trim()}%`)
    if (category) q = q.eq('category', category)
    const { data } = await q
    setProducts(data ?? [])
    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-4">{t('allProducts')}</h1>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder={t('searchPlaceholder')} value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="pl-9 pr-3 py-2 border rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="">{t('allCategories')}</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-56 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">{t('notFound')}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map(p => (
            <Link key={p.id} href={`/products/${p.id}`}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden group">
              <div className="relative h-40 bg-gray-100">
                {p.image_url ? (
                  <Image src={p.image_url} alt={p.name} fill className="object-cover group-hover:scale-105 transition" />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-300 text-3xl">📦</div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-gray-800 line-clamp-2">{p.name}</p>
                {p.price && <p className="text-indigo-600 font-bold text-sm mt-1">{formatCurrency(p.price)}</p>}
                <div className="flex items-center justify-between mt-1">
                  {p.category && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{p.category}</span>}
                  {p.platform && <span className="text-xs text-gray-400 capitalize">{p.platform}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
