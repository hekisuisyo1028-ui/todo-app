// Priority type
export type Priority = 'high' | 'medium' | 'low'

export const PRIORITY_CONFIG = {
  high: { label: '高', color: 'red' },
  medium: { label: '中', color: 'amber' },
  low: { label: '低', color: 'green' },
} as const

// Category type
export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  sort_order: number
  is_default: boolean
  created_at: string
  updated_at: string
}

// Task type
export interface Task {
  id: string
  user_id: string
  category_id: string | null
  routine_id: string | null
  title: string
  memo: string | null
  priority: Priority
  is_completed: boolean
  task_date: string
  sort_order: number
  created_at: string
  updated_at: string
  category?: Category
}

// TaskFormData type
export interface TaskFormData {
  title: string
  memo?: string
  priority: Priority
  category_id?: string
  task_date: string
}

// Routine type
export interface Routine {
  id: string
  user_id: string
  category_id: string | null
  title: string
  memo: string | null
  priority: Priority
  frequency: 'daily' | 'weekly' | 'monthly'
  day_of_week: number | null
  day_of_month: number | null
  has_time: boolean
  scheduled_time: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  category?: Category
}

// RoutineFormData type
export interface RoutineFormData {
  title: string
  memo?: string
  priority: Priority
  category_id?: string
  frequency: 'daily' | 'weekly' | 'monthly'
  day_of_week?: number
  day_of_month?: number
  has_time: boolean
  scheduled_time?: string
}

// Profile type
export interface Profile {
  id: string
  email: string
  notification_time: string | null
  notification_enabled: boolean
  created_at: string
  updated_at: string
}
