'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell, ShoppingBag, Menu, X, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const { t, i18n } = useTranslation('common')
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [lang, setLang] = useState<'hi' | 'en'>('hi')

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
    const next = lang === 'hi' ? 'en' : 'hi'
    i18n.changeLanguage(next)
    setLang(next)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 font-bold text-indigo-600 text-lg">
          <ShoppingBag className="w-5 h-5" />
          <span className="hidden sm:inline">{t('app_name')}</span>
          <span className="sm:hidden">RA</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-indigo-600">{t('nav.home')}</Link>
          <Link href="/products" className="hover:text-indigo-600">{t('nav.products')}</Link>
          <Link href="/leaderboard" className="hover:text-indigo-600">{t('nav.leaderboard')}</Link>
          <Link href="/compare" className="hover:text-indigo-600">{lang === 'hi' ? 'Compare' : 'Compare'}</Link>
          {user && <Link href="/dashboard" className="hover:text-indigo-600">{t('nav.dashboard')}</Link>}
          {isAdmin && <Link href="/admin" className="hover:text-indigo-600 text-purple-600">{t('nav.admin')}</Link>}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleLang} className="text-xs border rounded px-2 py-1 text-gray-500 hover:text-indigo-600 flex items-center gap-1">
            <Globe className="w-3 h-3" />{lang === 'hi' ? 'EN' : 'HI'}
          </button>
          {user ? (
            <>
              <Link href="/dashboard/notifications" className="relative">
                <Bell className="w-5 h-5 text-gray-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{unreadCount}</span>
                )}
              </Link>
              <button onClick={logout} className="hidden md:block text-sm text-gray-500 hover:text-red-500">{t('nav.logout')}</button>
            </>
          ) : (
            <Link href="/auth/login" className="bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-indigo-700">{t('nav.login')}</Link>
          )}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t px-4 py-3 space-y-2 text-sm">
          <Link href="/" className="block py-1" onClick={() => setMenuOpen(false)}>{t('nav.home')}</Link>
          <Link href="/products" className="block py-1" onClick={() => setMenuOpen(false)}>{t('nav.products')}</Link>
          <Link href="/leaderboard" className="block py-1" onClick={() => setMenuOpen(false)}>{t('nav.leaderboard')}</Link>
          <Link href="/compare" className="block py-1" onClick={() => setMenuOpen(false)}>Compare</Link>
          {user && <Link href="/dashboard" className="block py-1" onClick={() => setMenuOpen(false)}>{t('nav.dashboard')}</Link>}
          {isAdmin && <Link href="/admin" className="block py-1 text-purple-600" onClick={() => setMenuOpen(false)}>{t('nav.admin')}</Link>}
          {user && <button onClick={() => { setMenuOpen(false); logout() }} className="block py-1 text-red-500">{t('nav.logout')}</button>}
        </div>
      )}
    </nav>
  )
}
