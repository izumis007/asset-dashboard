'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AssetsPage() {
  const router = useRouter()

  useEffect(() => {
    // 設定画面の資産管理にリダイレクト
    router.replace('/settings/assets')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse">リダイレクト中...</div>
    </div>
  )
}