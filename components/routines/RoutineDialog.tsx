'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Routine, Category, Priority, RoutineFormData } from '@/types'
import { PRIORITY_CONFIG } from '@/types'
import { cn } from '@/lib/utils'

interface RoutineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: RoutineFormData) => Promise<void>
  categories: Category[]
  initialData?: Routine | null
}

const WEEK_DAYS = [
  { value: 0, label: '日' },
  { value: 1, label: '月' },
  { value: 2, label: '火' },
  { value: 3, label: '水' },
  { value: 4, label: '木' },
  { value: 5, label: '金' },
  { value: 6, label: '土' },
]

export function RoutineDialog({
  open,
  onOpenChange,
  onSubmit,
  categories,
  initialData,
}: RoutineDialogProps) {
  const [title, setTitle] = useState('')
  const [memo, setMemo] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [categoryId, setCategoryId] = useState<string>('none')
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]) // 平日デフォルト
  const [hasTime, setHasTime] = useState(false)
  const [time, setTime] = useState('09:00')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 選択中のカテゴリを取得
  const selectedCategory = categories.find(c => c.id === categoryId)

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title)
      setMemo(initialData.memo || '')
      setPriority(initialData.priority)
      setCategoryId(initialData.category_id || 'none')
      setDaysOfWeek(initialData.days_of_week || [1, 2, 3, 4, 5])
      setHasTime(initialData.has_time ?? false)
      // time は "HH:MM:SS" 形式で保存されているので "HH:MM" に変換
      setTime(initialData.time ? initialData.time.slice(0, 5) : '09:00')
    } else {
      setTitle('')
      setMemo('')
      setPriority('medium')
      setCategoryId('none')
      setDaysOfWeek([1, 2, 3, 4, 5])
      setHasTime(false)
      setTime('09:00')
    }
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if (daysOfWeek.length === 0) return

    setIsSubmitting(true)
    await onSubmit({
      title: title.trim(),
      memo: memo.trim() || undefined,
      priority,
      category_id: categoryId === 'none' ? undefined : categoryId,
      days_of_week: daysOfWeek,
      has_time: hasTime,
      time: hasTime ? time : undefined,
    })
    setIsSubmitting(false)
    onOpenChange(false)
  }

  const toggleDayOfWeek = (day: number) => {
    setDaysOfWeek(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 overflow-hidden bg-white">
        <DialogHeader className="px-6 pt-6 pb-4 bg-slate-50 border-b border-slate-200">
          <DialogTitle className="text-xl text-slate-900">
            {initialData ? 'ルーティンを編集' : '新しいルーティン'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-700">
              タスク名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 朝のストレッチ"
              required
              className="h-12 rounded-xl bg-white border-slate-200"
            />
          </div>

          {/* Days of Week */}
          <div className="space-y-2">
            <Label className="text-slate-700">
              繰り返す曜日 <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              {WEEK_DAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDayOfWeek(day.value)}
                  className={cn(
                    'w-10 h-10 rounded-full text-sm font-medium transition-all border-2',
                    daysOfWeek.includes(day.value)
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300',
                    (day.value === 0 || day.value === 6) && !daysOfWeek.includes(day.value) && 'text-red-400'
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
            {daysOfWeek.length === 0 && (
              <p className="text-sm text-red-500">少なくとも1つの曜日を選択してください</p>
            )}
          </div>

          {/* Time Setting */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-slate-700">時刻を指定</Label>
              <Switch
                checked={hasTime}
                onCheckedChange={setHasTime}
              />
            </div>
            {hasTime && (
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-12 rounded-xl bg-white border-slate-200 w-32"
              />
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label className="text-slate-700">優先度</Label>
            <div className="flex gap-2">
              {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG.high][]).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPriority(key)}
                  className={cn(
                    'flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all border-2',
                    priority === key
                      ? key === 'high'
                        ? 'bg-red-50 border-red-300 text-red-700'
                        : key === 'medium'
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-slate-700">カテゴリ</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200">
                <SelectValue placeholder="選択...">
                  {categoryId === 'none' ? (
                    'なし'
                  ) : selectedCategory ? (
                    <span className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: selectedCategory.color }}
                      />
                      <span style={{ color: selectedCategory.color }}>
                        {selectedCategory.name}
                      </span>
                    </span>
                  ) : (
                    '選択...'
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="none">なし</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <span className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span style={{ color: category.color }}>
                        {category.name}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Memo */}
          <div className="space-y-2">
            <Label htmlFor="memo" className="text-slate-700">メモ</Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="詳細やメモを入力（任意）"
              rows={3}
              className="rounded-xl resize-none bg-white border-slate-200"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 rounded-xl bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              キャンセル
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !title.trim() || daysOfWeek.length === 0}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
            >
              {initialData ? '更新' : '追加'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
