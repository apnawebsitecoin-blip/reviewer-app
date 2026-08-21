'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { computeFileHash, isDetailedReview } from '@/lib/utils'
import { Upload, X } from 'lucide-react'
import type { Sentiment } from '@/lib/types'

interface Props {
  productId: string
  onSuccess: () => void
  onClose: () => void
}

export default function ReviewForm({ productId, onSuccess, onClose }: Props) {
  const supabase = createClient()
  const [sentiment, setSentiment] = useState<Sentiment>('positive')
  const [reviewText, setReviewText] = useState('')
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sentimentOptions: { value: Sentiment; label: string; emoji: string; color: string }[] = [
    { value: 'positive', label: 'सकारात्मक', emoji: '👍', color: 'border-green-500 bg-green-50 text-green-700' },
    { value: 'neutral', label: 'तटस्थ', emoji: '😐', color: 'border-yellow-400 bg-yellow-50 text-yellow-700' },
    { value: 'negative', label: 'नकारात्मक', emoji: '👎', color: 'border-red-400 bg-red-50 text-red-700' },
  ]

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split('.').pop()
    const { data: { user } } = await supabase.auth.getUser()
    const path = `${folder}/${user!.id}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('review-media').upload(path, file)
    if (error) return null
    const { data } = supabase.storage.from('review-media').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) { setError('कृपया honest review checkbox चेक करें'); return }
    if (!invoiceFile) { setError('कृपया invoice/screenshot ज़रूर अपलोड करें'); return }

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('कृपया लॉगिन करें'); setLoading(false); return }

    // Invoice hash check
    const hash = await computeFileHash(invoiceFile)
    const { data: existing } = await supabase.from('reviews').select('id').eq('invoice_hash', hash).limit(1)
    const duplicate = (existing ?? []).length > 0

    // Upload files
    const invoiceUrl = await uploadFile(invoiceFile, 'invoices')
    const mediaUrl = mediaFile ? await uploadFile(mediaFile, 'media') : null

    const detailed = isDetailedReview(reviewText)

    const { error: insertError } = await supabase.from('reviews').insert({
      product_id: productId,
      reviewer_id: user.id,
      sentiment,
      review_text: reviewText,
      invoice_url: invoiceUrl,
      media_url: mediaUrl,
      invoice_hash: hash,
      duplicate_flag: duplicate,
      verified: false,
      detailed_badge: detailed,
    })

    if (insertError) {
      if (insertError.code === '23505') {
        setError('आपने इस प्रोडक्ट पर पहले ही रिव्यू दिया है।')
      } else {
        setError(insertError.message)
      }
      setLoading(false)
      return
    }

    onSuccess()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-gray-800">रिव्यू जोड़ें</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Sentiment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">आपकी राय</label>
            <div className="grid grid-cols-3 gap-2">
              {sentimentOptions.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setSentiment(opt.value)}
                  className={`border-2 rounded-xl p-3 text-center transition ${sentiment === opt.value ? opt.color + ' border-2' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="text-2xl mb-1">{opt.emoji}</div>
                  <div className="text-xs font-medium">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Review text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              रिव्यू लिखें
              <span className="text-xs text-gray-400 ml-2">(50+ शब्द → Detailed Badge + extra trust score)</span>
            </label>
            <textarea value={reviewText} onChange={e => setReviewText(e.target.value)}
              rows={4} placeholder="अपना अनुभव share करें..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            <p className="text-xs text-gray-400 mt-1">{reviewText.trim().split(/\s+/).filter(Boolean).length} शब्द</p>
          </div>

          {/* Invoice upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice / Screenshot <span className="text-red-500">*</span></label>
            <label className="flex items-center gap-2 border-2 border-dashed rounded-lg p-3 cursor-pointer hover:border-indigo-400 transition">
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">{invoiceFile ? invoiceFile.name : 'अपलोड करें (image/pdf)'}</span>
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => setInvoiceFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          {/* Media upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo / Video Proof (वैकल्पिक)</label>
            <label className="flex items-center gap-2 border-2 border-dashed rounded-lg p-3 cursor-pointer hover:border-indigo-400 transition">
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">{mediaFile ? mediaFile.name : 'फोटो या वीडियो अपलोड करें'}</span>
              <input type="file" accept="image/*,video/*" className="hidden" onChange={e => setMediaFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          {/* Honest checkbox */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4" />
            <span className="text-xs text-gray-600">मैंने यह प्रोडक्ट खुद खरीदा है और यह मेरा ईमानदार अनुभव है।</span>
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-60 font-medium">
            {loading ? 'सबमिट हो रहा है...' : 'रिव्यू सबमिट करें'}
          </button>
        </form>
      </div>
    </div>
  )
}
