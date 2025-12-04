'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskFormData } from '@/types'
import { formatDateISO } from '@/lib/utils'

export function useTasks(date: Date) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const dateStr = formatDateISO(date)
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*, category:categories(*)')
      .eq('task_date', dateStr)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching tasks:', error)
    } else {
      setTasks(data || [])
    }
    setLoading(false)
  }, [date, supabase])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const addTask = async (taskData: TaskFormData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const maxOrder = tasks.length > 0 
      ? Math.max(...tasks.map(t => t.sort_order)) + 1 
      : 0

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        user_id: user.id,
        sort_order: maxOrder,
      })
      .select('*, category:categories(*)')
      .single()

    if (error) {
      console.error('Error adding task:', error)
      return null
    }

    setTasks(prev => [...prev, data])
    return data
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, category:categories(*)')
      .single()

    if (error) {
      console.error('Error updating task:', error)
      return null
    }

    setTasks(prev => prev.map(t => t.id === id ? data : t))
    return data
  }

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting task:', error)
      return false
    }

    setTasks(prev => prev.filter(t => t.id !== id))
    return true
  }

  const toggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return null

    return updateTask(id, { is_completed: !task.is_completed })
  }

  const moveTask = async (id: string, newDate: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ task_date: newDate, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, category:categories(*)')
      .single()

    if (error) {
      console.error('Error moving task:', error)
      return null
    }

    // Remove from current list if moved to different date
    if (newDate !== formatDateISO(date)) {
      setTasks(prev => prev.filter(t => t.id !== id))
    }

    return data
  }

  const reorderTasks = async (reorderedTasks: Task[]) => {
    setTasks(reorderedTasks)

    const updates = reorderedTasks.map((task, index) => ({
      id: task.id,
      sort_order: index,
    }))

    for (const update of updates) {
      await supabase
        .from('tasks')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
    }
  }

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    moveTask,
    reorderTasks,
    refetch: fetchTasks,
  }
}

export function useWeekTasks(dates: Date[]) {
  const [tasksByDate, setTasksByDate] = useState<Record<string, Task[]>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchWeekTasks = useCallback(async () => {
    setLoading(true)
    const dateStrings = dates.map(d => formatDateISO(d))
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*, category:categories(*)')
      .in('task_date', dateStrings)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching week tasks:', error)
    } else {
      const grouped: Record<string, Task[]> = {}
      dateStrings.forEach(d => { grouped[d] = [] })
      
      data?.forEach(task => {
        if (grouped[task.task_date]) {
          grouped[task.task_date].push(task)
        }
      })
      
      setTasksByDate(grouped)
    }
    setLoading(false)
  }, [dates, supabase])

  useEffect(() => {
    if (dates.length > 0) {
      fetchWeekTasks()
    }
  }, [fetchWeekTasks, dates])

  const updateTaskInWeek = (task: Task) => {
    setTasksByDate(prev => {
      const newState = { ...prev }
      // Remove from old date
      Object.keys(newState).forEach(date => {
        newState[date] = newState[date].filter(t => t.id !== task.id)
      })
      // Add to new date
      if (newState[task.task_date]) {
        newState[task.task_date] = [...newState[task.task_date], task]
          .sort((a, b) => a.sort_order - b.sort_order)
      }
      return newState
    })
  }

  const removeTaskFromWeek = (taskId: string) => {
    setTasksByDate(prev => {
      const newState = { ...prev }
      Object.keys(newState).forEach(date => {
        newState[date] = newState[date].filter(t => t.id !== taskId)
      })
      return newState
    })
  }

  return {
    tasksByDate,
    loading,
    refetch: fetchWeekTasks,
    updateTaskInWeek,
    removeTaskFromWeek,
  }
}
