// 優先度
export type Priority = 'high' | 'medium' | 'low'

export const PRIORITY_CONFIG = {
  high: { label: '高', color: 'bg-red-500', textColor: 'text-red-500' },
  medium: { label: '中', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  low: { label: '低', color: 'bg-green-500', textColor: 'text-green-500' },
} as const

// プロフィール
export type Profile = {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

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
  priority: Priority
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
  priority?: Priority
  is_completed?: boolean
  task_date: string
  routine_id?: string | null
}

export type UpdateTaskInput = Partial<CreateTaskInput>

export type TaskFormData = {
  title: string
  memo?: string | null
  category_id?: string | null
  priority: Priority
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
  priority: Priority
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
  priority?: Priority
  has_time: boolean
  time?: string | null
  days_of_week?: number[]
}
