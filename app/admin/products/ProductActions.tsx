'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, Star, Zap, Pencil } from 'lucide-react'
import EditProductModal, { type EditableProduct } from './EditProductModal'

interface Props {
  product: EditableProduct & { is_featured: boolean; is_sponsored: boolean }
}

export default function ProductActions({ product }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<'featured' | 'sponsored' | 'delete' | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const toggleFeatured = async () => {
    setLoading('featured')
    await supabase.from('products').update({ is_featured: !product.is_featured }).eq('id', product.id)
    router.refresh()
    setLoading(null)
  }

  const toggleSponsored = async () => {
    setLoading('sponsored')
    await supabase.from('products').update({ is_sponsored: !product.is_sponsored }).eq('id', product.id)
    router.refresh()
    setLoading(null)
  }

  const del = async () => {
    if (!confirm('Is product ko delete karein?')) return
    setLoading('delete')
    await supabase.from('products').delete().eq('id', product.id)
    router.refresh()
    setLoading(null)
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Edit */}
        <button
          onClick={() => setEditOpen(true)}
          disabled={loading !== null}
          title="Edit product"
          className="p-2 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <Pencil className="w-4 h-4" />
        </button>

        {/* Featured */}
        <button
          onClick={toggleFeatured}
          disabled={loading !== null}
          title={product.is_featured ? 'Remove featured' : 'Mark as featured'}
          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
            product.is_featured
              ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
              : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-50'
          }`}
        >
          {loading === 'featured'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Star className="w-4 h-4" fill={product.is_featured ? 'currentColor' : 'none'} />}
        </button>

        {/* Sponsored */}
        <button
          onClick={toggleSponsored}
          disabled={loading !== null}
          title={product.is_sponsored ? 'Remove sponsored' : 'Mark as sponsored'}
          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
            product.is_sponsored
              ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
              : 'text-gray-300 hover:text-amber-400 hover:bg-amber-50'
          }`}
        >
          {loading === 'sponsored'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Zap className="w-4 h-4" fill={product.is_sponsored ? 'currentColor' : 'none'} />}
        </button>

        {/* Delete */}
        <button
          onClick={del}
          disabled={loading !== null}
          title="Delete product"
          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading === 'delete'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Trash2 className="w-4 h-4" />}
        </button>
      </div>

      {editOpen && (
        <EditProductModal product={product} onClose={() => setEditOpen(false)} />
      )}
    </>
  )
}
