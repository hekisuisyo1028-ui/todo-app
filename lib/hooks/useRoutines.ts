'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Routine, RoutineFormData } from '@/types'

export function useRoutines() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchRoutines = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('routines')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setRoutines(data)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchRoutines()
  }, [fetchRoutines])

  // ルーティンタスクを生成（当日分のみ、過去分はスライドしない）
  const generateRoutineTasks = useCallback(async (dateString: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 今日の日付を取得
    const today = new Date().toISOString().split('T')[0]
    
    // 過去の日付の場合はルーティンタスクを生成しない
    if (dateString < today) {
      return
    }

    // アクティブなルーティンを取得
    const { data: activeRoutines, error: routineError } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (routineError || !activeRoutines) return

    // 指定日付の既存ルーティンタスクを取得
    const { data: existingTasks, error: taskError } = await supabase
      .from('tasks')
      .select('routine_id')
      .eq('user_id', user.id)
      .eq('task_date', dateString)
      .not('routine_id', 'is', null)

    if (taskError) return

    const existingRoutineIds = new Set(existingTasks?.map(t => t.routine_id) || [])

    // まだ生成されていないルーティンのタスクを作成
    for (const routine of activeRoutines) {
      if (existingRoutineIds.has(routine.id)) continue

      // 曜日チェック（ルーティンに曜日設定がある場合）
      const targetDate = new Date(dateString)
      const dayOfWeek = targetDate.getDay() // 0=日曜, 1=月曜, ...

      // ルーティンにdays_of_weekがある場合はチェック
      if (routine.days_of_week && routine.days_of_week.length > 0) {
        if (!routine.days_of_week.includes(dayOfWeek)) {
          continue
        }
      }

      await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: routine.title,
          memo: routine.memo,
          category_id: routine.category_id,
          priority: routine.priority || 'medium',
          is_completed: false,
          task_date: dateString,
          routine_id: routine.id,
          sort_order: 0,
        })
    }
  }, [supabase])

  const addRoutine = useCallback(async (formData: RoutineFormData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('routines')
      .insert({
        user_id: user.id,
        title: formData.title,
        memo: formData.memo || null,
        category_id: formData.category_id || null,
        has_time: formData.has_time,
        time: formData.has_time && formData.time ? formData.time + ':00' : null,
        is_active: true,
      })
      .select(`
        *,
        category:categories(*)
      `)
      .single()

    if (!error && data) {
      setRoutines(prev => [data, ...prev])
      return data
    }
    return null
  }, [supabase])

  const updateRoutine = useCallback(async (id: string, formData: RoutineFormData) => {
    const { data, error } = await supabase
      .from('routines')
      .update({
        title: formData.title,
        memo: formData.memo || null,
        category_id: formData.category_id || null,
        has_time: formData.has_time,
        time: formData.has_time && formData.time ? formData.time + ':00' : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        category:categories(*)
      `)
      .single()

    if (!error && data) {
      setRoutines(prev => prev.map(r => r.id === id ? data : r))
      return data
    }
    return null
  }, [supabase])

  const toggleRoutineActive = useCallback(async (id: string, isActive: boolean) => {
    const { data, error } = await supabase
      .from('routines')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        category:categories(*)
      `)
      .single()

    if (!error && data) {
      setRoutines(prev => prev.map(r => r.id === id ? data : r))
      return data
    }
    return null
  }, [supabase])

  const deleteRoutine = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', id)

    if (!error) {
      setRoutines(prev => prev.filter(r => r.id !== id))
      return true
    }
    return false
  }, [supabase])

  return {
    routines,
    loading,
    addRoutine,
    updateRoutine,
    toggleRoutineActive,
    deleteRoutine,
    generateRoutineTasks,
    refetch: fetchRoutines,
  }
}
