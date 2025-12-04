'use client'

import { useState, useEffect } from 'react'
import { Save, Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { useCategories } from '@/lib/hooks/useCategories'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Category } from '@/types'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [notificationTime, setNotificationTime] = useState('10:00')
  const [notificationEnabled, setNotificationEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  
  const { categories, addCategory, updateCategory, deleteCategory, refetch } = useCategories()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
        setNotificationTime(data.notification_time?.slice(0, 5) || '10:00')
        setNotificationEnabled(data.notification_enabled)
      }
    }

    fetchProfile()
  }, [supabase])

  const handleSaveNotification = async () => {
    if (!profile) return

    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        notification_time: notificationTime + ':00',
        notification_enabled: notificationEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (error) {
      toast({
        title: 'エラー',
        description: '設定の保存に失敗しました。',
        variant: 'destructive',
      })
    } else {
      toast({
        title: '保存完了',
        description: '通知設定を保存しました。',
      })
    }
    setSaving(false)
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    const result = await addCategory(newCategoryName.trim())
    if (result) {
      setNewCategoryName('')
      toast({
        title: '追加完了',
        description: 'カテゴリを追加しました。',
      })
    }
  }

  const handleStartEdit = (category: Category) => {
    setEditingCategory(category.id)
    setEditingName(category.name)
  }

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return

    const result = await updateCategory(id, editingName.trim())
    if (result) {
      setEditingCategory(null)
      setEditingName('')
      toast({
        title: '更新完了',
        description: 'カテゴリを更新しました。',
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingCategory(null)
    setEditingName('')
  }

  const handleDeleteCategory = async (id: string) => {
    const result = await deleteCategory(id)
    if (result) {
      toast({
        title: '削除完了',
        description: 'カテゴリを削除しました。',
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">設定</h1>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>通知設定</CardTitle>
          <CardDescription>
            毎朝の通知時間を設定します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notification-enabled">通知を有効にする</Label>
            <Switch
              id="notification-enabled"
              checked={notificationEnabled}
              onCheckedChange={setNotificationEnabled}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notification-time">通知時間</Label>
            <Input
              id="notification-time"
              type="time"
              value={notificationTime}
              onChange={(e) => setNotificationTime(e.target.value)}
              disabled={!notificationEnabled}
              className="w-32"
            />
          </div>

          <Button onClick={handleSaveNotification} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
        </CardContent>
      </Card>

      {/* Category Settings */}
      <Card>
        <CardHeader>
          <CardTitle>カテゴリ管理</CardTitle>
          <CardDescription>
            タスクのカテゴリを追加・編集・削除できます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Category */}
          <div className="flex gap-2">
            <Input
              placeholder="新しいカテゴリ名"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              追加
            </Button>
          </div>

          {/* Category List */}
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                {editingCategory === category.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-8"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleSaveEdit(category.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium">{category.name}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleStartEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>アカウント情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>メールアドレス</Label>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
