'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WishList, CreateWishListInput, UpdateWishListInput } from '@/types'

export function useWishLists() {
  const [wishLists, setWishLists] = useState<WishList[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchWishLists = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('wish_lists')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching wish lists:', error)
      setWishLists([])
    } else {
      setWishLists(data || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchWishLists()
  }, [fetchWishLists])

  const createWishList = useCallback(async (input: CreateWishListInput): Promise<WishList | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const maxSortOrder = wishLists.length > 0
      ? Math.max(...wishLists.map(l => l.sort_order)) + 1
      : 0

    const { data, error } = await supabase
      .from('wish_lists')
      .insert({
        user_id: user.id,
        title: input.title,
        is_default: false,
        sort_order: maxSortOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating wish list:', error)
      return null
    }

    setWishLists(prev => [...prev, data])
    return data
  }, [supabase, wishLists])

  const updateWishList = useCallback(async (id: string, input: UpdateWishListInput): Promise<WishList | null> => {
    const { data, error } = await supabase
      .from('wish_lists')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating wish list:', error)
      return null
    }

    setWishLists(prev => prev.map(l => l.id === id ? data : l))
    return data
  }, [supabase])

  const deleteWishList = useCallback(async (id: string): Promise<boolean> => {
    // デフォルトリストは削除不可
    const list = wishLists.find(l => l.id === id)
    if (list?.is_default) {
      console.error('Cannot delete default wish list')
      return false
    }

    const { error } = await supabase
      .from('wish_lists')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting wish list:', error)
      return false
    }

    setWishLists(prev => prev.filter(l => l.id !== id))
    return true
  }, [supabase, wishLists])

  const reorderWishLists = useCallback(async (reorderedLists: WishList[]): Promise<boolean> => {
    setWishLists(reorderedLists)

    const updates = reorderedLists.map((list, index) => ({
      id: list.id,
      sort_order: index,
    }))

    for (const update of updates) {
      const { error } = await supabase
        .from('wish_lists')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)

      if (error) {
        console.error('Error reordering wish lists:', error)
        fetchWishLists()
        return false
      }
    }

    return true
  }, [supabase, fetchWishLists])

  return {
    wishLists,
    loading,
    fetchWishLists,
    createWishList,
    updateWishList,
    deleteWishList,
    reorderWishLists,
  }
}
