'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, AlertCircle, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition bg-white'
const LABEL = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'

type Status = 'idle' | 'loading' | 'success' | 'error'

function StatusMessage({ status, successMsg, errorMsg }: { status: Status; successMsg: string; errorMsg: string }) {
  if (status === 'success') {
    return (
      <p className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
        <Check className="w-4 h-4 shrink-0" /> {successMsg}
      </p>
    )
  }
  if (status === 'error') {
    return (
      <p className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
        <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
      </p>
    )
  }
  return null
}

function PasswordInput({ id, value, onChange, placeholder }: {
  id: string; value: string; onChange: (v: string) => void; placeholder: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={INPUT + ' pr-10'}
        autoComplete="new-password"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

// ── Password change section ────────────────────────────────────────────────────

function ChangePasswordForm() {
  const supabase = createClient()
  const [newPassword, setNewPassword]     = useState('')
  const [confirmPassword, setConfirm]     = useState('')
  const [status, setStatus]               = useState<Status>('idle')
  const [errorMsg, setErrorMsg]           = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      setStatus('error')
      setErrorMsg('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setStatus('error')
      setErrorMsg('Passwords do not match.')
      return
    }

    setStatus('loading')
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('success')
      setNewPassword('')
      setConfirm('')
      setTimeout(() => setStatus('idle'), 5000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4 text-indigo-500" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900">Change Password</h2>
          <p className="text-xs text-gray-400 mt-0.5">Takes effect immediately — you won&apos;t be logged out</p>
        </div>
      </div>

      <div className="space-y-4 max-w-sm">
        <div>
          <label htmlFor="new-password" className={LABEL}>New Password</label>
          <PasswordInput
            id="new-password"
            value={newPassword}
            onChange={v => { setNewPassword(v); setStatus('idle') }}
            placeholder="At least 8 characters"
          />
          {newPassword.length > 0 && newPassword.length < 8 && (
            <p className="text-xs text-amber-500 mt-1">{newPassword.length}/8 characters minimum</p>
          )}
        </div>

        <div>
          <label htmlFor="confirm-password" className={LABEL}>Confirm Password</label>
          <PasswordInput
            id="confirm-password"
            value={confirmPassword}
            onChange={v => { setConfirm(v); setStatus('idle') }}
            placeholder="Re-enter new password"
          />
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <p className="text-xs text-red-500 mt-1">Passwords don&apos;t match</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-5 flex-wrap">
        <button
          type="submit"
          disabled={status === 'loading' || newPassword.length < 8 || newPassword !== confirmPassword}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition"
        >
          {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          Update Password
        </button>
        <StatusMessage
          status={status}
          successMsg="Password updated successfully."
          errorMsg={errorMsg}
        />
      </div>
    </form>
  )
}

// ── Email change section ───────────────────────────────────────────────────────

function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const supabase = createClient()
  const [newEmail, setNewEmail] = useState('')
  const [status, setStatus]     = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = newEmail.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus('error')
      setErrorMsg('Please enter a valid email address.')
      return
    }
    if (trimmed === currentEmail.toLowerCase()) {
      setStatus('error')
      setErrorMsg('This is already your current email address.')
      return
    }

    setStatus('loading')
    const { error } = await supabase.auth.updateUser({ email: trimmed })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('success')
      setNewEmail('')
      setTimeout(() => setStatus('idle'), 8000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
          <Mail className="w-4 h-4 text-indigo-500" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900">Change Email Address</h2>
          <p className="text-xs text-gray-400 mt-0.5">A confirmation link will be sent to the new address</p>
        </div>
      </div>

      <div className="space-y-4 max-w-sm">
        <div>
          <label className={LABEL}>Current Email</label>
          <div className="w-full border border-gray-100 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-500 font-mono select-all">
            {currentEmail}
          </div>
        </div>

        <div>
          <label htmlFor="new-email" className={LABEL}>New Email Address</label>
          <input
            id="new-email"
            type="email"
            value={newEmail}
            onChange={e => { setNewEmail(e.target.value); setStatus('idle') }}
            placeholder="new@example.com"
            className={INPUT}
            autoComplete="email"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 mt-5 flex-wrap">
        <button
          type="submit"
          disabled={status === 'loading' || !newEmail.trim()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition"
        >
          {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          Send Confirmation
        </button>
        <StatusMessage
          status={status}
          successMsg="Confirmation email sent — check your inbox to complete the change."
          errorMsg={errorMsg}
        />
      </div>
    </form>
  )
}

// ── Root export ────────────────────────────────────────────────────────────────

export default function AccountSettingsForm({ currentEmail }: { currentEmail: string }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <ChangePasswordForm />
      <ChangeEmailForm currentEmail={currentEmail} />
    </div>
  )
}
