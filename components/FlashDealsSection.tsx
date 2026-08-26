import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Zap } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'
import CountdownTimer from './CountdownTimer'

interface FlashDeal {
  id: string
  flash_price: number
  label: string
  ends_at: string
  products: {
    id: string; name: string; price: number | null
    image_url: string | null; platform: string | null
  }
}

export default async function FlashDealsSection({
  title,
  brand,
}: {
  title: string
  brand: string
}) {
  const [supabase, t] = await Promise.all([createClient(), getTranslations('flash')])
  const { data } = await supabase
    .from('flash_deals')
    .select('*, products(id, name, price, image_url, platform)')
    .eq('is_active', true)
    .gt('ends_at', new Date().toISOString())
    .order('ends_at', { ascending: true })
    .limit(8)

  const deals = (data as FlashDeal[]) ?? []
  if (!deals.length) return null

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
          {title}
        </h2>
        <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full animate-pulse">
          {t('limitedTime')}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {deals.map(deal => {
          const p = deal.products
          const saving = p.price ? p.price - deal.flash_price : null
          const savePct = saving && p.price ? Math.round((saving / p.price) * 100) : null

          return (
            <Link
              key={deal.id}
              href={`/products/${p.id}`}
              className="shrink-0 w-44 sm:w-52 bg-white rounded-xl border border-amber-100 shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)] transition-shadow duration-200 flex flex-col overflow-hidden"
            >
              <div className="bg-amber-400 text-white text-[10px] font-black px-2 py-0.5 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 fill-white" />{deal.label}
              </div>

              <div className="relative w-full aspect-square bg-gray-50">
                {p.image_url
                  ? <Image src={p.image_url} alt={p.name} fill className="object-cover" sizes="208px" />
                  : <div className="w-full h-full flex items-center justify-center text-4xl text-gray-200">📦</div>
                }
                {savePct && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    -{savePct}%
                  </span>
                )}
              </div>

              <div className="p-3 flex flex-col gap-1.5 flex-1">
                <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">{p.name}</p>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-sm font-black text-red-500">{formatCurrency(deal.flash_price)}</span>
                  {p.price && (
                    <span className="text-[10px] text-gray-400 line-through">{formatCurrency(p.price)}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-auto pt-1">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{t('endsIn')}</span>
                  <CountdownTimer endsAt={deal.ends_at} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
