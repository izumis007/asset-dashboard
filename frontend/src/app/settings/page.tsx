'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  Layers, 
  Users, 
  Key, 
  Shield, 
  Download, 
  Upload,
  Settings as SettingsIcon,
  ChevronRight
} from 'lucide-react'

interface SettingSection {
  id: string
  title: string
  description: string
  icon: React.ElementType
  href: string
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

const settingSections: SettingSection[] = [
  {
    id: 'assets',
    title: '資産管理',
    description: '投資対象の登録・編集・削除',
    icon: Layers,
    href: '/settings/assets',
    badge: '重要',
    badgeVariant: 'default'
  },
  {
    id: 'owners',
    title: '名義人管理',
    description: '資産の名義人情報を管理',
    icon: Users,
    href: '/settings/owners',
    badge: '新機能',
    badgeVariant: 'secondary'
  },
  {
    id: 'api-keys',
    title: 'APIキー設定',
    description: '価格取得用のAPIキーを設定',
    icon: Key,
    href: '/settings/api-keys'
  },
  {
    id: 'security',
    title: 'セキュリティ',
    description: 'パスワード変更・2FA設定',
    icon: Shield,
    href: '/settings/security'
  },
  {
    id: 'export',
    title: 'データエクスポート',
    description: 'データのバックアップとエクスポート',
    icon: Download,
    href: '/settings/export'
  },
  {
    id: 'import',
    title: 'データインポート',
    description: 'CSVファイルからのデータ取り込み',
    icon: Upload,
    href: '/settings/import'
  }
]

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* ヘッダー */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">設定</h1>
        </div>
        <p className="text-muted-foreground">
          Asset Dashboardの各種設定を管理します
        </p>
      </div>

      {/* 設定項目グリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingSections.map((section) => {
          const Icon = section.icon
          return (
            <Link key={section.id} href={section.href}>
              <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {section.title}
                        </CardTitle>
                        {section.badge && (
                          <Badge variant={section.badgeVariant || 'default'} className="text-xs">
                            {section.badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {section.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* クイック統計（オプション） */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">システム情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">バージョン</p>
              <p className="font-medium">0.2.0</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">データベース</p>
              <p className="font-medium text-green-600">接続中</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">最終更新</p>
              <p className="font-medium">今日</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">価格取得</p>
              <p className="font-medium text-blue-600">有効</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}