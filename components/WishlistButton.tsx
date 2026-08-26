'use client'
import { useState } from 'react'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface Props {
  productId: string
  userId: string | null
  initialWishlisted: boolean
}

export default function WishlistButton({ productId, userId, initialWishlisted }: Props) {
  const t = useTranslations('wishlist')
  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const toggle = async () => {
    if (!userId) { router.push('/auth/login'); return }
    setLoading(true)
    if (wishlisted) {
      await supabase.from('wishlists').delete().eq('user_id', userId).eq('product_id', productId)
      setWishlisted(false)
    } else {
      await supabase.from('wishlists').insert({ user_id: userId, product_id: productId })
      setWishlisted(true)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={wishlisted ? t('remove') : t('save')}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition font-medium ${
        wishlisted
          ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
          : 'border-gray-300 text-gray-500 hover:bg-gray-50'
      }`}
    >
      <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-400 text-red-400' : ''}`} />
      {wishlisted ? t('saved') : t('save')}
    </button>
  )
}
