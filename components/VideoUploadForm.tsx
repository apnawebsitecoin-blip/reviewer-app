'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Film, ChevronDown, ChevronUp, Upload, Check, AlertCircle, Loader2 } from 'lucide-react'
import type { Product } from '@/lib/types'

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition bg-white'
const LABEL = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'

const MAX_MB = 512

export default function VideoUploadForm() {
  const supabase = createClient()
  const [open,     setOpen]     = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [file,     setFile]     = useState<File | null>(null)
  const [form,     setForm]     = useState({ product_id: '', title: '', description: '' })
  const [status,   setStatus]   = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && products.length === 0) {
      supabase.from('products').select('id, name, category').order('name')
        .then(({ data }) => setProducts((data as Product[]) ?? []))
    }
  }, [open])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    if (!f) return
    if (f.size > MAX_MB * 1024 * 1024) {
      alert(`File ${MAX_MB}MB se choti honi chahiye`)
      e.target.value = ''
      return
    }
    setFile(f)
    if (!form.title) set('title', f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !form.product_id || !form.title) return

    setStatus('uploading')
    setErrorMsg('')

    const fd = new FormData()
    fd.append('video',       file)
    fd.append('product_id',  form.product_id)
    fd.append('title',       form.title)
    fd.append('description', form.description)

    try {
      const res  = await fetch('/api/video-reviews/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload fail hua')
      setStatus('success')
      setForm({ product_id: '', title: '', description: '' })
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message)
    }
  }

  const fileSizeMB = file ? (file.size / 1024 / 1024).toFixed(1) : null

  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden mb-6">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); if (status === 'success') setStatus('idle') }}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
            <Film className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-800">Video Review Upload Karo</p>
            <p className="text-xs text-gray-400">Video automatically YouTube par upload ho jaayegi</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100">
          {status === 'success' ? (
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 text-emerald-600" />
              </div>
              <p className="font-bold text-gray-900 mb-1">Video upload ho gayi!</p>
              <p className="text-sm text-gray-400 mb-4">Kuch minutes mein YouTube aur product page par dikhai degi.</p>
              <button onClick={() => setStatus('idle')} className="text-sm text-indigo-600 hover:underline">
                Aur ek video upload karo
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              {/* Product */}
              <div>
                <label className={LABEL}>Kis Product Ka Review Hai? *</label>
                <select
                  required
                  value={form.product_id}
                  onChange={e => set('product_id', e.target.value)}
                  className={INPUT}
                >
                  <option value="">-- Product chuno --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.category ? ` · ${p.category}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className={LABEL}>Video Title *</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="Jaise: Samsung Galaxy A55 — Honest Review Hindi mein"
                  className={INPUT}
                />
              </div>

              {/* Description */}
              <div>
                <label className={LABEL}>Short Description (optional)</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Video ke baare mein kuch likho..."
                  className={`${INPUT} resize-none`}
                />
              </div>

              {/* File picker */}
              <div>
                <label className={LABEL}>Video File * (max {MAX_MB}MB)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-red-300 hover:bg-red-50 transition-colors"
                >
                  {file ? (
                    <div>
                      <Film className="w-8 h-8 text-red-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{fileSizeMB} MB</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Click karke video select karo</p>
                      <p className="text-xs text-gray-400 mt-1">MP4, MOV, AVI — max {MAX_MB}MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFile}
                  className="hidden"
                />
              </div>

              {/* Upload warning */}
              {status === 'uploading' && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="w-5 h-5 text-amber-500 animate-spin shrink-0" />
                    <p className="text-sm font-semibold text-amber-800">YouTube par upload ho rahi hai…</p>
                  </div>
                  <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full animate-pulse w-full" />
                  </div>
                  <p className="text-xs text-amber-600 mt-2">
                    ⚠️ Yeh page band mat karo — 1 se 3 minute lag sakte hain
                  </p>
                </div>
              )}

              {/* Error */}
              {status === 'error' && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'uploading' || !file || !form.product_id || !form.title}
                className="flex items-center justify-center gap-2 w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60"
              >
                {status === 'uploading'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Upload ho rahi hai…</>
                  : <><Upload className="w-4 h-4" /> YouTube Par Upload Karo</>
                }
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
