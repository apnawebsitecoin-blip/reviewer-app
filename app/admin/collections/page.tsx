'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, BookMarked, Loader2 } from 'lucide-react'
import type { Collection, Product } from '@/lib/types'

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition bg-white'
const LABEL = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'

export default function AdminCollectionsPage() {
  const supabase = createClient()
  const [collections, setCollections] = useState<Collection[]>([])
  const [products,    setProducts]    = useState<Product[]>([])
  const [title,       setTitle]       = useState('')
  const [selected,    setSelected]    = useState<string[]>([])
  const [loading,     setLoading]     = useState(false)
  const [deleting,    setDeleting]    = useState<string | null>(null)

  useEffect(() => {
    supabase.from('collections').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setCollections(data ?? []))
    supabase.from('products').select('id, name, category').order('name')
      .then(({ data }) => setProducts((data as Product[]) ?? []))
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !selected.length) return
    setLoading(true)
    const { data } = await supabase.from('collections').insert({ title, product_ids: selected }).select().single()
    if (data) setCollections(prev => [data, ...prev])
    setTitle(''); setSelected([])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await supabase.from('collections').delete().eq('id', id)
    setCollections(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
  }

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Collections</h1>
          <p className="text-sm text-gray-400 mt-0.5">Group products into curated collections</p>
        </div>
        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm font-bold px-3 py-1 rounded-full">
          {collections.length} collections
        </span>
      </div>

      {/* Create form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5 mb-6">
        <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-indigo-600" /> Nayi Collection Banao
        </h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className={LABEL}>Collection Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Jaise: ₹500 se kam mein best face wash"
              className={INPUT}
              required
            />
          </div>
          <div>
            <label className={LABEL}>Products Select Karo ({selected.length} selected)</label>
            <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-50">
              {products.map(p => (
                <label key={p.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={() => toggle(p.id)}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <span className="text-sm text-gray-700 flex-1">{p.name}</span>
                  {p.category && (
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                      {p.category}
                    </span>
                  )}
                </label>
              ))}
              {products.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">Koi product nahi — pehle products add karo</p>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !title || !selected.length}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loading ? 'Banayi ja rahi hai…' : 'Collection Banao'}
          </button>
        </form>
      </div>

      {/* Collection list */}
      {collections.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-12 text-center">
          <BookMarked className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Abhi koi collection nahi</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {collections.map(col => (
            <div
              key={col.id}
              className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] px-5 py-4 flex items-center justify-between hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                  <BookMarked className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{col.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{col.product_ids?.length ?? 0} products</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(col.id)}
                disabled={deleting === col.id}
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting === col.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Trash2 className="w-4 h-4" />
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
