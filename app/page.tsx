import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { TrendingUp, Star, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import PromoBanner from '@/components/PromoBanner'
import FlashDealsSection from '@/components/FlashDealsSection'
import { getSiteSettings } from '@/lib/settings'
import { getIcon } from '@/lib/icons'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [settings, supabase, t, tCommon] = await Promise.all([
    getSiteSettings(),
    createClient(),
    getTranslations('home'),
    getTranslations('common'),
  ])

  // Trending: most clicked
  const { data: trending } = await supabase
    .from('clicks')
    .select('product_id')
    .order('clicked_at', { ascending: false })
    .limit(200)

  const clickCounts: Record<string, number> = {}
  ;(trending ?? []).forEach(c => { clickCounts[c.product_id] = (clickCounts[c.product_id] ?? 0) + 1 })
  const trendingIds = Object.entries(clickCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id)

  let trendingProducts: any[] = []
  if (trendingIds.length > 0) {
    const { data } = await supabase.from('products').select('*').in('id', trendingIds)
    trendingProducts = data ?? []
  } else {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(8)
    trendingProducts = data ?? []
  }

  // Most reviewed
  const { data: reviewCounts } = await supabase
    .from('reviews')
    .select('product_id')
    .eq('verified', true)

  const reviewCountMap: Record<string, number> = {}
  ;(reviewCounts ?? []).forEach(r => { reviewCountMap[r.product_id] = (reviewCountMap[r.product_id] ?? 0) + 1 })
  const mostReviewedIds = Object.entries(reviewCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id)

  let mostReviewed: any[] = []
  if (mostReviewedIds.length > 0) {
    const { data } = await supabase.from('products').select('*').in('id', mostReviewedIds)
    mostReviewed = data ?? []
  }

  const { data: collections } = await supabase
    .from('collections')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(4)

  const brand = settings.brandColor

  return (
    <div>
      {/* ══ 1. PROMO BANNER ══ */}
      <div className="-mx-4 sm:-mx-6 mb-8">
        <PromoBanner banners={settings.banners} />
      </div>

      {/* ══ 2. TOP CATEGORIES (from settings) ══ */}
      <section className="mb-10">
        <SectionHeader title={t('topCategories')} href="/products" brand={brand} viewAllLabel={tCommon('viewAll')} />
        <div className="flex gap-5 sm:gap-6 overflow-x-auto no-scrollbar pb-2">
          {settings.categories.map(cat => {
            const Icon = getIcon(cat.iconName)
            return (
              <Link
                key={cat.label}
                href={`/products?category=${cat.label}`}
                className="flex flex-col items-center gap-2 shrink-0 group"
              >
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-200"
                  style={{ background: cat.bg }}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: cat.color }} />
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-gray-600 whitespace-nowrap text-center">
                  {cat.label}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ══ 3. FLASH DEALS ══ */}
      {settings.featureFlags?.showFlashDeals !== false && (
        <FlashDealsSection title={settings.sectionTitles?.flashDeals ?? '⚡ Flash Deals'} brand={brand} />
      )}

      {/* ══ 4. COLLECTIONS ══ */}
      {settings.featureFlags?.showCollections !== false && collections && collections.length > 0 && (
        <section className="mb-10">
          <SectionHeader title={settings.sectionTitles?.collections ?? 'Featured Collections'} href="/products" brand={brand} viewAllLabel={tCommon('viewAll')} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {collections.map(col => (
              <Link
                key={col.id}
                href={`/products?collection=${col.id}`}
                className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-[0_1px_4px_rgba(0,0,0,0.07)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] transition-shadow duration-200 group"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2.5 transition-opacity"
                  style={{ background: brand + '18' }}
                >
                  <Star className="w-5 h-5" style={{ color: brand }} />
                </div>
                <p className="text-sm font-semibold text-gray-800">{col.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ══ 5. TRENDING PRODUCTS ══ */}
      <ProductSection
        title={settings.sectionTitles?.trending ?? 'Trending Deals'}
        icon={<TrendingUp className="w-4 h-4 text-rose-500" />}
        products={trendingProducts}
        brand={brand}
        viewAllLabel={tCommon('viewAll')}
      />

      {/* ══ 6. MOST REVIEWED ══ */}
      {mostReviewed.length > 0 && (
        <ProductSection
          title={settings.sectionTitles?.mostReviewed ?? 'Most Reviewed'}
          icon={<Star className="w-4 h-4 text-amber-500" />}
          products={mostReviewed}
          brand={brand}
          viewAllLabel={tCommon('viewAll')}
        />
      )}

      {/* ══ 6. HOW IT WORKS (from settings) ══ */}
      <section className="mb-12 py-10 bg-gray-50 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-8 text-center">
            {t('howItWorksTitle', { siteName: settings.siteName })}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {settings.howItWorks.map(step => {
              const Icon = getIcon(step.iconName)
              return (
                <div key={step.step} className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: brand, boxShadow: `0 8px 20px ${brand}35` }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span
                      className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full text-[9px] font-black flex items-center justify-center border-2"
                      style={{ color: brand, borderColor: brand }}
                    >
                      {step.step}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-800 mb-1">{step.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ 7. REVIEWER CTA ══ */}
      <div className="-mx-4 sm:-mx-6 mb-0">
        <div
          className="py-14 px-5 text-center"
          style={{ background: `linear-gradient(120deg, ${brand}ee, ${brand}bb)` }}
        >
          <p className="text-white/70 text-xs font-bold tracking-widest uppercase mb-2">
            {t('earnEyebrow', { siteName: settings.siteName })}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 leading-tight">
            {t('earnHeadline')}
          </h3>
          <p className="text-white/75 text-sm mb-7 max-w-sm mx-auto leading-relaxed">
            {t('earnSubtext')}
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 bg-white font-bold px-8 py-3 rounded-lg text-sm shadow-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
            style={{ color: brand }}
          >
            {t('earnCta')} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ title, href, icon, brand, viewAllLabel }: {
  title: string; href: string; icon?: React.ReactNode; brand: string; viewAllLabel: string
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
        {icon}{title}
      </h2>
      <Link
        href={href}
        className="text-xs sm:text-sm font-semibold flex items-center gap-0.5 transition-opacity hover:opacity-70"
        style={{ color: brand }}
      >
        {viewAllLabel} <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

// ── Product grid section ───────────────────────────────────────────────────────

function ProductSection({ title, icon, products, brand, viewAllLabel }: {
  title: string; icon?: React.ReactNode; products: any[]; brand: string; viewAllLabel: string
}) {
  if (!products.length) return null
  return (
    <section className="mb-10">
      <SectionHeader title={title} href="/products" icon={icon} brand={brand} viewAllLabel={viewAllLabel} />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {products.map(p => <ProductCard key={p.id} product={p} brand={brand} />)}
      </div>
    </section>
  )
}

// ── Product card ───────────────────────────────────────────────────────────────

async function ProductCard({ product: p, brand }: { product: any; brand: string }) {
  const t = await getTranslations('product')
  return (
    <Link
      href={`/products/${p.id}`}
      className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)] transition-shadow duration-200 flex flex-col"
    >
      {/* Image 4:3 */}
      <div className="relative w-full aspect-[4/3] bg-gray-50">
        {p.image_url ? (
          <Image
            src={p.image_url}
            alt={p.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-gray-200">📦</div>
        )}
        {p.platform && (
          <span className="absolute top-2 left-2 bg-white text-[10px] font-bold text-gray-700 px-2 py-0.5 rounded-full shadow-sm border border-gray-100">
            {p.platform}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1 gap-1.5">
        <p className="text-[11px] font-bold text-orange-500">{t('cashbackBadge')}</p>
        {p.category && (
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide leading-none">{p.category}</p>
        )}
        <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug flex-1">{p.name}</p>
        {p.price ? (
          <p className="text-sm font-bold text-gray-900">{formatCurrency(p.price)}</p>
        ) : (
          <p className="text-xs text-gray-400">{t('priceUnavailable')}</p>
        )}
        <div
          className="w-full mt-1 text-white text-xs font-bold py-2.5 rounded-lg text-center transition-opacity hover:opacity-90"
          style={{ backgroundColor: brand }}
        >
          {t('viewDeal')}
        </div>
      </div>
    </Link>
  )
}
