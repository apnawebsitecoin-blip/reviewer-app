'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Send } from 'lucide-react'
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
    const productName = alert.products?.name ?? 'Product'
    const targetPrice = formatCurrency(alert.target_price)
    await supabase.from('notifications').insert({
      user_id: alert.user_id,
      message: `Price Drop Alert! "${productName}" अब आपकी target price ${targetPrice} के करीब है। अभी देखें!`,
    })
    setSent(prev => ({ ...prev, [alert.id]: true }))
  }

  if (loading) return <div className="animate-pulse h-64 bg-white rounded-2xl" />

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
        <Bell className="w-5 h-5 text-indigo-500" />Price Drop Alerts
      </h1>
      <p className="text-sm text-gray-400 mb-6">
        Users ने जिन products पर alert set किया है — manually notification भेजें जब price drop हो।
      </p>

      {alerts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
          अभी कोई price alert नहीं
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const currentPrice = alert.products?.price ?? 0
            const priceDropped = currentPrice <= alert.target_price
            return (
              <div key={alert.id} className={`bg-white rounded-xl shadow p-4 flex items-center gap-4 flex-wrap ${priceDropped ? 'border-2 border-green-400' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{alert.products?.name ?? '—'}</p>
                  <p className="text-xs text-gray-500">
                    User: <span className="font-medium">{alert.profiles?.name ?? '—'}</span>
                    {' · '}Target: <span className="text-indigo-600 font-medium">{formatCurrency(alert.target_price)}</span>
                    {' · '}Current: <span className={priceDropped ? 'text-green-600 font-bold' : 'text-gray-500'}>{formatCurrency(currentPrice)}</span>
                  </p>
                  {priceDropped && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                      ✅ Target price reached!
                    </span>
                  )}
                </div>
                <button
                  onClick={() => sendNotification(alert)}
                  disabled={sent[alert.id]}
                  className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sent[alert.id] ? 'Sent ✓' : 'Notify User'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
