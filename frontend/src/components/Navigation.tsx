'use client'

import { useState } from 'react'
import { X, Menu, Home, BarChart3, DollarSign, Bitcoin, Settings } from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: React.ElementType
}

const navigation: NavigationItem[] = [
  { name: 'ダッシュボード', href: '/dashboard', icon: Home },
  { name: '資産管理', href: '/assets', icon: BarChart3 },
  { name: '保有資産', href: '/holdings', icon: DollarSign },
  { name: 'BTC取引', href: '/btc-trades', icon: Bitcoin },
  { name: '設定', href: '/settings', icon: Settings },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Navigation() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentPath, setCurrentPath] = useState('/dashboard')

  const handleNavigation = (href: string) => {
    setCurrentPath(href)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button
                  type="button"
                  className="-m-2.5 p-2.5"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-2">
                <div className="flex h-16 shrink-0 items-center">
                  <span className="text-white font-bold text-xl">Asset Dashboard</span>
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul className="-mx-2 space-y-1">
                        {navigation.map((item) => (
                          <li key={item.name}>
                            <button
                              onClick={() => handleNavigation(item.href)}
                              className={classNames(
                                currentPath === item.href
                                  ? 'bg-gray-800 text-white'
                                  : 'text-gray-400 hover:text-white hover:bg-gray-800',
                                'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full text-left'
                              )}
                            >
                              <item.icon className="h-6 w-6 shrink-0" />
                              {item.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6">
          <div className="flex h-16 shrink-0 items-center">
            <span className="text-white font-bold text-xl">Asset Dashboard</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <button
                        onClick={() => handleNavigation(item.href)}
                        className={classNames(
                          currentPath === item.href
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full text-left'
                        )}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                {navigation.find(item => item.href === currentPath)?.name || 'ダッシュボード'}
              </h1>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="relative">
                <button className="flex items-center text-sm text-gray-700 hover:text-gray-900">
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-sm font-medium">U</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Page-specific content goes here */}
          </div>
        </main>
      </div>
    </div>
  )
}