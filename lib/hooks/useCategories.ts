'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
    } else {
      setCategories(data || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const addCategory = async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const maxOrder = categories.length > 0 
      ? Math.max(...categories.map(c => c.sort_order)) + 1 
      : 0

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name,
        user_id: user.id,
        sort_order: maxOrder,
        is_default: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding category:', error)
      return null
    }

    setCategories(prev => [...prev, data])
    return data
  }

  const updateCategory = async (id: string, name: string) => {
    const { data, error } = await supabase
      .from('categories')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating category:', error)
      return null
    }

    setCategories(prev => prev.map(c => c.id === id ? data : c))
    return data
  }

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting category:', error)
      return false
    }

    setCategories(prev => prev.filter(c => c.id !== id))
    return true
  }

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  }
}
