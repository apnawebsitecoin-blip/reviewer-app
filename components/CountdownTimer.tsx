'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

function calc(endsAt: string) {
  const diff = Math.max(0, new Date(endsAt).getTime() - Date.now())
  return {
    total:   diff,
    hours:   Math.floor(diff / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  }
}

function Seg({ v }: { v: number }) {
  return (
    <span className="bg-gray-900 text-white text-[11px] font-black w-7 h-6 flex items-center justify-center rounded">
      {String(v).padStart(2, '0')}
    </span>
  )
}

export default function CountdownTimer({ endsAt }: { endsAt: string }) {
  const t = useTranslations('flash')
  const [time, setTime] = useState(() => calc(endsAt))

  useEffect(() => {
    const id = setInterval(() => setTime(calc(endsAt)), 1000)
    return () => clearInterval(id)
  }, [endsAt])

  if (time.total <= 0) {
    return <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{t('expired')}</span>
  }

  return (
    <div className="flex items-center gap-0.5">
      <Seg v={time.hours} />
      <span className="text-gray-400 font-bold text-xs mx-0.5">:</span>
      <Seg v={time.minutes} />
      <span className="text-gray-400 font-bold text-xs mx-0.5">:</span>
      <Seg v={time.seconds} />
    </div>
  )
}
