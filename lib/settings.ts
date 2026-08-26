// ── Types ─────────────────────────────────────────────────────────────────────

export interface BannerSetting {
  badge: string; title: string; subtitle: string
  cta: string; href: string; bgFrom: string; bgTo: string; emoji: string
}

export interface CategorySetting {
  label: string; iconName: string; bg: string; color: string
}

export interface HowItWorksStep {
  step: string; title: string; desc: string; iconName: string
}

export interface FooterLink { label: string; href: string }

export interface AnnouncementBanner {
  enabled:   boolean
  text:      string
  href:      string
  bgColor:   string
  textColor: string
}

export interface PayoutConfig {
  enabled: boolean
  provider: 'manual' | 'razorpay' | 'cashfree'
  razorpayKeyId: string
  cashfreeClientId: string
}

export interface FeatureFlags {
  showFlashDeals:    boolean
  showCollections:   boolean
  showPriceHistory:  boolean
  showCoupons:       boolean
  showVideoReviews:  boolean
}

export interface SectionTitles {
  flashDeals:   string
  collections:  string
  trending:     string
  mostReviewed: string
}

export interface FaqItem { question: string; answer: string }

export interface SiteSettings {
  siteName:            string
  brandColor:          string
  banners:             BannerSetting[]
  categories:          CategorySetting[]
  howItWorks:          HowItWorksStep[]
  footerDescription:   string
  footerCompanyLinks:  FooterLink[]
  footerExploreLinks:  FooterLink[]
  // ── new ──
  announcementBanner:  AnnouncementBanner
  featureFlags:        FeatureFlags
  sectionTitles:       SectionTitles
  faqItems:            FaqItem[]
  termsContent:        string
  privacyContent:      string
  payoutConfig:        PayoutConfig
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName:   'ReviewApp',
  brandColor: '#4F46E5',

  banners: [
    { badge: '🎁 Up to 40% Cashback', title: 'Top Electronics Deals',
      subtitle: 'Asli kharidaroon ke sache reviews pe trusted picks — Mobiles, Laptops, Gadgets',
      cta: 'Deals Dekho', href: '/products', bgFrom: '#1e1b4b', bgTo: '#4f46e5', emoji: '📱' },
    { badge: '✨ Extra ₹200 Cashback', title: 'Fashion & Style Sale',
      subtitle: 'Latest trends reviewed by real buyers — Kurtas, Jeans, Sneakers aur bahut kuch',
      cta: 'Shop Karo', href: '/products', bgFrom: '#881337', bgTo: '#db2777', emoji: '👗' },
    { badge: '🏡 Best Price Guarantee', title: 'Home & Kitchen Picks',
      subtitle: 'Ghar ke liye verified choices — Cookware, Appliances, Decor',
      cta: 'Explore Karo', href: '/products', bgFrom: '#064e3b', bgTo: '#059669', emoji: '🏠' },
  ],

  categories: [
    { label: 'Electronics', iconName: 'Smartphone',      bg: '#EFF6FF', color: '#2563EB' },
    { label: 'Fashion',     iconName: 'Shirt',           bg: '#FDF2F8', color: '#DB2777' },
    { label: 'Home',        iconName: 'Home',            bg: '#FFFBEB', color: '#D97706' },
    { label: 'Beauty',      iconName: 'Sparkles',        bg: '#F5F3FF', color: '#7C3AED' },
    { label: 'Fitness',     iconName: 'Dumbbell',        bg: '#F0FDF4', color: '#16A34A' },
    { label: 'Books',       iconName: 'BookOpen',        bg: '#FFF7ED', color: '#EA580C' },
    { label: 'Gaming',      iconName: 'Gamepad2',        bg: '#FFF1F2', color: '#E11D48' },
    { label: 'Kitchen',     iconName: 'UtensilsCrossed', bg: '#F0FDFA', color: '#0D9488' },
    { label: 'Kids',        iconName: 'Baby',            bg: '#FEFCE8', color: '#CA8A04' },
    { label: 'Bags',        iconName: 'ShoppingBag',     bg: '#EEF2FF', color: '#4F46E5' },
  ],

  howItWorks: [
    { step: '01', iconName: 'Search',       title: 'Browse Products',    desc: 'Discover verified deals across top platforms' },
    { step: '02', iconName: 'ShoppingCart', title: 'Click & Buy',        desc: 'Purchase through our affiliate links' },
    { step: '03', iconName: 'PenLine',      title: 'Submit Your Review', desc: 'Share your honest, verified experience' },
    { step: '04', iconName: 'Wallet',       title: 'Earn Cashback',      desc: 'Commission credited to your wallet instantly' },
  ],

  footerDescription:  'Asli kharidaroon ke sache reviews. Verified purchases, honest opinions.',
  footerCompanyLinks: [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy',   href: '/privacy' },
    { label: 'FAQ',              href: '/faq' },
  ],
  footerExploreLinks: [
    { label: 'All Products',      href: '/products' },
    { label: 'Become a Reviewer', href: '/auth/signup' },
    { label: 'Leaderboard',       href: '/leaderboard' },
  ],

  announcementBanner: {
    enabled:   false,
    text:      '🎉 Welcome! Pehle order par free delivery + ₹50 cashback',
    href:      '/products',
    bgColor:   '#4F46E5',
    textColor: '#ffffff',
  },

  featureFlags: {
    showFlashDeals:   true,
    showCollections:  true,
    showPriceHistory: true,
    showCoupons:      true,
    showVideoReviews: true,
  },

  sectionTitles: {
    flashDeals:   '⚡ Flash Deals',
    collections:  'Featured Collections',
    trending:     'Trending Deals',
    mostReviewed: 'Most Reviewed',
  },

  faqItems: [
    { question: 'Cashback kab milta hai?',        answer: 'Purchase verify hone ke 15-30 din baad wallet mein credit hota hai.' },
    { question: 'Minimum withdrawal kitna hai?',  answer: '₹100 minimum bank account ya UPI mein withdraw kar sakte ho.' },
    { question: 'Review kaise verify hota hai?',  answer: 'Invoice ya purchase proof upload karne ke baad admin 24-48 ghante mein verify karta hai.' },
    { question: 'Kya main ek product ka sirf ek hi review de sakta hoon?', answer: 'Haan, har product par sirf ek verified review allowed hai.' },
  ],

  termsContent:   '',
  privacyContent: '',

  payoutConfig: {
    enabled:          false,
    provider:         'manual',
    razorpayKeyId:    '',
    cashfreeClientId: '',
  },
}

// ── Fetch (server-side) ───────────────────────────────────────────────────────

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('site_settings').select('settings').eq('id', 1).single()

    if (!error && data?.settings) {
      // Deep-merge: scalars + new nested objects fill in missing keys from defaults
      const s = data.settings as Partial<SiteSettings>
      return {
        ...DEFAULT_SETTINGS,
        ...s,
        featureFlags:       { ...DEFAULT_SETTINGS.featureFlags,       ...(s.featureFlags       ?? {}) },
        sectionTitles:      { ...DEFAULT_SETTINGS.sectionTitles,      ...(s.sectionTitles      ?? {}) },
        announcementBanner: { ...DEFAULT_SETTINGS.announcementBanner, ...(s.announcementBanner ?? {}) },
        payoutConfig:       { ...DEFAULT_SETTINGS.payoutConfig,       ...(s.payoutConfig       ?? {}) },
      }
    }
  } catch { /* table doesn't exist yet — fall through */ }
  return DEFAULT_SETTINGS
}
