'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Power, PowerOff, Clock, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useRoutines } from '@/lib/hooks/useRoutines'
import { useCategories } from '@/lib/hooks/useCategories'
import { RoutineDialog } from '@/components/routines/RoutineDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Routine } from '@/types'

export default function RoutinesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)
  const [deletingRoutine, setDeletingRoutine] = useState<Routine | null>(null)
  
  const { routines, loading, deleteRoutine, toggleRoutineActive } = useRoutines()
  const { categories } = useCategories()
  const { toast } = useToast()

  const handleAdd = () => {
    setEditingRoutine(null)
    setDialogOpen(true)
  }

  const handleEdit = (routine: Routine) => {
    setEditingRoutine(routine)
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingRoutine) return

    const result = await deleteRoutine(deletingRoutine.id)
    if (result) {
      toast({
        title: '削除完了',
        description: 'ルーティンを削除しました。',
      })
    } else {
      toast({
        title: 'エラー',
        description: 'ルーティンの削除に失敗しました。',
        variant: 'destructive',
      })
    }
    setDeletingRoutine(null)
  }

  const handleToggleActive = async (routine: Routine) => {
    const result = await toggleRoutineActive(routine.id, !routine.is_active)
    if (result) {
      toast({
        title: routine.is_active ? '無効化しました' : '有効化しました',
        description: routine.is_active 
          ? 'ルーティンからのタスク生成を停止しました。' 
          : 'ルーティンからのタスク生成を再開しました。',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">ルーティン管理</h1>
          <p className="text-sm text-slate-500 mt-1">毎日繰り返すタスクを設定します</p>
        </div>
        <Button 
          onClick={handleAdd}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          追加
        </Button>
      </div>

      {routines.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">ルーティンが登録されていません</p>
          <Button 
            onClick={handleAdd}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            最初のルーティンを追加
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {routines.map((routine) => (
              <div
                key={routine.id}
                className={`p-4 transition-colors ${
                  routine.is_active ? 'bg-white' : 'bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`font-medium ${
                          routine.is_active ? 'text-slate-800' : 'text-slate-400'
                        }`}
                      >
                        {routine.title}
                      </span>
                      
                      {routine.category && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-slate-100 text-slate-600">
                          {routine.category.name}
                        </span>
                      )}

                      {routine.has_time && routine.time && (
                        <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-blue-50 text-blue-600">
                          <Clock className="h-3 w-3" />
                          {routine.time.slice(0, 5)}
                        </span>
                      )}

                      {!routine.is_active && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-slate-200 text-slate-600">
                          無効
                        </span>
                      )}
                    </div>

                    {routine.memo && (
                      <p className={`text-sm ${
                        routine.is_active ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        {routine.memo}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleToggleActive(routine)}
                      title={routine.is_active ? '無効化' : '有効化'}
                    >
                      {routine.is_active ? (
                        <Power className="h-4 w-4 text-green-600" />
                      ) : (
                        <PowerOff className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleEdit(routine)}
                    >
                      <Pencil className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setDeletingRoutine(routine)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <RoutineDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        routine={editingRoutine}
        categories={categories}
      />

      <AlertDialog open={!!deletingRoutine} onOpenChange={() => setDeletingRoutine(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>ルーティンを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deletingRoutine?.title}」を削除します。この操作は取り消せません。
              <br />
              既に生成されたタスクは削除されません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
