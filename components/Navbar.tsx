'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell, ShoppingBag, Menu, X, Globe } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import type { User } from '@supabase/supabase-js'
import ThemeToggle from './ThemeToggle'

export default function Navbar({ siteName, brandColor }: { siteName?: string; brandColor?: string }) {
  const t = useTranslations('nav')
  const locale = useLocale()
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
        setIsAdmin(profile?.is_admin ?? false)
        const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false)
        setUnreadCount(count ?? 0)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const toggleLang = () => {
    const next = locale === 'hi' ? 'en' : 'hi'
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`
    router.refresh()
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg" style={{ color: brandColor ?? '#4F46E5' }}>
          <ShoppingBag className="w-5 h-5" />
          <span className="hidden sm:inline">{siteName}</span>
          <span className="sm:hidden">{(siteName ?? '').slice(0, 2).toUpperCase()}</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-indigo-600">{t('home')}</Link>
          <Link href="/products" className="hover:text-indigo-600">{t('products')}</Link>
          <Link href="/leaderboard" className="hover:text-indigo-600">{t('leaderboard')}</Link>
          <Link href="/compare" className="hover:text-indigo-600">{t('compare')}</Link>
          <Link href="/blog" className="hover:text-indigo-600">Guides</Link>
          {user && <Link href="/dashboard" className="hover:text-indigo-600">{t('dashboard')}</Link>}
          {isAdmin && <Link href="/admin" className="hover:text-indigo-600 text-purple-600">{t('admin')}</Link>}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={toggleLang}
            className="text-xs border rounded px-2 py-1 text-gray-500 hover:text-indigo-600 flex items-center gap-1"
            title={locale === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
          >
            <Globe className="w-3 h-3" />
            {locale === 'hi' ? 'EN' : 'हिं'}
          </button>
          {user ? (
            <>
              <Link href="/dashboard/notifications" className="relative">
                <Bell className="w-5 h-5 text-gray-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{unreadCount}</span>
                )}
              </Link>
              <button onClick={logout} className="hidden md:block text-sm text-gray-500 hover:text-red-500">{t('logout')}</button>
            </>
          ) : (
            <Link href="/auth/login" className="text-white text-sm px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90" style={{ backgroundColor: brandColor ?? '#4F46E5' }}>{t('login')}</Link>
          )}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t px-4 py-3 space-y-2 text-sm">
          <Link href="/" className="block py-1" onClick={() => setMenuOpen(false)}>{t('home')}</Link>
          <Link href="/products" className="block py-1" onClick={() => setMenuOpen(false)}>{t('products')}</Link>
          <Link href="/leaderboard" className="block py-1" onClick={() => setMenuOpen(false)}>{t('leaderboard')}</Link>
          <Link href="/compare" className="block py-1" onClick={() => setMenuOpen(false)}>{t('compare')}</Link>
          <Link href="/blog" className="block py-1" onClick={() => setMenuOpen(false)}>Guides</Link>
          {user && <Link href="/dashboard" className="block py-1" onClick={() => setMenuOpen(false)}>{t('dashboard')}</Link>}
          {isAdmin && <Link href="/admin" className="block py-1 text-purple-600" onClick={() => setMenuOpen(false)}>{t('admin')}</Link>}
          {user && <button onClick={() => { setMenuOpen(false); logout() }} className="block py-1 text-red-500">{t('logout')}</button>}
        </div>
      )}
    </nav>
  )
}
