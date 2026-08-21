'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export default function ProductActions({ productId }: { productId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const del = async () => {
    if (!confirm('इस product को delete करें?')) return
    setLoading(true)
    await supabase.from('products').delete().eq('id', productId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button onClick={del} disabled={loading}
      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50">
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
