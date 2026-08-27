'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, Package, Heart, LayoutDashboard, UserCircle } from 'lucide-react'

const NAV = [
  { href: '/',                    label: 'Home',      Icon: Home          },
  { href: '/products',            label: 'Products',  Icon: Package       },
  { href: '/dashboard/wishlist',  label: 'Wishlist',  Icon: Heart         },
  { href: '/dashboard',           label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/dashboard/profile',   label: 'Profile',   Icon: UserCircle    },
]

export default function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-16 px-1">
        {NAV.map(({ href, label, Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative"
            >
              {active && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-600 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <motion.div
                animate={{ scale: active ? 1.15 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${active ? 'text-indigo-600' : 'text-gray-400'}`}
                  strokeWidth={active ? 2.5 : 1.8}
                  fill={active && href === '/dashboard/wishlist' ? 'currentColor' : 'none'}
                />
              </motion.div>
              <span className={`text-[10px] font-semibold transition-colors ${active ? 'text-indigo-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
