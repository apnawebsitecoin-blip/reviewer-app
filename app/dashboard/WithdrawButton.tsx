'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Clock, CheckCircle2, XCircle } from 'lucide-react'

interface Props {
  walletBalance: number
  panNumber: string | null
  upiId: string | null
  userId: string
}

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  paid:     'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

export default function WithdrawButton({ walletBalance, panNumber, upiId, userId }: Props) {
  const t = useTranslations('dashboard')
  const supabase = createClient()
  const router = useRouter()

  const [pending, setPending] = useState<{ id: string; amount: number; status: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    amount: String(Math.floor(walletBalance)),
    upi_id: upiId ?? '',
    pan_number: panNumber ?? '',
    bank_account: '',
    bank_ifsc: '',
  })

  useEffect(() => {
    supabase
      .from('withdrawal_requests')
      .select('id, amount, status')
      .eq('user_id', userId)
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setPending(data))
  }, [userId])

  const canWithdraw = walletBalance >= 100

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const amount = parseFloat(form.amount)
    const { error: err } = await supabase.from('withdrawal_requests').insert({
      user_id:      userId,
      amount,
      upi_id:       form.upi_id     || null,
      pan_number:   form.pan_number || null,
      bank_account: form.bank_account || null,
      bank_ifsc:    form.bank_ifsc  || null,
    })
    if (err) {
      setError(t('withdrawError'))
    } else {
      setSubmitted(true)
      setTimeout(() => { setShowForm(false); setSubmitted(false); router.refresh() }, 2000)
    }
    setSubmitting(false)
  }

  // Existing active request
  if (pending) {
    return (
      <div className={`border rounded-xl px-4 py-3 text-sm ${STATUS_STYLES[pending.status] ?? ''}`}>
        <p className="font-semibold flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {t('withdrawPending')}
        </p>
        <p className="text-xs mt-0.5 opacity-80">{t('withdrawPendingDesc', { amount: pending.amount })}</p>
        <p className="text-xs mt-1 capitalize font-bold">{pending.status}</p>
      </div>
    )
  }

  if (!canWithdraw) {
    return (
      <button disabled className="bg-gray-100 text-gray-400 px-4 py-2 rounded-xl text-sm cursor-not-allowed">
        {t('withdrawDisabled')}
      </button>
    )
  }

  return (
    <div>
      <button
        onClick={() => setShowForm(v => !v)}
        className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700 font-medium"
      >
        {t('withdraw')}
      </button>

      {showForm && !submitted && (
        <form onSubmit={handleSubmit} className="mt-3 p-4 bg-gray-50 rounded-xl space-y-3 w-80">
          <p className="text-xs text-gray-500">{t('withdrawNote')}</p>

          <div>
            <label className="text-xs font-medium text-gray-600">{t('withdrawAmount')}</label>
            <input
              type="number" min={100} max={walletBalance} step={1} required
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">{t('upiId')}</label>
            <input
              type="text" placeholder="name@upi"
              value={form.upi_id}
              onChange={e => setForm(f => ({ ...f, upi_id: e.target.value }))}
              className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600">{t('withdrawBankAccount')}</label>
              <input
                type="text"
                value={form.bank_account}
                onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))}
                className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">{t('withdrawBankIFSC')}</label>
              <input
                type="text"
                value={form.bank_ifsc}
                onChange={e => setForm(f => ({ ...f, bank_ifsc: e.target.value.toUpperCase() }))}
                className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-green-500 uppercase"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">
              {t('panRequired')}
              {parseFloat(form.amount) >= 500 && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text" maxLength={10}
              required={parseFloat(form.amount) >= 500}
              placeholder="ABCDE1234F"
              value={form.pan_number}
              onChange={e => setForm(f => ({ ...f, pan_number: e.target.value.toUpperCase() }))}
              className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-green-500 uppercase"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit" disabled={submitting}
            className="w-full bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-60"
          >
            {submitting ? '...' : t('withdrawSubmit')}
          </button>
        </form>
      )}

      {submitted && (
        <p className="text-sm text-green-600 mt-2 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />{t('withdrawSuccess')}
        </p>
      )}
    </div>
  )
}
