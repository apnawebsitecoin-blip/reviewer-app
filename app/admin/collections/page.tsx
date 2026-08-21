'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2 } from 'lucide-react'
import type { Collection, Product } from '@/lib/types'

export default function AdminCollectionsPage() {
  const supabase = createClient()
  const [collections, setCollections] = useState<Collection[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [title, setTitle] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('collections').select('*').order('created_at', { ascending: false }).then(({ data }) => setCollections(data ?? []))
    supabase.from('products').select('id, name, category').order('name').then(({ data }) => setProducts(data as Product[] ?? []))
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !selected.length) return
    setLoading(true)
    const { data } = await supabase.from('collections').insert({ title, product_ids: selected }).select().single()
    if (data) setCollections(prev => [data, ...prev])
    setTitle('')
    setSelected([])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('collections').delete().eq('id', id)
    setCollections(prev => prev.filter(c => c.id !== id))
  }

  const toggleProduct = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">Collections</h1>

      <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow p-5 mb-6 space-y-4">
        <h2 className="font-semibold text-gray-700">नई Collection बनाएं</h2>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Collection का नाम (जैसे: ₹500 से कम में best face wash)"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
        <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
          {products.map(p => (
            <label key={p.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleProduct(p.id)} className="w-4 h-4" />
              <span className="text-sm text-gray-700">{p.name}</span>
              <span className="text-xs text-gray-400 ml-auto">{p.category}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-400">{selected.length} products selected</p>
        <button type="submit" disabled={loading || !title || !selected.length}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
          <Plus className="w-4 h-4" />{loading ? 'बनाई जा रही है...' : 'Collection बनाएं'}
        </button>
      </form>

      <div className="space-y-3">
        {collections.map(col => (
          <div key={col.id} className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">{col.title}</p>
              <p className="text-xs text-gray-400">{col.product_ids?.length ?? 0} products</p>
            </div>
            <button onClick={() => handleDelete(col.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
