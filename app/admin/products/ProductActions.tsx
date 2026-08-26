'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, Star, Zap } from 'lucide-react'

interface Props {
  productId: string
  isFeatured: boolean
  isSponsored: boolean
}

export default function ProductActions({ productId, isFeatured, isSponsored }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<'featured' | 'sponsored' | 'delete' | null>(null)

  const toggleFeatured = async () => {
    setLoading('featured')
    await supabase.from('products').update({ is_featured: !isFeatured }).eq('id', productId)
    router.refresh()
    setLoading(null)
  }

  const toggleSponsored = async () => {
    setLoading('sponsored')
    await supabase.from('products').update({ is_sponsored: !isSponsored }).eq('id', productId)
    router.refresh()
    setLoading(null)
  }

  const del = async () => {
    if (!confirm('Is product ko delete karein?')) return
    setLoading('delete')
    await supabase.from('products').delete().eq('id', productId)
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex items-center gap-1">
      {/* Featured toggle */}
      <button
        onClick={toggleFeatured}
        disabled={loading !== null}
        title={isFeatured ? 'Remove featured' : 'Mark as featured'}
        className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
          isFeatured
            ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
            : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-50'
        }`}
      >
        {loading === 'featured'
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Star className="w-4 h-4" fill={isFeatured ? 'currentColor' : 'none'} />
        }
      </button>

      {/* Sponsored toggle */}
      <button
        onClick={toggleSponsored}
        disabled={loading !== null}
        title={isSponsored ? 'Remove sponsored' : 'Mark as sponsored'}
        className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
          isSponsored
            ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
            : 'text-gray-300 hover:text-amber-400 hover:bg-amber-50'
        }`}
      >
        {loading === 'sponsored'
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Zap className="w-4 h-4" fill={isSponsored ? 'currentColor' : 'none'} />
        }
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
          : <Trash2 className="w-4 h-4" />
        }
      </button>
    </div>
  )
}
