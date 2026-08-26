'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Send, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Alert {
  id: string
  user_id: string
  product_id: string
  target_price: number
  created_at: string
  profiles: { name: string } | null
  products: { name: string; price: number | null } | null
}

export default function AdminPriceAlertsPage() {
  const supabase = createClient()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)
  const [sent, setSent] = useState<Record<string, boolean>>({})

  useEffect(() => {
    supabase
      .from('price_alerts')
      .select('*, profiles(name), products(name, price)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setAlerts((data as Alert[]) ?? [])
        setLoading(false)
      })
  }, [])

  const sendNotification = async (alert: Alert) => {
    setSending(alert.id)
    const productName = alert.products?.name ?? 'Product'
    const targetPrice = formatCurrency(alert.target_price)
    await supabase.from('notifications').insert({
      user_id: alert.user_id,
      message: `Price Drop Alert! "${productName}" अब आपकी target price ${targetPrice} के करीब है। अभी देखें!`,
    })
    setSent(prev => ({ ...prev, [alert.id]: true }))
    setSending(null)
  }

  if (loading) {
    return (
      <div className="space-y-2.5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] h-20 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Price Drop Alerts</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manually notify users when their target price is reached</p>
        </div>
        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm font-bold px-3 py-1 rounded-full">
          {alerts.length} alerts
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-12 text-center">
          <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Abhi koi price alert nahi</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {alerts.map(alert => {
            const currentPrice = alert.products?.price ?? 0
            const priceDropped = currentPrice <= alert.target_price
            return (
              <div
                key={alert.id}
                className={`bg-white rounded-xl border shadow-[0_1px_4px_rgba(0,0,0,0.07)] px-5 py-4 flex items-center gap-4 flex-wrap hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition-shadow ${
                  priceDropped ? 'border-emerald-200' : 'border-gray-100'
                }`}
              >
                {/* Icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${priceDropped ? 'bg-emerald-50' : 'bg-indigo-50'}`}>
                  <Bell className={`w-4 h-4 ${priceDropped ? 'text-emerald-500' : 'text-indigo-500'}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{alert.products?.name ?? '—'}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-400">
                      User: <span className="font-medium text-gray-600">{alert.profiles?.name ?? '—'}</span>
                    </span>
                    <span className="text-xs text-gray-400">
                      Target: <span className="font-semibold text-indigo-600">{formatCurrency(alert.target_price)}</span>
                    </span>
                    <span className="text-xs text-gray-400">
                      Current: <span className={`font-semibold ${priceDropped ? 'text-emerald-600' : 'text-gray-600'}`}>{formatCurrency(currentPrice)}</span>
                    </span>
                    {priceDropped && (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
                        Target Reached!
                      </span>
                    )}
                  </div>
                </div>

                {/* Action */}
                {sent[alert.id] ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
                    <Send className="w-3.5 h-3.5" /> Sent
                  </span>
                ) : (
                  <button
                    onClick={() => sendNotification(alert)}
                    disabled={sending === alert.id}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-60"
                  >
                    {sending === alert.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Send className="w-3.5 h-3.5" />
                    }
                    Notify User
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
