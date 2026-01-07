'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WishItem, CreateWishItemInput, UpdateWishItemInput, CreateTaskInput } from '@/types'

// アイテムをソートする関数（未完了が先、完了済みが後）
const sortWishItems = (items: WishItem[]): WishItem[] => {
  return [...items].sort((a, b) => {
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1
    }
    return a.sort_order - b.sort_order
  })
}

export function useWishItems(wishListId: string | null) {
  const [wishItems, setWishItems] = useState<WishItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchWishItems = useCallback(async () => {
    if (!wishListId) {
      setWishItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('wish_items')
      .select('*')
      .eq('wish_list_id', wishListId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching wish items:', error)
      setWishItems([])
    } else {
      setWishItems(sortWishItems(data || []))
    }
    setLoading(false)
  }, [wishListId, supabase])

  useEffect(() => {
    fetchWishItems()
  }, [fetchWishItems])

  const createWishItem = useCallback(async (input: CreateWishItemInput): Promise<WishItem | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const maxSortOrder = wishItems.length > 0
      ? Math.max(...wishItems.map(i => i.sort_order)) + 1
      : 0

    const { data, error } = await supabase
      .from('wish_items')
      .insert({
        user_id: user.id,
        wish_list_id: input.wish_list_id,
        title: input.title,
        reason: input.reason || null,
        is_completed: false,
        sort_order: maxSortOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating wish item:', error)
      return null
    }

    setWishItems(prev => sortWishItems([...prev, data]))
    return data
  }, [supabase, wishItems])

  const updateWishItem = useCallback(async (id: string, input: UpdateWishItemInput): Promise<WishItem | null> => {
    const { data, error } = await supabase
      .from('wish_items')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating wish item:', error)
      return null
    }

    setWishItems(prev => sortWishItems(prev.map(i => i.id === id ? data : i)))
    return data
  }, [supabase])

  const deleteWishItem = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('wish_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting wish item:', error)
      return false
    }

    setWishItems(prev => prev.filter(i => i.id !== id))
    return true
  }, [supabase])

  const toggleComplete = useCallback(async (id: string): Promise<boolean> => {
    const item = wishItems.find(i => i.id === id)
    if (!item) return false

    const { data, error } = await supabase
      .from('wish_items')
      .update({
        is_completed: !item.is_completed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error toggling wish item:', error)
      return false
    }

    setWishItems(prev => sortWishItems(prev.map(i => i.id === id ? data : i)))
    return true
  }, [supabase, wishItems])

  const reorderWishItems = useCallback(async (reorderedItems: WishItem[]): Promise<boolean> => {
    setWishItems(reorderedItems)

    const updates = reorderedItems.map((item, index) => ({
      id: item.id,
      sort_order: index,
    }))

    for (const update of updates) {
      const { error } = await supabase
        .from('wish_items')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)

      if (error) {
        console.error('Error reordering wish items:', error)
        fetchWishItems()
        return false
      }
    }

    return true
  }, [supabase, fetchWishItems])

  // TODOタスクに変換
  const convertToTask = useCallback(async (
    itemId: string,
    taskDate: string,
    priority: 'high' | 'medium' | 'low',
    categoryId?: string | null
  ): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const item = wishItems.find(i => i.id === itemId)
    if (!item) return false

    // タスクを作成
    const { error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: item.title,
        memo: item.reason,
        priority,
        category_id: categoryId || null,
        task_date: taskDate,
        is_completed: false,
        sort_order: 0,
      })

    if (error) {
      console.error('Error converting to task:', error)
      return false
    }

    return true
  }, [supabase, wishItems])

  return {
    wishItems,
    loading,
    fetchWishItems,
    createWishItem,
    updateWishItem,
    deleteWishItem,
    toggleComplete,
    reorderWishItems,
    convertToTask,
  }
}
