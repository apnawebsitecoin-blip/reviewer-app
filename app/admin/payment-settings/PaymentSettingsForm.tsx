'use client'
import { useState } from 'react'
import { Save, Check, AlertCircle, ShieldAlert } from 'lucide-react'
import type { PayoutConfig } from '@/lib/settings'

const PROVIDERS = [
  { value: 'manual',    label: 'Manual',    desc: 'Admin manually transfers money via UPI/NEFT' },
  { value: 'razorpay',  label: 'Razorpay',  desc: 'Razorpay X Payouts API (auto-transfer)' },
  { value: 'cashfree',  label: 'Cashfree',  desc: 'Cashfree Payouts API (auto-transfer)' },
] as const

function Toggle({ value, onChange, label, hint }: {
  value: boolean; onChange: (v: boolean) => void; label: string; hint?: string
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${value ? 'bg-green-500' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

export default function PaymentSettingsForm({ initial }: { initial: PayoutConfig }) {
  const [config, setConfig] = useState<PayoutConfig>(initial)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')

  const upd = (patch: Partial<PayoutConfig>) => setConfig(c => ({ ...c, ...patch }))

  const save = async () => {
    setSaving(true)
    setStatus('idle')
    try {
      const res = await fetch('/api/admin/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setStatus('success')
      setTimeout(() => setStatus('idle'), 4000)
    } catch (e: any) {
      setStatus('error')
      setErrMsg(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Enable/disable */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5">
        <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Payout Status</h2>
        <Toggle
          value={config.enabled}
          onChange={v => upd({ enabled: v })}
          label="Payouts Enabled"
          hint="Allow users to submit withdrawal requests"
        />
      </div>

      {/* Provider */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5">
        <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Payout Provider</h2>
        <div className="space-y-3">
          {PROVIDERS.map(p => (
            <label key={p.value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
              config.provider === p.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'
            }`}>
              <input
                type="radio"
                name="provider"
                value={p.value}
                checked={config.provider === p.value}
                onChange={() => upd({ provider: p.value })}
                className="mt-0.5 accent-indigo-600"
              />
              <div>
                <p className="text-sm font-semibold text-gray-800">{p.label}</p>
                <p className="text-xs text-gray-400">{p.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Provider-specific config (public keys only) */}
      {config.provider === 'razorpay' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Razorpay Config</h2>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Key ID <span className="text-green-600">(Public — safe to store)</span>
            </label>
            <input
              type="text"
              value={config.razorpayKeyId}
              onChange={e => upd({ razorpayKeyId: e.target.value })}
              placeholder="rzp_live_xxxxxxxxxxxxxxxx"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <SecretKeyWarning
            envVar="RAZORPAY_KEY_SECRET"
            docsHint="Razorpay Dashboard → Settings → API Keys → Secret Key"
          />
        </div>
      )}

      {config.provider === 'cashfree' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Cashfree Config</h2>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Client ID <span className="text-green-600">(Public — safe to store)</span>
            </label>
            <input
              type="text"
              value={config.cashfreeClientId}
              onChange={e => upd({ cashfreeClientId: e.target.value })}
              placeholder="CF_xxxxxxxxxxxxxxxx"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <SecretKeyWarning
            envVar="CASHFREE_CLIENT_SECRET"
            docsHint="Cashfree Dashboard → Developers → API Keys → Secret Key"
          />
        </div>
      )}

      {config.provider === 'manual' && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
          <p className="font-semibold mb-1">Manual Mode</p>
          <p className="text-xs">Withdrawal requests appear in the admin panel. Transfer money manually via UPI/NEFT and mark as Paid.</p>
        </div>
      )}

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl transition disabled:opacity-60"
        >
          {saving
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
            : <><Save className="w-4 h-4" />Save Settings</>
          }
        </button>
        {status === 'success' && (
          <span className="flex items-center gap-1.5 text-green-600 text-sm font-semibold">
            <Check className="w-4 h-4" /> Saved!
          </span>
        )}
        {status === 'error' && (
          <span className="flex items-center gap-1.5 text-red-600 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" /> {errMsg}
          </span>
        )}
      </div>
    </div>
  )
}

function SecretKeyWarning({ envVar, docsHint }: { envVar: string; docsHint: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <p className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-2">
        <ShieldAlert className="w-4 h-4" /> Secret Key — Never stored here
      </p>
      <p className="text-xs text-amber-700 mb-2">
        Add your secret key to <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">.env.local</code> only:
      </p>
      <code className="block bg-amber-100 text-amber-900 px-3 py-2 rounded-lg text-xs font-mono break-all">
        {envVar}=your_secret_key_here
      </code>
      <p className="text-xs text-amber-600 mt-2 italic">{docsHint}</p>
    </div>
  )
}
