'use client'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { formatDate, getSentimentBg } from '@/lib/utils'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const card = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
}

const badge = {
  hidden: { scale: 0, opacity: 0 },
  show: { scale: 1, opacity: 1, transition: { type: 'spring' as const, stiffness: 480, damping: 24 } },
}

export default function AnimatedReviewList({ reviews, brand }: { reviews: any[]; brand: string }) {
  const t = useTranslations('product')

  if (!reviews.length) {
    return (
      <p className="text-gray-400 text-sm text-center py-10">{t('noReviews')}</p>
    )
  }

  return (
    <motion.div className="space-y-4" variants={container} initial="hidden" animate="show">
      {reviews.map(review => {
        const name: string = (review.profiles as any)?.name ?? t('anonymous')
        const trustScore: number = (review.profiles as any)?.trust_score ?? 0

        return (
          <motion.div
            key={review.id}
            variants={card}
            className="border border-gray-100 rounded-2xl p-4 sm:p-5 bg-white shadow-[0_1px_6px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.09)] transition-shadow duration-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Brand-gradient avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0 shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${brand}dd, ${brand}88)` }}
                >
                  {name.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-gray-900">{name}</span>

                    {/* Verified Purchase — spring scale-in */}
                    <motion.span
                      variants={badge}
                      className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full whitespace-nowrap"
                    >
                      <CheckCircle className="w-2.5 h-2.5" />
                      {t('verifiedPurchase')}
                    </motion.span>

                    {review.detailed_badge && (
                      <motion.span
                        variants={badge}
                        className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap"
                      >
                        {t('detailedBadge')}
                      </motion.span>
                    )}

                    {trustScore >= 5 && (
                      <motion.span
                        variants={badge}
                        className="text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full whitespace-nowrap"
                      >
                        ★ {t('trustedBadge')}
                      </motion.span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">{formatDate(review.created_at)}</span>
                </div>
              </div>

              {/* Sentiment pill — spring scale-in */}
              <motion.span
                variants={badge}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${getSentimentBg(review.sentiment)}`}
              >
                {review.sentiment === 'positive'
                  ? t('positive')
                  : review.sentiment === 'negative'
                  ? t('negative')
                  : t('neutral')}
              </motion.span>
            </div>

            {review.review_text && (
              <p className="text-sm text-gray-600 leading-relaxed mt-3 pl-[52px]">
                {review.review_text}
              </p>
            )}

            {review.later_returned && (
              <p className="text-xs text-orange-500 mt-2 pl-[52px] font-medium">
                ⚠ {t('returnedWarning')}
              </p>
            )}

            {review.media_url && (
              <a
                href={review.media_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold mt-2 pl-[52px] block hover:underline"
                style={{ color: brand }}
              >
                {t('viewProof')} →
              </a>
            )}
          </motion.div>
        )
      })}
    </motion.div>
  )
}
