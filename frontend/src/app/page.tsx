'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/api'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    console.log('✅ NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
    
    if (isAuthenticated()) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse">読み込み中...</div>
    </div>
  )
}