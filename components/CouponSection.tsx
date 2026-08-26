'use client'

import { useState } from 'react'
import { Ticket, Copy, Check, Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Coupon } from '@/lib/types'

export default function CouponSection({ coupons }: { coupons: Coupon[] }) {
  const t = useTranslations('coupon')
  const tc = useTranslations('common')
  const [copied, setCopied] = useState<string | null>(null)

  if (!coupons.length) return null

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const el = document.createElement('textarea')
      el.value = code
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
        <Ticket className="w-3.5 h-3.5 text-amber-500" />
        {coupons.length === 1 ? t('available') : t('availableCount', { count: coupons.length })}
      </p>

      {coupons.map(c => {
        const isCopied = copied === c.code
        const expDate = c.expires_at ? new Date(c.expires_at) : null
        const msLeft = expDate ? expDate.getTime() - Date.now() : Infinity
        const isExpiringSoon = msLeft < 3 * 24 * 60 * 60 * 1000

        return (
          <div
            key={c.id}
            className="flex items-stretch rounded-xl border border-dashed border-amber-200 bg-amber-50 overflow-hidden"
          >
            <div className="bg-amber-400 text-white px-3 flex flex-col items-center justify-center min-w-[64px]">
              <span className="text-base font-black leading-none">
                {c.discount_type === 'percent' ? `${c.discount_value}%` : `₹${c.discount_value}`}
              </span>
              <span className="text-[9px] font-bold uppercase mt-0.5 opacity-90">{t('off')}</span>
            </div>

            <div className="border-l-2 border-dashed border-amber-200" />

            <div className="flex-1 px-3 py-2.5 min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-tight">{c.title}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <code className="text-xs font-mono font-bold text-amber-700 bg-white border border-amber-200 px-1.5 py-0.5 rounded tracking-widest">
                  {c.code}
                </code>
                {expDate ? (
                  <span className={`text-[10px] flex items-center gap-1 font-medium ${isExpiringSoon ? 'text-red-500' : 'text-gray-400'}`}>
                    <Clock className="w-2.5 h-2.5" />
                    {isExpiringSoon ? t('expiringSoon') : t('expires') + ' '}
                    {expDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400">{t('noExpiry')}</span>
                )}
              </div>
            </div>

            <button
              onClick={() => copy(c.code)}
              className={`flex items-center gap-1.5 px-4 text-xs font-bold shrink-0 transition-colors ${
                isCopied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              {isCopied
                ? <><Check className="w-3.5 h-3.5" /> {tc('copied')}</>
                : <><Copy className="w-3.5 h-3.5" /> {tc('copy')}</>
              }
            </button>
          </div>
        )
      })}
    </div>
  )
}
