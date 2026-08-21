'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/lib/types'

interface ProductWithStats extends Product {
  reviewCount: number
  positivePercent: number
}

export default function ComparePage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [compareData, setCompareData] = useState<ProductWithStats[]>([])
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let q = supabase.from('products').select('*').order('name')
    if (category) q = (q as any).eq('category', category)
    q.then(({ data }) => setProducts(data ?? []))
  }, [category])

  const handleCompare = async () => {
    if (selected.length < 2) return
    setLoading(true)
    const results: ProductWithStats[] = []
    for (const id of selected) {
      const prod = products.find(p => p.id === id)
      if (!prod) continue
      const { data: reviews } = await supabase.from('reviews').select('sentiment').eq('product_id', id).eq('verified', true)
      const total = (reviews ?? []).length
      const positive = (reviews ?? []).filter(r => r.sentiment === 'positive').length
      results.push({ ...prod, reviewCount: total, positivePercent: total > 0 ? Math.round((positive / total) * 100) : 0 })
    }
    setCompareData(results)
    setLoading(false)
  }

  const CATEGORIES = ['Electronics', 'Beauty', 'Kitchen', 'Fashion', 'Health', 'Books', 'Sports', 'Home', 'Toys', 'Other']

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">Compare Products</h1>

      <div className="bg-white rounded-2xl shadow p-5 mb-6">
        <div className="flex gap-3 mb-4 flex-wrap">
          <select value={category} onChange={e => { setCategory(e.target.value); setSelected([]) }}
            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">सभी Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <p className="text-sm text-gray-400 self-center">2-3 products चुनें compare के लिए</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
          {products.map(p => (
            <label key={p.id} className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition ${selected.includes(p.id) ? 'border-indigo-500 bg-indigo-50' : 'hover:border-gray-300'}`}>
              <input type="checkbox" checked={selected.includes(p.id)} className="w-4 h-4"
                onChange={e => {
                  if (e.target.checked && selected.length < 3) setSelected(prev => [...prev, p.id])
                  else if (!e.target.checked) setSelected(prev => prev.filter(id => id !== p.id))
                }} />
              <span className="text-xs text-gray-700 line-clamp-2">{p.name}</span>
            </label>
          ))}
        </div>

        <button onClick={handleCompare} disabled={selected.length < 2 || loading}
          className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60">
          {loading ? 'Compare हो रहा है...' : `Compare (${selected.length} selected)`}
        </button>
      </div>

      {compareData.length >= 2 && (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left text-gray-500 text-xs w-32">Feature</th>
                  {compareData.map(p => (
                    <th key={p.id} className="px-4 py-3 text-center">
                      <Link href={`/products/${p.id}`} className="text-indigo-600 hover:underline font-medium line-clamp-2 block max-w-[120px] mx-auto">
                        {p.name}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-4 py-3 text-gray-500 font-medium text-xs">Price</td>
                  {compareData.map(p => (
                    <td key={p.id} className="px-4 py-3 text-center font-bold text-indigo-600">
                      {p.price ? formatCurrency(p.price) : '—'}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 font-medium text-xs">Reviews</td>
                  {compareData.map(p => (
                    <td key={p.id} className="px-4 py-3 text-center text-gray-700">{p.reviewCount}</td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-500 font-medium text-xs">Positive %</td>
                  {compareData.map(p => (
                    <td key={p.id} className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${p.positivePercent}%` }} />
                        </div>
                        <span className="text-green-600 font-medium">{p.positivePercent}%</span>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 font-medium text-xs">Platform</td>
                  {compareData.map(p => (
                    <td key={p.id} className="px-4 py-3 text-center capitalize text-gray-600">{p.platform ?? '—'}</td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-500 font-medium text-xs">Buy</td>
                  {compareData.map(p => (
                    <td key={p.id} className="px-4 py-3 text-center">
                      <Link href={`/products/${p.id}`}
                        className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-indigo-700">
                        देखें
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
