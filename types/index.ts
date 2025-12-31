import { Database } from '@/lib/supabase/database.types'

// カテゴリ
export type Category = {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

export type CategoryFormData = {
  name: string
  color: string
}

// タスク
export type Task = {
  id: string
  user_id: string
  title: string
  memo: string | null
  category_id: string | null
  category?: Category | null
  priority: 'high' | 'medium' | 'low'
  is_completed: boolean
  task_date: string
  sort_order: number
  routine_id: string | null
  created_at: string
  updated_at: string
}

export type CreateTaskInput = {
  title: string
  memo?: string | null
  category_id?: string | null
  priority?: 'high' | 'medium' | 'low'
  is_completed?: boolean
  task_date: string
  routine_id?: string | null
}

export type UpdateTaskInput = Partial<CreateTaskInput>

export type TaskFormData = {
  title: string
  memo?: string | null
  category_id?: string | null
  priority: 'high' | 'medium' | 'low'
  task_date?: string
}

// ルーティン
export type Routine = {
  id: string
  user_id: string
  title: string
  memo: string | null
  category_id: string | null
  category?: Category | null
  priority: 'high' | 'medium' | 'low'
  has_time: boolean
  time: string | null
  days_of_week: number[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export type RoutineFormData = {
  title: string
  memo?: string | null
  category_id?: string | null
  priority?: 'high' | 'medium' | 'low'
  has_time: boolean
  time?: string | null
  days_of_week?: number[]
}
