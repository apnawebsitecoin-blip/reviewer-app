import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Package, Star, DollarSign, Users, BarChart3, BookMarked, Bell } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')

  const navItems = [
    { href: '/admin', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/admin/reviews', label: 'Reviews', icon: <Star className="w-4 h-4" /> },
    { href: '/admin/products', label: 'Products', icon: <Package className="w-4 h-4" /> },
    { href: '/admin/commissions', label: 'Commissions', icon: <DollarSign className="w-4 h-4" /> },
    { href: '/admin/users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { href: '/admin/collections', label: 'Collections', icon: <BookMarked className="w-4 h-4" /> },
    { href: '/admin/price-alerts', label: 'Price Alerts', icon: <Bell className="w-4 h-4" /> },
  ]

  return (
    <div className="flex gap-6 min-h-[70vh]">
      <aside className="w-48 flex-shrink-0">
        <div className="bg-white rounded-2xl shadow p-4 sticky top-20">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Admin Panel</p>
          <nav className="space-y-1">
            {navItems.map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition">
                {item.icon}{item.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
