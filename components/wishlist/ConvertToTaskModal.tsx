'use client'

import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategories } from '@/lib/hooks/useCategories'
import type { WishItem, Priority } from '@/types'
import { PRIORITY_CONFIG } from '@/types'

interface ConvertToTaskModalProps {
  item: WishItem | null
  isOpen: boolean
  onClose: () => void
  onConvert: (data: {
    itemId: string
    date: string
    priority: Priority
    categoryId: string | null
  }) => void
}

export function ConvertToTaskModal({
  item,
  isOpen,
  onClose,
  onConvert,
}: ConvertToTaskModalProps) {
  const { categories } = useCategories()
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [priority, setPriority] = useState<Priority>('medium')
  const [categoryId, setCategoryId] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
      setPriority('medium')
      setCategoryId('')
    }
  }, [isOpen])

  const handleSubmit = () => {
    if (!item) return
    
    onConvert({
      itemId: item.id,
      date: selectedDate,
      priority,
      categoryId: categoryId || null,
    })
    onClose()
  }

  // 日付のクイック選択オプション
  const dateOptions = [
    { label: '今日', value: format(new Date(), 'yyyy-MM-dd') },
    { label: '明日', value: format(addDays(new Date(), 1), 'yyyy-MM-dd') },
    { label: '1週間後', value: format(addDays(new Date(), 7), 'yyyy-MM-dd') },
  ]

  if (!item) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>TODOに追加</DialogTitle>
          <DialogDescription>
            「{item.title}」をTODOリストに追加します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 日付選択 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              日付
            </label>
            <div className="flex gap-2 mb-2">
              {dateOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={selectedDate === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDate(option.value)}
                  className="rounded-lg"
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* 優先度選択 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              優先度
            </label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      {config.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* カテゴリ選択 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              カテゴリ
            </label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="カテゴリを選択（任意）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">なし</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl"
          >
            TODOに追加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
