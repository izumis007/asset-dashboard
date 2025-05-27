'use client'

import { useEffect } from 'react'
import { redirect } from 'next/navigation'

export default function HomePage() {
  useEffect(() => {
    console.log('✅ NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
  }, [])

  return <div>Home</div>
}