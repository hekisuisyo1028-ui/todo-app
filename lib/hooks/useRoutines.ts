'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Routine, RoutineFormData } from '@/types'

export function useRoutines() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchRoutines = async () => {
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
  }

  useEffect(() => {
    fetchRoutines()
  }, [])

  const addRoutine = async (formData: RoutineFormData) => {
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
      setRoutines([data, ...routines])
      return data
    }
    return null
  }

  const updateRoutine = async (id: string, formData: RoutineFormData) => {
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
      setRoutines(routines.map(r => r.id === id ? data : r))
      return data
    }
    return null
  }

  const toggleRoutineActive = async (id: string, isActive: boolean) => {
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
      setRoutines(routines.map(r => r.id === id ? data : r))
      return data
    }
    return null
  }

  const deleteRoutine = async (id: string) => {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', id)

    if (!error) {
      setRoutines(routines.filter(r => r.id !== id))
      return true
    }
    return false
  }

  return {
    routines,
    loading,
    addRoutine,
    updateRoutine,
    toggleRoutineActive,
    deleteRoutine,
    refetch: fetchRoutines,
  }
}
