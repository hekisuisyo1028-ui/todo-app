'use client'

import { useState, useMemo } from 'react'
import { addWeeks } from 'date-fns'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WeekView } from '@/components/tasks/WeekView'
import { TaskForm } from '@/components/tasks/TaskForm'
import { useWeekTasks } from '@/lib/hooks/useTasks'
import { useCategories } from '@/lib/hooks/useCategories'
import { getWeekDates, formatDate, formatDateISO } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskFormData } from '@/types'

export default function WeekPage() {
  const [baseDate, setBaseDate] = useState(new Date())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  
  const dates = useMemo(() => getWeekDates(baseDate), [baseDate])
  const { tasksByDate, loading, refetch, updateTaskInWeek, removeTaskFromWeek } = useWeekTasks(dates)
  const { categories } = useCategories()
  const supabase = createClient()

  const handlePrevWeek = () => setBaseDate(prev => addWeeks(prev, -1))
  const handleNextWeek = () => setBaseDate(prev => addWeeks(prev, 1))
  const handleThisWeek = () => setBaseDate(new Date())

  const handleToggleComplete = async (id: string) => {
    let task: Task | undefined
    for (const tasks of Object.values(tasksByDate)) {
      task = tasks.find(t => t.id === id)
      if (task) break
    }
    if (!task) return

    const { data, error } = await supabase
      .from('tasks')
      .update({ is_completed: !task.is_completed, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, category:categories(*)')
      .single()

    if (!error && data) {
      updateTaskInWeek(data)
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) removeTaskFromWeek(id)
  }

  const handleMoveTask = async (taskId: string, newDate: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ task_date: newDate, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select('*, category:categories(*)')
      .single()

    if (!error && data) updateTaskInWeek(data)
  }

  const handleUpdateTask = async (formData: TaskFormData) => {
    if (!editingTask) return

    const { data, error } = await supabase
      .from('tasks')
      .update({ ...formData, updated_at: new Date().toISOString() })
      .eq('id', editingTask.id)
      .select('*, category:categories(*)')
      .single()

    if (!error && data) updateTaskInWeek(data)
    setEditingTask(null)
  }

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open)
    if (!open) setEditingTask(null)
  }

  const weekStart = dates[0]
  const weekEnd = dates[6]

  return (
    <div>
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6 mb-6">
        <div className="flex items-center justify-between">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevWeek}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>
            <button
              onClick={handleNextWeek}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </button>
            <button
              onClick={handleThisWeek}
              className="px-4 h-10 rounded-xl bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              今週
            </button>
          </div>

          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                {formatDate(weekStart, 'M月d日')} - {formatDate(weekEnd, 'M月d日')}
              </h1>
              <p className="text-sm text-slate-500">週間ビュー</p>
            </div>
          </div>

          <div className="w-[120px]" />
        </div>
      </div>

      {/* Week View */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-4 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <WeekView
            dates={dates}
            tasksByDate={tasksByDate}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMoveTask={handleMoveTask}
          />
        )}
      </div>

      {/* Task Form Dialog */}
      <TaskForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={handleUpdateTask}
        categories={categories}
        initialData={editingTask}
        defaultDate={formatDateISO(new Date())}
      />
    </div>
  )
}
