'use client'

import { useState } from 'react'
import { Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TaskItem } from '@/components/tasks/TaskItem'
import { TaskForm } from '@/components/tasks/TaskForm'
import { useCategories } from '@/lib/hooks/useCategories'
import { createClient } from '@/lib/supabase/client'
import { format, addDays } from 'date-fns'
import type { Task, TaskFormData } from '@/types'

// 優先度の重み付け（高→中→低の順）
const priorityOrder: Record<string, number> = {
  high: 1,
  medium: 2,
  low: 3,
}

// タスクを優先度順にソートする関数
const sortTasksByPriority = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1
    }
    const priorityA = priorityOrder[a.priority] ?? 999
    const priorityB = priorityOrder[b.priority] ?? 999
    const priorityDiff = priorityA - priorityB
    if (priorityDiff !== 0) return priorityDiff
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
}

// 日付フォーマット
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return format(date, 'yyyy年M月d日')
}

// 日付をISO形式に変換
const formatDateISO = (date: Date) => {
  return format(date, 'yyyy-MM-dd')
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [results, setResults] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  
  const { categories } = useCategories()
  const supabase = createClient()

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setHasSearched(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let queryBuilder = supabase
        .from('tasks')
        .select('*, category:categories(*)')
        .eq('user_id', user.id)
        .or(`title.ilike.%${query}%,memo.ilike.%${query}%`)
        .order('task_date', { ascending: false })

      // Date filter
      const today = formatDateISO(new Date())
      if (dateFilter === 'today') {
        queryBuilder = queryBuilder.eq('task_date', today)
      } else if (dateFilter === 'week') {
        const weekAgo = formatDateISO(addDays(new Date(), -7))
        queryBuilder = queryBuilder.gte('task_date', weekAgo)
      } else if (dateFilter === 'month') {
        const monthAgo = formatDateISO(addDays(new Date(), -30))
        queryBuilder = queryBuilder.gte('task_date', monthAgo)
      }

      const { data, error } = await queryBuilder.limit(50)

      if (error) {
        console.error('Search error:', error)
      } else {
        setResults(data || [])
      }
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleToggleComplete = async (id: string) => {
    const task = results.find(t => t.id === id)
    if (!task) return

    const { data, error } = await supabase
      .from('tasks')
      .update({ is_completed: !task.is_completed, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, category:categories(*)')
      .single()

    if (!error && data) {
      setResults(prev => sortTasksByPriority(prev.map(t => t.id === id ? data : t)))
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (!error) {
      setResults(prev => prev.filter(t => t.id !== id))
    }
  }

  const handleMoveToTomorrow = async (id: string) => {
    const task = results.find(t => t.id === id)
    if (!task) return

    const tomorrow = formatDateISO(addDays(new Date(task.task_date), 1))
    
    const { data, error } = await supabase
      .from('tasks')
      .update({ task_date: tomorrow, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, category:categories(*)')
      .single()

    if (!error && data) {
      setResults(prev => prev.map(t => t.id === id ? data : t))
    }
  }

  const handleUpdateTask = async (formData: TaskFormData) => {
    if (!editingTask) return

    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: formData.title,
        memo: formData.memo,
        category_id: formData.category_id,
        priority: formData.priority,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingTask.id)
      .select('*, category:categories(*)')
      .single()

    if (!error && data) {
      setResults(prev => sortTasksByPriority(prev.map(t => t.id === editingTask.id ? data : t)))
    }
    setEditingTask(null)
    setIsFormOpen(false)
  }

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open)
    if (!open) {
      setEditingTask(null)
    }
  }

  // Group results by date and sort by priority within each date
  const groupedResults = results.reduce((acc, task) => {
    const date = task.task_date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  // 各日付内で優先度順にソート
  Object.keys(groupedResults).forEach(date => {
    groupedResults[date] = sortTasksByPriority(groupedResults[date])
  })

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-6">タスク検索</h1>

      {/* Search Form */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="タスク名またはメモで検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10"
          />
        </div>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全期間</SelectItem>
            <SelectItem value="today">今日</SelectItem>
            <SelectItem value="week">過去1週間</SelectItem>
            <SelectItem value="month">過去1ヶ月</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} disabled={loading}>
          検索
        </Button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          検索中...
        </div>
      ) : hasSearched ? (
        results.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedResults)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, tasks]) => (
                <div key={date}>
                  <h2 className="text-sm font-semibold text-gray-500 mb-2">
                    {formatDate(date)}
                  </h2>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggleComplete={handleToggleComplete}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onMoveToTomorrow={handleMoveToTomorrow}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            検索結果がありません
          </div>
        )
      ) : (
        <div className="text-center py-12 text-gray-500">
          キーワードを入力して検索してください
        </div>
      )}

      {/* Task Form Dialog */}
      {editingTask && (
        <TaskForm
          open={isFormOpen}
          onOpenChange={handleFormClose}
          onSubmit={handleUpdateTask}
          categories={categories}
          defaultDate={editingTask.task_date}
          initialData={editingTask}
        />
      )}
    </div>
  )
}
