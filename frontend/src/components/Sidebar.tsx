'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Layers, PieChart, Bitcoin } from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', label: 'ダッシュボード', icon: Home },
    { href: '/assets', label: '資産', icon: Layers },
    { href: '/holdings', label: '保有資産', icon: PieChart },
    { href: '/btc-trades', label: 'BTC取引', icon: Bitcoin },
  ]

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white dark:bg-gray-900 border-r border-border p-4">
      <h2 className="text-xl font-bold mb-6 text-primary">Asset Dashboard</h2>
      <nav className="flex-1 space-y-2">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${pathname === href
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}