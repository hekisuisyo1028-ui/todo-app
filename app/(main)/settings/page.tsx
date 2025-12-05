'use client'

import { useState, useEffect } from 'react'
import { Save, Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const [mounted, setMounted] = useState(false)
  
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

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

  if (!mounted) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-slate-900">設定</h1>

      {/* Notification Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-900">通知設定</h2>
          <p className="text-sm text-slate-500">毎朝の通知時間を設定します</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notification-enabled" className="text-slate-700">通知を有効にする</Label>
            <button
              id="notification-enabled"
              onClick={() => setNotificationEnabled(!notificationEnabled)}
              className={`w-12 h-6 rounded-full transition-colors ${
                notificationEnabled ? 'bg-blue-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  notificationEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notification-time" className="text-slate-700">通知時間</Label>
            <Input
              id="notification-time"
              type="time"
              value={notificationTime}
              onChange={(e) => setNotificationTime(e.target.value)}
              disabled={!notificationEnabled}
              className="w-32 bg-white border-slate-200"
            />
          </div>

          <Button 
            onClick={handleSaveNotification} 
            disabled={saving}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
        </div>
      </div>

      {/* Category Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-900">カテゴリ管理</h2>
          <p className="text-sm text-slate-500">タスクのカテゴリを追加・編集・削除できます</p>
        </div>
        <div className="p-6 space-y-4">
          {/* Add Category */}
          <div className="flex gap-2">
            <Input
              placeholder="新しいカテゴリ名"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              className="bg-white border-slate-200"
            />
            <Button 
              onClick={handleAddCategory} 
              disabled={!newCategoryName.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              追加
            </Button>
          </div>

          {/* Category List */}
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                {editingCategory === category.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-8 bg-white border-slate-200"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleSaveEdit(category.id)}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4 text-slate-500" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium text-slate-700">{category.name}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleStartEdit(category)}
                      >
                        <Pencil className="h-4 w-4 text-slate-500" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-900">アカウント情報</h2>
        </div>
        <div className="p-6">
          <div className="space-y-2">
            <Label className="text-slate-700">メールアドレス</Label>
            <p className="text-sm text-slate-500">{profile?.email}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
