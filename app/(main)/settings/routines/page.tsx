'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RoutineDialog } from '@/components/routines/RoutineDialog'
import { useRoutines } from '@/lib/hooks/useRoutines'
import { useCategories } from '@/lib/hooks/useCategories'
import { cn } from '@/lib/utils'
import type { Routine, RoutineFormData } from '@/types'

const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土']

const priorityLabels = {
  high: '高',
  medium: '中',
  low: '低',
}

const priorityColors = {
  high: 'text-red-500',
  medium: 'text-yellow-500',
  low: 'text-green-500',
}

export default function RoutinesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)
  
  const { routines, loading, addRoutine, updateRoutine, toggleRoutineActive, deleteRoutine } = useRoutines()
  const { categories } = useCategories()

  const handleCreate = () => {
    setEditingRoutine(null)
    setDialogOpen(true)
  }

  const handleEdit = (routine: Routine) => {
    setEditingRoutine(routine)
    setDialogOpen(true)
  }

  const handleSubmit = async (formData: RoutineFormData) => {
    if (editingRoutine) {
      await updateRoutine(editingRoutine.id, formData)
    } else {
      await addRoutine(formData)
    }
    setDialogOpen(false)
    setEditingRoutine(null)
  }

  const handleToggleActive = async (routine: Routine) => {
    await toggleRoutineActive(routine.id, !routine.is_active)
  }

  const handleDelete = async (id: string) => {
    if (confirm('このルーティンを削除しますか？')) {
      await deleteRoutine(id)
    }
  }

  const formatDaysOfWeek = (days: number[] | undefined) => {
    if (!days || days.length === 0) return '毎日'
    if (days.length === 7) return '毎日'
    return days
      .sort((a, b) => a - b)
      .map(d => DAYS_OF_WEEK[d])
      .join(', ')
  }

  const formatTime = (time: string | null) => {
    if (!time) return ''
    return time.slice(0, 5)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">ルーティン管理</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          新規作成
        </Button>
      </div>

      {routines.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          ルーティンがありません
        </div>
      ) : (
        <div className="space-y-3">
          {routines.map((routine) => (
            <Card
              key={routine.id}
              className={cn(
                'transition-opacity',
                !routine.is_active && 'opacity-50'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{routine.title}</h3>
                      <span className={cn('text-xs', priorityColors[routine.priority || 'medium'])}>
                        {priorityLabels[routine.priority || 'medium']}
                      </span>
                    </div>
                    {routine.memo && (
                      <p className="text-sm text-gray-500 mt-1">{routine.memo}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{formatDaysOfWeek(routine.days_of_week)}</span>
                      {routine.has_time && routine.time && (
                        <span>{formatTime(routine.time)}</span>
                      )}
                      {routine.category && (
                        <span
                          className="px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: routine.category.color }}
                        >
                          {routine.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(routine)}
                      title={routine.is_active ? '無効にする' : '有効にする'}
                    >
                      {routine.is_active ? (
                        <ToggleRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(routine)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(routine.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RoutineDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        categories={categories}
        initialData={editingRoutine}
      />
    </div>
  )
}
