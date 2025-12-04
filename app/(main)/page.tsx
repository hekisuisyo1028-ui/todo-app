'use client'

import { useState, useEffect } from 'react'
import { addDays } from 'date-fns'
import { Plus, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskForm } from '@/components/tasks/TaskForm'
import { useTasks } from '@/lib/hooks/useTasks'
import { useCategories } from '@/lib/hooks/useCategories'
import { formatDate, formatDateISO, isTodayDate } from '@/lib/utils'
import type { Task, TaskFormData } from '@/types'
import { createClient } from '@/lib/supabase/client'

export default function TodayPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  
  const {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    moveTask,
    reorderTasks,
    refetch,
  } = useTasks(currentDate)
  
  const { categories } = useCategories()
  const supabase = createClient()

  // 未完了タスクの自動引き継ぎ
  useEffect(() => {
    const carryOverTasks = async () => {
      const today = formatDateISO(new Date())
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('tasks')
        .update({ task_date: today, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .lt('task_date', today)
      
      refetch()
    }

    carryOverTasks()
  }, [supabase, refetch])

  const handlePrevDay = () => setCurrentDate(prev => addDays(prev, -1))
  const handleNextDay = () => setCurrentDate(prev => addDays(prev, 1))
  const handleToday = () => setCurrentDate(new Date())

  const handleAddTask = async (data: TaskFormData) => {
    await addTask(data)
  }

  const handleUpdateTask = async (data: TaskFormData) => {
    if (editingTask) {
      await updateTask(editingTask.id, data)
      setEditingTask(null)
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  const handleMoveToTomorrow = async (id: string) => {
    const tomorrow = formatDateISO(addDays(currentDate, 1))
    await moveTask(id, tomorrow)
  }

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open)
    if (!open) setEditingTask(null)
  }

  const isToday = isTodayDate(currentDate)
  const completedCount = tasks.filter(t => t.is_completed).length
  const totalCount = tasks.length

  return (
    <div className="max-w-2xl mx-auto">
      {/* Date Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6 mb-6">
        <div className="flex items-center justify-between">
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevDay}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>
            <button
              onClick={handleNextDay}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </button>
            {!isToday && (
              <button
                onClick={handleToday}
                className="px-4 h-10 rounded-xl bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                今日
              </button>
            )}
          </div>

          {/* Date Display */}
          <div className="text-center">
            {isToday && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-medium rounded-full mb-2">
                <Sparkles className="h-3 w-3" />
                TODAY
              </span>
            )}
            <h1 className="text-xl font-bold text-slate-900">
              {formatDate(currentDate)}
            </h1>
          </div>

          {/* Add Button */}
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="h-10 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/25"
          >
            <Plus className="h-4 w-4 mr-2" />
            追加
          </Button>
        </div>

        {/* Progress */}
        {totalCount > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">進捗</span>
              <span className="font-medium text-slate-900">
                {completedCount} / {totalCount} 完了
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              タスクがありません
            </h3>
            <p className="text-slate-500 mb-6">
              「追加」ボタンから新しいタスクを作成しましょう
            </p>
            <Button 
              onClick={() => setIsFormOpen(true)}
              variant="outline"
              className="rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              タスクを追加
            </Button>
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            onToggleComplete={toggleComplete}
            onEdit={handleEdit}
            onDelete={deleteTask}
            onMoveToTomorrow={handleMoveToTomorrow}
            onReorder={reorderTasks}
          />
        )}
      </div>

      {/* Task Form Dialog */}
      <TaskForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={editingTask ? handleUpdateTask : handleAddTask}
        categories={categories}
        initialData={editingTask}
        defaultDate={formatDateISO(currentDate)}
      />
    </div>
  )
}

// CheckSquare icon import for empty state
import { CheckSquare } from 'lucide-react'
