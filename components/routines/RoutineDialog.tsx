'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { Routine, RoutineFormData, Category } from '@/types'

interface RoutineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: RoutineFormData) => Promise<void>
  categories: Category[]
  initialData?: Routine | null
}

export function RoutineDialog({
  open,
  onOpenChange,
  onSubmit,
  categories,
  initialData,
}: RoutineDialogProps) {
  const [formData, setFormData] = useState<RoutineFormData>({
    title: '',
    memo: '',
    category_id: null,
    priority: 'medium',
    has_time: false,
    time: '',
    days_of_week: [],
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        memo: initialData.memo || '',
        category_id: initialData.category_id,
        priority: initialData.priority || 'medium',
        has_time: initialData.has_time,
        time: initialData.time?.slice(0, 5) || '',
        days_of_week: initialData.days_of_week || [],
      })
    } else {
      setFormData({
        title: '',
        memo: '',
        category_id: null,
        priority: 'medium',
        has_time: false,
        time: '',
        days_of_week: [],
      })
    }
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setLoading(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const toggleDayOfWeek = (day: number) => {
    const currentDays = formData.days_of_week || []
    if (currentDays.includes(day)) {
      setFormData({
        ...formData,
        days_of_week: currentDays.filter(d => d !== day),
      })
    } else {
      setFormData({
        ...formData,
        days_of_week: [...currentDays, day],
      })
    }
  }

  const DAYS_OF_WEEK = [
    { value: 1, label: '月' },
    { value: 2, label: '火' },
    { value: 3, label: '水' },
    { value: 4, label: '木' },
    { value: 5, label: '金' },
    { value: 6, label: '土' },
    { value: 0, label: '日' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-slate-900">
            {initialData ? 'ルーティンを編集' : '新しいルーティン'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* タイトル */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-700">タイトル</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="ルーティン名を入力"
              className="bg-white border-slate-200"
              required
            />
          </div>

          {/* メモ */}
          <div className="space-y-2">
            <Label htmlFor="memo" className="text-slate-700">メモ</Label>
            <Textarea
              id="memo"
              value={formData.memo || ''}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              placeholder="メモを入力（任意）"
              className="bg-white border-slate-200"
              rows={3}
            />
          </div>

          {/* カテゴリ */}
          <div className="space-y-2">
            <Label className="text-slate-700">カテゴリ</Label>
            <Select
              value={formData.category_id || 'none'}
              onValueChange={(value) =>
                setFormData({ ...formData, category_id: value === 'none' ? null : value })
              }
            >
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">なし</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 優先度 */}
          <div className="space-y-2">
            <Label className="text-slate-700">優先度</Label>
            <Select
              value={formData.priority || 'medium'}
              onValueChange={(value: 'high' | 'medium' | 'low') =>
                setFormData({ ...formData, priority: value })
              }
            >
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="優先度を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="low">低</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 曜日選択 */}
          <div className="space-y-2">
            <Label className="text-slate-700">実行する曜日</Label>
            <div className="flex gap-1">
              {DAYS_OF_WEEK.map((day) => (
                <Button
                  key={day.value}
                  type="button"
                  variant={(formData.days_of_week || []).includes(day.value) ? 'default' : 'outline'}
                  size="sm"
                  className="w-9 h-9 p-0"
                  onClick={() => toggleDayOfWeek(day.value)}
                >
                  {day.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              選択しない場合は毎日実行されます
            </p>
          </div>

          {/* 時間設定 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="has_time" className="text-slate-700">時間を設定</Label>
            <Switch
              id="has_time"
              checked={formData.has_time}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, has_time: checked, time: checked ? (formData.time || '') : '' })
              }
            />
          </div>

          {formData.has_time && (
            <div className="space-y-2">
              <Label htmlFor="time" className="text-slate-700">時間</Label>
              <Input
                type="time"
                value={formData.time || ''}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-32 bg-white border-slate-200"
              />
            </div>
          )}

          {/* 送信ボタン */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : initialData ? '更新' : '作成'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
