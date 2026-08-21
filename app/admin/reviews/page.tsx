import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/utils'
import ReviewActions from './ReviewActions'
import { AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminReviewsPage() {
  const supabase = await createClient()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, profiles(id, name), products(id, name)')
    .eq('verified', false)
    .order('created_at', { ascending: true })

  const { data: flagged } = await supabase
    .from('reviews')
    .select('*, profiles(id, name), products(id, name)')
    .eq('duplicate_flag', true)
    .eq('verified', false)

  const flaggedIds = new Set((flagged ?? []).map(r => r.id))

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">Pending Reviews ({(reviews ?? []).length})</h1>

      {(reviews ?? []).length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">सभी reviews approve/reject हो गए हैं</div>
      ) : (
        <div className="space-y-4">
          {(reviews ?? []).map(review => (
            <div key={review.id} className={`bg-white rounded-2xl shadow p-5 ${flaggedIds.has(review.id) ? 'border-2 border-orange-400' : ''}`}>
              {flaggedIds.has(review.id) && (
                <div className="flex items-center gap-2 text-orange-600 text-xs mb-3 bg-orange-50 rounded-lg p-2">
                  <AlertTriangle className="w-4 h-4" />
                  Duplicate invoice flag — manually verify this review carefully!
                </div>
              )}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{(review.products as any)?.name ?? 'Product'}</p>
                  <p className="text-sm text-gray-500">By: {(review.profiles as any)?.name ?? 'User'} · {formatDate(review.created_at)}</p>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      review.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                      review.sentiment === 'negative' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{review.sentiment}</span>
                  </div>
                  {review.review_text && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-3">{review.review_text}</p>
                  )}
                  {review.detailed_badge && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-2 inline-block">Detailed Review ⭐</span>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {review.invoice_url && (
                    <a href={review.invoice_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-indigo-500 hover:underline">📄 Invoice देखें</a>
                  )}
                  {review.media_url && (
                    <a href={review.media_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-indigo-500 hover:underline">📷 Media देखें</a>
                  )}
                  <ReviewActions reviewId={review.id} reviewerId={review.reviewer_id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
