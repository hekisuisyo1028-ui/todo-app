'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface CreateListModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (title: string) => void
}

export function CreateListModal({
  isOpen,
  onClose,
  onCreate,
}: CreateListModalProps) {
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setError('')
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      setError('リスト名を入力してください')
      return
    }

    onCreate(title.trim())
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>新しいリストを作成</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              リスト名 <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setError('')
              }}
              placeholder="例: 旅行で行きたい場所"
              autoFocus
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl"
            >
              作成
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
