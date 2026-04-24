'use client'

import Link from 'next/link'
import { LayoutDashboard, ShoppingBag, MessageCircle, User } from 'lucide-react'
import { useSafePathname } from '@/lib/client/useSafePathname'

const NAV = [
  { href: '/dashboard', label: 'Главная', icon: LayoutDashboard },
  { href: '/dashboard/orders', label: 'Заказы', icon: ShoppingBag },
  { href: '/dashboard/chat', label: 'Поддержка', icon: MessageCircle },
  { href: '/dashboard/profile', label: 'Профиль', icon: User },
]

export function DashboardNav() {
  const pathname = useSafePathname()

  return (
    <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
      {NAV.map((item) => {
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(item.href + '/')
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-[#10a37f]/15 text-[#10a37f] border-l-2 border-[#10a37f]'
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-l-2 border-transparent'
            }`}
          >
            <Icon
              size={16}
              className={isActive ? 'text-[#10a37f]' : 'text-gray-400'}
            />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function DashboardMobileNav() {
  const pathname = useSafePathname()

  return (
    <nav className="flex gap-4">
      {NAV.map((item) => {
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(item.href + '/')
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive ? 'text-[#10a37f]' : 'text-gray-500 hover:text-gray-900'}
            aria-label={item.label}
          >
            <Icon size={20} />
          </Link>
        )
      })}
    </nav>
  )
}
