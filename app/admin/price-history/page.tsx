'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LineChart, Plus, Trash2, Loader2, ChevronDown, ChevronUp, Search } from 'lucide-react'
import type { Product } from '@/lib/types'

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition bg-white'
const LABEL = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'

interface PriceHistoryRow {
  id: string
  product_id: string
  price: number
  recorded_at: string
}

export default function AdminPriceHistoryPage() {
  const supabase = createClient()
  const [products,        setProducts]        = useState<Product[]>([])
  const [productSearch,   setProductSearch]   = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [history,         setHistory]         = useState<PriceHistoryRow[]>([])
  const [historyLoading,  setHistoryLoading]  = useState(false)
  const [deleting,        setDeleting]        = useState<string | null>(null)
  const [addOpen,         setAddOpen]         = useState(false)
  const [addPrice,        setAddPrice]        = useState('')
  const [addDate,         setAddDate]         = useState(new Date().toISOString().slice(0, 16))
  const [addLoading,      setAddLoading]      = useState(false)
  const [addError,        setAddError]        = useState('')

  useEffect(() => {
    supabase
      .from('products')
      .select('id, name, image_url, price, platform, category, original_url')
      .order('name')
      .then(({ data }) => setProducts((data as Product[]) ?? []))
  }, [])

  const loadHistory = async (product: Product) => {
    setSelectedProduct(product)
    setHistory([])
    setAddOpen(false)
    setHistoryLoading(true)
    const { data } = await supabase
      .from('price_history')
      .select('id, product_id, price, recorded_at')
      .eq('product_id', product.id)
      .order('recorded_at', { ascending: false })
    setHistory((data as PriceHistoryRow[]) ?? [])
    setHistoryLoading(false)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || !addPrice) return
    setAddError('')
    setAddLoading(true)
    const { data, error } = await supabase
      .from('price_history')
      .insert({
        product_id:  selectedProduct.id,
        price:       parseFloat(addPrice),
        recorded_at: new Date(addDate).toISOString(),
      })
      .select('id, product_id, price, recorded_at')
      .single()
    if (error) {
      setAddError(error.message)
      setAddLoading(false)
      return
    }
    setHistory(prev => [data as PriceHistoryRow, ...prev].sort(
      (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
    ))
    setAddPrice('')
    setAddDate(new Date().toISOString().slice(0, 16))
    setAddOpen(false)
    setAddLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this price entry?')) return
    setDeleting(id)
    await supabase.from('price_history').delete().eq('id', id)
    setHistory(prev => prev.filter(h => h.id !== id))
    setDeleting(null)
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Price History</h1>
          <p className="text-sm text-gray-400 mt-0.5">Seed or correct price history entries per product</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Product list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Search products…"
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition bg-white"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[520px]">
            {filteredProducts.length === 0 ? (
              <p className="text-sm text-gray-400 p-4 text-center">No products found.</p>
            ) : (
              filteredProducts.map(p => (
                <button
                  key={p.id}
                  onClick={() => loadHistory(p)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                    selectedProduct?.id === p.id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''
                  }`}
                >
                  {p.image_url && (
                    <img src={p.image_url} alt="" className="w-9 h-9 rounded-lg object-cover bg-gray-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">₹{p.price?.toLocaleString('en-IN')}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* History panel */}
        <div className="lg:col-span-3">
          {!selectedProduct ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-12 text-center h-full flex flex-col items-center justify-center">
              <LineChart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Select a product to view its price history</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">{selectedProduct.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Current price: ₹{selectedProduct.price?.toLocaleString('en-IN')}</p>
                </div>
                <button
                  onClick={() => setAddOpen(o => !o)}
                  className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Entry
                  {addOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Add entry form */}
              {addOpen && (
                <form
                  onSubmit={handleAdd}
                  className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5"
                >
                  <h3 className="text-sm font-bold text-gray-700 mb-4">New Price Entry</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL}>Price (₹) *</label>
                      <input
                        type="number" min="0" step="0.01" required
                        value={addPrice}
                        onChange={e => setAddPrice(e.target.value)}
                        placeholder="e.g. 1299"
                        className={INPUT}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Recorded At *</label>
                      <input
                        type="datetime-local" required
                        value={addDate}
                        onChange={e => setAddDate(e.target.value)}
                        className={INPUT}
                      />
                    </div>
                  </div>
                  {addError && <p className="text-xs text-red-600 mt-2">{addError}</p>}
                  <div className="flex gap-3 mt-4">
                    <button
                      type="submit" disabled={addLoading}
                      className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition"
                    >
                      {addLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Entry
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddOpen(false)}
                      className="text-sm text-gray-500 px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* History table */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] overflow-hidden">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="p-10 text-center text-sm text-gray-400">
                    No price history yet — add an entry above.
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      <tr>
                        <th className="text-left px-5 py-3">Date</th>
                        <th className="text-right px-5 py-3">Price</th>
                        <th className="w-12 px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {history.map(row => (
                        <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 text-gray-700">
                            {new Date(row.recorded_at).toLocaleString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-gray-900">
                            ₹{row.price.toLocaleString('en-IN')}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleDelete(row.id)}
                              disabled={deleting === row.id}
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            >
                              {deleting === row.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Trash2 className="w-4 h-4" />
                              }
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
