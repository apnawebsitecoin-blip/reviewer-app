'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, X, Search, Loader2, ShoppingBag, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Fashion', label: 'Fashion' },
  { value: 'Home & Kitchen', label: 'Home & Kitchen' },
  { value: 'Beauty & Personal Care', label: 'Beauty' },
  { value: 'Sports & Outdoors', label: 'Sports' },
  { value: 'Books', label: 'Books' },
  { value: 'Grocery', label: 'Grocery' },
  { value: 'Health', label: 'Health' },
  { value: 'Other', label: 'Other' },
]

const BUDGETS = [
  { value: 500,   label: 'Under ₹500' },
  { value: 1000,  label: 'Under ₹1,000' },
  { value: 2000,  label: 'Under ₹2,000' },
  { value: 5000,  label: 'Under ₹5,000' },
  { value: 10000, label: 'Under ₹10,000' },
  { value: 25000, label: 'Under ₹25,000' },
  { value: 0,     label: 'Any Budget' },
]

interface Product {
  id: string
  name: string
  price: number | null
  image_url: string | null
  category: string | null
  platform: string | null
}

export default function ProductFinder() {
  const [open, setOpen]         = useState(false)
  const [budget, setBudget]     = useState(5000)
  const [category, setCategory] = useState('all')
  const [loading, setLoading]   = useState(false)
  const [results, setResults]   = useState<Product[] | null>(null)
  const [searched, setSearched] = useState(false)

  const handleFind = async () => {
    setLoading(true)
    setSearched(true)
    const params = new URLSearchParams({ budget: String(budget), category })
    const res = await fetch(`/api/recommend?${params}`)
    const data = await res.json()
    setResults(data.products ?? [])
    setLoading(false)
  }

  const reset = () => { setResults(null); setSearched(false) }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 z-40 flex items-center gap-2 text-white font-bold px-4 py-3 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-transform"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        title="Find your perfect deal"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm hidden sm:inline">Find My Deal</span>
      </button>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h2 className="text-base font-black text-gray-900">Find My Perfect Deal</h2>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Budget */}
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Budget</label>
                <div className="grid grid-cols-3 gap-2">
                  {BUDGETS.map(b => (
                    <button
                      key={b.value}
                      onClick={() => { setBudget(b.value); reset() }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                        budget === b.value
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => { setCategory(c.value); reset() }}
                      className={`py-1.5 px-3 rounded-full text-xs font-bold border transition-all ${
                        category === c.value
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Find button */}
              <button
                onClick={handleFind}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching…</>
                  : <><Search className="w-4 h-4" /> Find Deals</>}
              </button>

              {/* Results */}
              {searched && !loading && (
                <div>
                  {results && results.length > 0 ? (
                    <div className="space-y-2.5">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        {results.length} deals found
                      </p>
                      {results.map(p => (
                        <Link
                          key={p.id}
                          href={`/products/${p.id}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                        >
                          {/* Thumbnail */}
                          <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                            {p.image_url
                              ? /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-gray-300" /></div>
                            }
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 line-clamp-1 group-hover:text-indigo-700 transition-colors">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.category}</p>
                          </div>
                          {/* Price */}
                          <div className="text-right shrink-0">
                            {p.price != null && (
                              <p className="text-sm font-black text-gray-900">{formatCurrency(p.price)}</p>
                            )}
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 ml-auto transition-colors" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-semibold">Koi deal nahi mila</p>
                      <p className="text-xs mt-1">Budget badhao ya category badlo</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
