'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ownersAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Owner, OwnerCreate, OwnerType } from '@/types'

export default function SettingsOwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([])
  const [ownerTypes, setOwnerTypes] = useState<{value: string, label: string}[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<OwnerCreate>({
    name: '',
    owner_type: 'self'
  })

  useEffect(() => {
    loadOwners()
    loadOwnerTypes()
  }, [])

  const loadOwners = async () => {
    try {
      const data = await ownersAPI.list()
      setOwners(data)
    } catch (error) {
      console.error('Failed to load owners:', error)
    }
  }

  const loadOwnerTypes = async () => {
    try {
      const data = await ownersAPI.getOwnerTypes()
      setOwnerTypes(data.owner_types)
    } catch (error) {
      console.error('Failed to load owner types:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (editingOwner) {
        await ownersAPI.update(editingOwner.id, formData)
      } else {
        await ownersAPI.create(formData)
      }
      
      await loadOwners()
      resetForm()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (owner: Owner) => {
    setEditingOwner(owner)
    setFormData({
      name: owner.name,
      owner_type: owner.owner_type as OwnerType
    })
    setShowForm(true)
  }

  const handleDelete = async (owner: Owner) => {
    if (!confirm(`「${owner.name}」を削除しますか？\n\n注意：この名義人に関連する保有資産がある場合は削除できません。`)) {
      return
    }

    try {
      await ownersAPI.delete(owner.id)
      await loadOwners()
    } catch (error: any) {
      alert(error.response?.data?.detail || '削除に失敗しました')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', owner_type: 'self' })
    setEditingOwner(null)
    setShowForm(false)
  }

  const getOwnerTypeLabel = (type: string) => {
    return ownerTypes.find(t => t.value === type)?.label || type
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ナビゲーション */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="sm" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            設定に戻る
          </Button>
        </Link>
        <div className="text-sm text-muted-foreground">
          設定 / 名義人管理
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">名義人管理</h1>
          </div>
          <p className="text-muted-foreground">
            資産の名義人情報を管理します
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          disabled={showForm}
        >
          名義人を追加
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingOwner ? '名義人編集' : '名義人追加'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">名前</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例: 田中太郎"
                  required
                />
              </div>

              <div>
                <Label htmlFor="owner_type">名義タイプ</Label>
                <select
                  id="owner_type"
                  value={formData.owner_type}
                  onChange={(e) => setFormData({ ...formData, owner_type: e.target.value as OwnerType })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  required
                >
                  {ownerTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? '保存中...' : (editingOwner ? '更新' : '追加')}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  キャンセル
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Owner List */}
      <Card>
        <CardHeader>
          <CardTitle>登録済み名義人</CardTitle>
        </CardHeader>
        <CardContent>
          {owners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              まだ名義人が登録されていません
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">名前</th>
                    <th className="text-left p-2">タイプ</th>
                    <th className="text-left p-2">作成日</th>
                    <th className="text-left p-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {owners.map(owner => (
                    <tr key={owner.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{owner.name}</td>
                      <td className="p-2">{getOwnerTypeLabel(owner.owner_type)}</td>
                      <td className="p-2 text-muted-foreground">
                        {new Date(owner.created_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(owner)}
                          >
                            編集
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(owner)}
                          >
                            削除
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}