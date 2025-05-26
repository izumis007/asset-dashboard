import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Sidebar from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Asset Dashboard',
  description: 'Self-hosted asset management dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-4">
        <Providers>
          {children}
        </Providers>
        </main>
      </body>
    </html>
  )
}