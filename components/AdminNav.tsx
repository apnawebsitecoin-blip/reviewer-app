'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, Star, DollarSign,
  Users, BookMarked, Bell, Settings2, Ticket, Film, Zap,
  ArrowDownToLine, CreditCard, ShoppingBag, BarChart3, BookOpen,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  Icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin',              label: 'Overview',      Icon: LayoutDashboard },
  { href: '/admin/reviews',      label: 'Reviews',       Icon: Star            },
  { href: '/admin/products',     label: 'Products',      Icon: Package         },
  { href: '/admin/commissions',  label: 'Commissions',   Icon: DollarSign      },
  { href: '/admin/users',        label: 'Users',         Icon: Users           },
  { href: '/admin/collections',  label: 'Collections',   Icon: BookMarked      },
  { href: '/admin/flash-deals',  label: 'Flash Deals',   Icon: Zap             },
  { href: '/admin/coupons',      label: 'Coupons',       Icon: Ticket          },
  { href: '/admin/videos',       label: 'Videos',        Icon: Film            },
  { href: '/admin/price-alerts',        label: 'Price Alerts',   Icon: Bell            },
  { href: '/admin/community-deals',      label: 'Community Deals', Icon: ShoppingBag     },
  { href: '/admin/analytics',           label: 'Analytics',      Icon: BarChart3       },
  { href: '/admin/withdrawal-requests', label: 'Withdrawals',    Icon: ArrowDownToLine },
  { href: '/admin/payment-settings',    label: 'Payments',       Icon: CreditCard      },
  { href: '/admin/blog',                 label: 'Blog / Guides',  Icon: BookOpen        },
  { href: '/admin/settings',            label: 'Site Settings',  Icon: Settings2       },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-0.5">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active =
          href === '/admin'
            ? pathname === '/admin'
            : pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              active
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-gray-400'}`} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
