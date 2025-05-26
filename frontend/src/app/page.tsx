'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/api'

export default function HomePage() {
  const router = useRouter()
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    if (token) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [token, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse">Loading...</div>
    </div>
  )
}