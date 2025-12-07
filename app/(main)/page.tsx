'use client'

import { useState, useEffect } from 'react'
import { addDays } from 'date-fns'
import { Plus, ChevronLeft, ChevronRight, Sparkles, CheckSquare, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskForm } from '@/components/tasks/TaskForm'
import { useTasks } from '@/lib/hooks/useTasks'
import { useCategories } from '@/lib/hooks/useCategories'
import { formatDate, formatDateISO, isTodayDate } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import type { Task, TaskFormData } from '@/types'
import { createClient } from '@/lib/supabase/client'

export default function TodayPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [mounted, setMounted] = useState(false)
  const [generatingRoutines, setGeneratingRoutines] = useState(false)
  
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
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

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

    if (mounted) {
      carryOverTasks()
    }
  }, [supabase, refetch, mounted])

  // 今日のページを開いたときに自動的にルーティンタスクを生成
  useEffect(() => {
    const generateRoutineTasksOnLoad = async () => {
      if (!mounted || !isTodayDate(currentDate)) return
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 今日のルーティンタスクが既に存在するかチェック
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('task_date', formatDateISO(currentDate))
        .not('routine_id', 'is', null)
        .limit(1)

      // 既に存在する場合は生成しない
      if (existingTasks && existingTasks.length > 0) return

      // ルーティンタスクを生成
      await generateRoutineTasks()
    }

    generateRoutineTasksOnLoad()
  }, [mounted, currentDate])

  const handlePrevDay = () => setCurrentDate(prev => addDays(prev, -1))
  const handleNextDay = () => setCurrentDate(prev => addDays(prev, 1))
  const handleToday = () => setCurrentDate(new Date())

  const handleAddTask = async (data: TaskFormData) => {
    await addTask(data)
    refetch()
  }

  const handleUpdateTask = async (data: TaskFormData) => {
    if (editingTask) {
      await updateTask(editingTask.id, data)
      setEditingTask(null)
      refetch()
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteTask(id)
    refetch()
  }

  const handleToggleComplete = async (id: string) => {
    await toggleComplete(id)
    refetch()
  }

  const handleMoveToTomorrow = async (id: string) => {
    const tomorrow = formatDateISO(addDays(currentDate, 1))
    await moveTask(id, tomorrow)
    refetch()
  }

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open)
    if (!open) setEditingTask(null)
  }

  const generateRoutineTasks = async () => {
    setGeneratingRoutines(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setGeneratingRoutines(false)
      return
    }

    try {
      // アクティブなルーティンを取得
      const { data: routines, error: routinesError } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (routinesError) throw routinesError

      if (!routines || routines.length === 0) {
        toast({
          title: 'ルーティンがありません',
          description: '設定画面からルーティンを追加してください。',
        })
        setGeneratingRoutines(false)
        return
      }

      const targetDate = formatDateISO(currentDate)

      // 既に今日のルーティンタスクが存在するかチェック
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('routine_id')
        .eq('user_id', user.id)
        .eq('task_date', targetDate)
        .not('routine_id', 'is', null)

      const existingRoutineIds = new Set(existingTasks?.map(t => t.routine_id) || [])

      // まだ生成されていないルーティンのタスクを作成
      const tasksToCreate = routines
        .filter(routine => !existingRoutineIds.has(routine.id))
        .map(routine => ({
          user_id: user.id,
          category_id: routine.category_id,
          title: routine.title,
          memo: routine.memo,
          priority: 'medium' as const,
          task_date: targetDate,
          routine_id: routine.id,
          is_completed: false,
        }))

      if (tasksToCreate.length === 0) {
        toast({
          title: '既に生成済みです',
          description: '本日のルーティンタスクは既に生成されています。',
        })
        setGeneratingRoutines(false)
        return
      }

      const { error: insertError } = await supabase
        .from('tasks')
        .insert(tasksToCreate)

      if (insertError) throw insertError

      toast({
        title: '生成完了',
        description: `${tasksToCreate.length}件のルーティンタスクを生成しました。`,
      })

      refetch()
    } catch (error) {
      console.error('Error generating routine tasks:', error)
      toast({
        title: 'エラー',
        description: 'ルーティンタスクの生成に失敗しました。',
        variant: 'destructive',
      })
    }

    setGeneratingRoutines(false)
  }

  if (!mounted) {
    return null
  }

  const isToday = isTodayDate(currentDate)
  const completedCount = tasks.filter(t => t.is_completed).length
  const totalCount = tasks.length
  const hasRoutineTasks = tasks.some(t => t.routine_id)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Date Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
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
            className="h-10 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/25"
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

      {/* Generate Routine Tasks Button */}
      {!hasRoutineTasks && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Repeat className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">ルーティンタスク</h3>
                <p className="text-sm text-slate-600">毎日のルーティンをタスクに追加</p>
              </div>
            </div>
            <Button
              onClick={generateRoutineTasks}
              disabled={generatingRoutines}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {generatingRoutines ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  生成中...
                </>
              ) : (
                <>
                  <Repeat className="h-4 w-4 mr-2" />
                  生成
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
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
              className="rounded-xl bg-white border-slate-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              タスクを追加
            </Button>
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEdit}
            onDelete={handleDelete}
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
