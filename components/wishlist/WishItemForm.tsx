'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { WishItem } from '@/types'

interface WishItemFormProps {
  isDefaultList: boolean // ウィッシュリスト（理由必須）かどうか
  editingItem?: WishItem | null
  onSubmit: (data: { title: string; reason: string }) => void
  onCancel: () => void
  isOpen?: boolean
}

export function WishItemForm({
  isDefaultList,
  editingItem,
  onSubmit,
  onCancel,
  isOpen = false,
}: WishItemFormProps) {
  const [title, setTitle] = useState('')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<{ title?: string; reason?: string }>({})

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title)
      setReason(editingItem.reason || '')
    } else {
      setTitle('')
      setReason('')
    }
    setErrors({})
  }, [editingItem, isOpen])

  const validate = () => {
    const newErrors: { title?: string; reason?: string } = {}
    
    if (!title.trim()) {
      newErrors.title = 'タイトルを入力してください'
    }
    
    if (isDefaultList && !reason.trim()) {
      newErrors.reason = '理由を入力してください（必須）'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit({ title: title.trim(), reason: reason.trim() })
      setTitle('')
      setReason('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'アイテムを編集' : '新しいアイテムを追加'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              タイトル <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="やりたいことを入力..."
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              理由 {isDefaultList && <span className="text-red-500">*</span>}
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isDefaultList ? '理由を入力してください（必須）' : '理由を入力（任意）'}
              rows={3}
              className={errors.reason ? 'border-red-500' : ''}
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-red-500">{errors.reason}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
              キャンセル
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl"
            >
              {editingItem ? '更新' : '追加'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// インライン追加フォーム（簡易版）
export function WishItemInlineForm({
  isDefaultList,
  onSubmit,
}: {
  isDefaultList: boolean
  onSubmit: (data: { title: string; reason: string }) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<{ title?: string; reason?: string }>({})

  const validate = () => {
    const newErrors: { title?: string; reason?: string } = {}
    
    if (!title.trim()) {
      newErrors.title = 'タイトルを入力してください'
    }
    
    if (isDefaultList && !reason.trim()) {
      newErrors.reason = '理由を入力してください'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit({ title: title.trim(), reason: reason.trim() })
      setTitle('')
      setReason('')
      setIsExpanded(false)
      setErrors({})
    }
  }

  const handleCancel = () => {
    setTitle('')
    setReason('')
    setIsExpanded(false)
    setErrors({})
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full p-4 text-left text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 border-b border-slate-100"
      >
        <Plus className="h-5 w-5" />
        <span>新しいアイテムを追加...</span>
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-b border-slate-100 bg-slate-50 space-y-3">
      <div>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タイトルを入力..."
          autoFocus
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title}</p>
        )}
      </div>
      
      <div>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={isDefaultList ? '理由を入力（必須）' : '理由を入力（任意）'}
          rows={2}
          className={errors.reason ? 'border-red-500' : ''}
        />
        {errors.reason && (
          <p className="mt-1 text-sm text-red-500">{errors.reason}</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
          キャンセル
        </Button>
        <Button 
          type="submit" 
          size="sm"
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          追加
        </Button>
      </div>
    </form>
  )
}
