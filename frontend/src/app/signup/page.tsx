'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI, useAuthStore } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const setToken = useAuthStore((state) => state.setToken)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await authAPI.register({ username, email, password })
      setToken(response.access_token)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || '登録に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">アカウント作成</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">ユーザー名</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">メールアドレス</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">パスワード</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                required
              />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '登録中...' : '登録'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}