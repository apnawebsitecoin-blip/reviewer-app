'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface Props {
  walletBalance: number
  panNumber: string | null
  userId: string
}

export default function WithdrawButton({ walletBalance, panNumber, userId }: Props) {
  const t = useTranslations('dashboard')
  const [showForm, setShowForm] = useState(false)
  const [pan, setPan] = useState(panNumber ?? '')
  const [upi, setUpi] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const canWithdraw = walletBalance >= 100

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pan.trim()) return
    await supabase.from('profiles').update({ pan_number: pan, upi_id: upi }).eq('id', userId)
    setSubmitted(true)
    setTimeout(() => { setSubmitted(false); setShowForm(false); router.refresh() }, 2000)
  }

  if (!canWithdraw) return (
    <button disabled className="bg-gray-100 text-gray-400 px-4 py-2 rounded-xl text-sm cursor-not-allowed">
      {t('withdrawDisabled')}
    </button>
  )

  return (
    <div>
      <button onClick={() => setShowForm(!showForm)}
        className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700 font-medium">
        {t('withdraw')}
      </button>
      {showForm && !submitted && (
        <form onSubmit={handleSubmit} className="mt-3 p-4 bg-gray-50 rounded-xl space-y-3 w-72">
          <p className="text-xs text-gray-500">{t('withdrawNote')}</p>
          <div>
            <label className="text-xs font-medium text-gray-600">{t('panRequired')}</label>
            <input value={pan} onChange={e => setPan(e.target.value.toUpperCase())} required maxLength={10}
              placeholder="ABCDE1234F"
              className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-green-500 uppercase" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">{t('upiId')}</label>
            <input value={upi} onChange={e => setUpi(e.target.value)}
              placeholder="name@upi"
              className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700">
            {t('withdrawSubmit')}
          </button>
        </form>
      )}
      {submitted && <p className="text-sm text-green-600 mt-2">{t('withdrawSuccess')}</p>}
    </div>
  )
}
