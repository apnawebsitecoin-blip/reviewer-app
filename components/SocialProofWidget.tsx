import { getTranslations } from 'next-intl/server'
import { Flame, Bookmark, ShieldCheck } from 'lucide-react'

interface Props {
  viewCount: number
  wishlistCount: number
  reviewCount: number
}

export default async function SocialProofWidget({ viewCount, wishlistCount, reviewCount }: Props) {
  if (viewCount === 0 && wishlistCount === 0 && reviewCount === 0) return null
  const t = await getTranslations('socialProof')

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {viewCount > 0 && (
        <span className="flex items-center gap-1.5 text-xs bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full font-medium border border-orange-100">
          <Flame className="w-3 h-3" />
          {t('viewedToday', { count: viewCount })}
        </span>
      )}
      {wishlistCount > 0 && (
        <span className="flex items-center gap-1.5 text-xs bg-pink-50 text-pink-600 px-3 py-1.5 rounded-full font-medium border border-pink-100">
          <Bookmark className="w-3 h-3" />
          {t('savedThis', { count: wishlistCount })}
        </span>
      )}
      {reviewCount > 0 && (
        <span className="flex items-center gap-1.5 text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-full font-medium border border-green-100">
          <ShieldCheck className="w-3 h-3" />
          {t('verifiedBuyers', { count: reviewCount })}
        </span>
      )}
    </div>
  )
}
