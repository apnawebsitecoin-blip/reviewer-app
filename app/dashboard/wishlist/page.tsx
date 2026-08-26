import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function WishlistPage() {
  const [supabase, t] = await Promise.all([createClient(), getTranslations('wishlist')])
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('wishlists')
    .select('*, products(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const items = data ?? []

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Heart className="w-5 h-5 text-red-400 fill-red-400" />
        {t('title')}
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow">
          <Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 mb-1 font-medium">{t('empty')}</p>
          <p className="text-sm text-gray-400 mb-5">{t('emptyDesc')}</p>
          <Link href="/products"
            className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-indigo-700 font-medium">
            {t('browseCta')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map(item => {
            const p = (item as any).products
            return (
              <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="relative h-40 bg-gray-100">
                  {p?.image_url ? (
                    <Image src={p.image_url} alt={p.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-300 text-3xl">📦</div>
                  )}
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <p className="text-sm font-semibold text-gray-800 line-clamp-2 flex-1">{p?.name}</p>
                  {p?.price && (
                    <p className="text-indigo-600 font-bold text-sm mt-1">{formatCurrency(p.price)}</p>
                  )}
                  <Link href={`/products/${p?.id}`}
                    className="mt-2 block text-center bg-indigo-600 text-white py-1.5 rounded-lg text-xs hover:bg-indigo-700 font-medium">
                    {t('viewDeal')}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
