import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import Navbar from '@/components/Navbar'
import { getSiteSettings } from '@/lib/settings'
import Link from 'next/link'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import OneSignalInit from '@/components/OneSignalInit'
import BottomNav from '@/components/BottomNav'
import { ThemeProvider } from '@/components/ThemeProvider'

export const dynamic = 'force-dynamic'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const [settings, t] = await Promise.all([getSiteSettings(), getTranslations('layout')])
  return {
    title: t('metaTitle', { siteName: settings.siteName }),
    description: t('metaDescription'),
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, locale, messages, tLayout] = await Promise.all([
    getSiteSettings(),
    getLocale(),
    getMessages(),
    getTranslations('layout'),
  ])
  const brand = settings.brandColor

  return (
    <html lang={locale}>
      <head>
        {/* Inject dynamic brand color as CSS variable */}
        <style>{`
          :root {
            --brand: ${brand};
          }
          .bg-brand { background-color: var(--brand) !important; }
          .text-brand { color: var(--brand) !important; }
          .border-brand { border-color: var(--brand) !important; }
          .hover-bg-brand:hover { background-color: var(--brand) !important; }
          .ring-brand:focus { --tw-ring-color: var(--brand); }
        `}</style>
      </head>
      <body className={`${jakarta.variable} font-sans bg-white min-h-screen antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
        <OneSignalInit />
        <ThemeProvider>
        <Providers>
          <Navbar siteName={settings.siteName} brandColor={brand} />

          {/* Announcement banner */}
          {settings.announcementBanner?.enabled && (
            <a
              href={settings.announcementBanner.href || '#'}
              className="block text-center text-sm font-semibold py-2 px-4 transition-opacity hover:opacity-90"
              style={{ background: settings.announcementBanner.bgColor, color: settings.announcementBanner.textColor }}
            >
              {settings.announcementBanner.text}
            </a>
          )}

          <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 md:pb-0">
            {children}
          </main>
          <BottomNav />

          {/* Dark footer — content from settings */}
          <footer className="bg-gray-900 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div>
                  <p className="text-white font-extrabold text-xl mb-2">{settings.siteName}</p>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                    {settings.footerDescription}
                  </p>
                </div>
                <div>
                  <p className="text-gray-300 font-semibold text-sm mb-4">{tLayout('footerCompany')}</p>
                  <div className="space-y-2.5">
                    {settings.footerCompanyLinks.map(l => (
                      <Link key={l.href} href={l.href} className="block text-gray-500 hover:text-white text-sm transition-colors">
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-gray-300 font-semibold text-sm mb-4">{tLayout('footerExplore')}</p>
                  <div className="space-y-2.5">
                    {settings.footerExploreLinks.map(l => (
                      <Link key={l.href} href={l.href} className="block text-gray-500 hover:text-white text-sm transition-colors">
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-800 mt-8 pt-6">
                <p className="text-gray-600 text-xs text-center">
                  {tLayout('copyright', { year: new Date().getFullYear(), siteName: settings.siteName })}
                </p>
              </div>
            </div>
          </footer>
        </Providers>
        </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
