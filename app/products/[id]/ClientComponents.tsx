'use client'
import dynamic from 'next/dynamic'
import type { User } from '@supabase/supabase-js'

const SentimentChart   = dynamic(() => import('@/components/SentimentChart'),    { ssr: false })
const QASection        = dynamic(() => import('@/components/QASection'),          { ssr: false })
const PriceHistoryChart = dynamic(() => import('@/components/PriceHistoryChart'), { ssr: false })

export function ClientSentimentChart({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  return <SentimentChart positive={positive} neutral={neutral} negative={negative} />
}

export function ClientQASection({ productId, user }: { productId: string; user: User | null }) {
  return <QASection productId={productId} user={user} />
}

export function ClientPriceHistoryChart({ productId, currentPrice }: { productId: string; currentPrice: number }) {
  return <PriceHistoryChart productId={productId} currentPrice={currentPrice} />
}
