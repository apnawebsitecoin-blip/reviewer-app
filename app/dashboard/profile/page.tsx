'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/types'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data)
      setLoading(false)
    })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ name: profile.name, phone: profile.phone, upi_id: profile.upi_id, pan_number: profile.pan_number }).eq('id', user!.id)
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="animate-pulse h-64 bg-white rounded-2xl" />

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Profile Settings</h1>
      <form onSubmit={handleSave} className="space-y-4">
        {[
          { label: 'नाम', key: 'name', type: 'text', placeholder: 'आपका नाम' },
          { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+91 XXXXX XXXXX' },
          { label: 'UPI ID', key: 'upi_id', type: 'text', placeholder: 'name@upi' },
          { label: 'PAN Number', key: 'pan_number', type: 'text', placeholder: 'ABCDE1234F' },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
            <input type={f.type} placeholder={f.placeholder}
              value={(profile as any)[f.key] ?? ''}
              onChange={e => setProfile(prev => ({ ...prev, [f.key]: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        ))}
        <button type="submit" disabled={saving}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60 font-medium">
          {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save करें'}
        </button>
      </form>
    </div>
  )
}
