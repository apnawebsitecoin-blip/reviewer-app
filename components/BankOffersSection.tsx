'use client'
import { ChevronRight } from 'lucide-react'

export interface BankOffer {
  id: string
  bank_name: string
  offer_text: string
  discount_text: string | null
  card_color: string | null
  valid_till: string | null
  display_order: number
}

export default function BankOffersSection({ offers, title }: { offers: BankOffer[]; title?: string }) {
  if (!offers.length) return null

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
          {title ?? '🏦 Bank Offers'}
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {offers.map(offer => {
          const bg = offer.card_color ?? '#1e40af'
          return (
            <div
              key={offer.id}
              className="shrink-0 w-56 sm:w-64 rounded-xl p-4 flex flex-col gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
              style={{ background: bg }}
            >
              <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">{offer.bank_name}</p>
              {offer.discount_text && (
                <p className="text-white text-xl font-extrabold leading-none">{offer.discount_text}</p>
              )}
              <p className="text-white/90 text-xs leading-snug line-clamp-2">{offer.offer_text}</p>
              {offer.valid_till && (
                <p className="text-white/55 text-[10px] mt-auto pt-1 border-t border-white/15">
                  Valid till {new Date(offer.valid_till).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          )
        })}
        {/* "View all" placeholder */}
        <div className="shrink-0 w-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <div className="w-10 h-10 border-2 border-dashed border-gray-200 rounded-full flex items-center justify-center">
              <ChevronRight className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium text-center">More</span>
          </div>
        </div>
      </div>
    </section>
  )
}
