import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import ReviewActions from './ReviewActions'
import { AlertTriangle, Star, FileText, ImageIcon, Inbox } from 'lucide-react'

export const dynamic = 'force-dynamic'

function SentimentBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    positive: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    negative: 'bg-red-50 text-red-700 border border-red-100',
    neutral:  'bg-amber-50 text-amber-700 border border-amber-100',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[s] ?? 'bg-gray-50 text-gray-600 border border-gray-100'}`}>
      {s}
    </span>
  )
}

export default async function AdminReviewsPage() {
  const supabase = await createClient()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, profiles(id, name), products(id, name)')
    .eq('verified', false)
    .order('created_at', { ascending: true })

  const { data: flagged } = await supabase
    .from('reviews')
    .select('id')
    .eq('duplicate_flag', true)
    .eq('verified', false)

  const flaggedIds = new Set((flagged ?? []).map(r => r.id))
  const list = reviews ?? []

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Pending Reviews</h1>
          <p className="text-sm text-gray-400 mt-0.5">Approve or reject submitted reviews</p>
        </div>
        <span className="bg-amber-50 text-amber-700 border border-amber-100 text-sm font-bold px-3 py-1 rounded-full">
          {list.length} pending
        </span>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-12 text-center">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Star className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500">All caught up!</p>
          <p className="text-xs text-gray-400 mt-1">Koi pending review nahi hai</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(review => {
            const isDuplicate = flaggedIds.has(review.id)
            return (
              <div
                key={review.id}
                className={`bg-white rounded-xl border shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5 transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.09)] ${
                  isDuplicate ? 'border-orange-300' : 'border-gray-100'
                }`}
              >
                {/* Duplicate warning */}
                {isDuplicate && (
                  <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-700 text-xs font-semibold rounded-lg px-3 py-2 mb-4">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Duplicate invoice detected — verify this review manually before approving
                  </div>
                )}

                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    {/* Product + meta */}
                    <p className="font-bold text-gray-900 text-sm mb-1">
                      {(review.products as any)?.name ?? 'Unknown Product'}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap text-xs text-gray-400 mb-3">
                      <span className="font-medium text-gray-600">
                        {(review.profiles as any)?.name ?? 'Unknown User'}
                      </span>
                      <span>·</span>
                      <span>{formatDate(review.created_at)}</span>
                      <SentimentBadge s={review.sentiment} />
                      {review.detailed_badge && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          ⭐ Detailed Review
                        </span>
                      )}
                    </div>

                    {/* Review text */}
                    {review.review_text && (
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 line-clamp-3 leading-relaxed">
                        "{review.review_text}"
                      </p>
                    )}
                  </div>

                  {/* Actions column */}
                  <div className="flex flex-col gap-2.5 items-end shrink-0">
                    {review.invoice_url && (
                      <a href={review.invoice_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                        <FileText className="w-3.5 h-3.5" /> Invoice
                      </a>
                    )}
                    {review.media_url && (
                      <a href={review.media_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                        <ImageIcon className="w-3.5 h-3.5" /> Media
                      </a>
                    )}
                    <ReviewActions reviewId={review.id} reviewerId={review.reviewer_id} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
