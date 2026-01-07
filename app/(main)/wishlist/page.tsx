'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWishLists } from '@/lib/hooks/useWishLists'
import { useWishItems } from '@/lib/hooks/useWishItems'
import { useTasks } from '@/lib/hooks/useTasks'
import { WishListTabs } from '@/components/wishlist/WishListTabs'
import { WishListContent } from '@/components/wishlist/WishListContent'
import { CreateListModal } from '@/components/wishlist/CreateListModal'
import { EditListModal } from '@/components/wishlist/EditListModal'
import { ConvertToTaskModal } from '@/components/wishlist/ConvertToTaskModal'
import { WishItemForm } from '@/components/wishlist/WishItemForm'
import type { WishList, WishItem, Priority } from '@/types'

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false)
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // モーダル状態
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false)
  const [editingList, setEditingList] = useState<WishList | null>(null)
  const [editingItem, setEditingItem] = useState<WishItem | null>(null)
  const [isItemFormOpen, setIsItemFormOpen] = useState(false)
  const [convertingItem, setConvertingItem] = useState<WishItem | null>(null)

  // カスタムフック
  const {
    lists,
    loading: listsLoading,
    createList,
    updateList,
    deleteList,
    reorderLists,
  } = useWishLists()

  const {
    items,
    loading: itemsLoading,
    createItem,
    updateItem,
    deleteItem,
    toggleComplete,
    reorderItems,
  } = useWishItems(activeListId)

  const { createTask } = useTasks(new Date())

  // マウント時の処理
  useEffect(() => {
    setMounted(true)
  }, [])

  // リストが読み込まれたら最初のリストを選択
  useEffect(() => {
    if (lists.length > 0 && !activeListId) {
      // デフォルトリスト（ウィッシュリスト）を優先
      const defaultList = lists.find(l => l.is_default)
      setActiveListId(defaultList?.id || lists[0].id)
    }
  }, [lists, activeListId])

  // 現在選択中のリスト
  const activeList = lists.find(l => l.id === activeListId)
  const isDefaultList = activeList?.is_default ?? false

  // 検索フィルタリング
  const filteredItems = items.filter(item => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      item.title.toLowerCase().includes(query) ||
      (item.reason && item.reason.toLowerCase().includes(query))
    )
  })

  // リスト作成
  const handleCreateList = async (title: string) => {
    await createList(title)
    setIsCreateListModalOpen(false)
  }

  // リスト更新
  const handleUpdateList = async (id: string, title: string) => {
    await updateList(id, title)
    setEditingList(null)
  }

  // リスト削除
  const handleDeleteList = async (id: string) => {
    await deleteList(id)
    // 削除したリストが選択中だった場合、デフォルトリストに切り替え
    if (activeListId === id) {
      const defaultList = lists.find(l => l.is_default)
      setActiveListId(defaultList?.id || null)
    }
  }

  // アイテム作成
  const handleCreateItem = async (data: { title: string; reason: string }) => {
    if (!activeListId) return
    await createItem({
      wish_list_id: activeListId,
      title: data.title,
      reason: data.reason || null,
    })
  }

  // アイテム更新
  const handleUpdateItem = async (data: { title: string; reason: string }) => {
    if (!editingItem) return
    await updateItem(editingItem.id, {
      title: data.title,
      reason: data.reason || null,
    })
    setEditingItem(null)
    setIsItemFormOpen(false)
  }

  // アイテム削除
  const handleDeleteItem = async (id: string) => {
    await deleteItem(id)
  }

  // 完了切り替え
  const handleToggleComplete = async (id: string) => {
    await toggleComplete(id)
  }

  // TODO変換
  const handleConvertToTask = async (data: {
    itemId: string
    date: string
    priority: Priority
    categoryId: string | null
  }) => {
    const item = items.find(i => i.id === data.itemId)
    if (!item) return

    await createTask({
      title: item.title,
      task_date: data.date,
      priority: data.priority,
      category_id: data.categoryId,
      memo: item.reason || undefined,
    })

    setConvertingItem(null)
  }

  // 編集開始
  const handleEditItem = (item: WishItem) => {
    setEditingItem(item)
    setIsItemFormOpen(true)
  }

  // フォームキャンセル
  const handleCancelItemForm = () => {
    setEditingItem(null)
    setIsItemFormOpen(false)
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ウィッシュリスト</h1>
          <p className="text-sm text-slate-500 mt-1">
            やりたいこと・欲しいものを管理
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tabs */}
        <WishListTabs
          lists={lists}
          activeListId={activeListId}
          onSelectList={setActiveListId}
          onCreateList={() => setIsCreateListModalOpen(true)}
          onEditList={setEditingList}
          onDeleteList={handleDeleteList}
          onReorderLists={reorderLists}
          loading={listsLoading}
        />

        {/* List Content */}
        {activeList && (
          <WishListContent
            items={filteredItems}
            isDefaultList={isDefaultList}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onCreateItem={handleCreateItem}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onToggleComplete={handleToggleComplete}
            onConvertToTask={setConvertingItem}
            onReorderItems={reorderItems}
            loading={itemsLoading}
          />
        )}

        {/* Empty State - No Lists */}
        {!listsLoading && lists.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-slate-500">リストがありません</p>
            <p className="text-sm text-slate-400 mt-1">
              リストを作成して始めましょう
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateListModal
        isOpen={isCreateListModalOpen}
        onClose={() => setIsCreateListModalOpen(false)}
        onSubmit={handleCreateList}
      />

      <EditListModal
        list={editingList}
        isOpen={!!editingList}
        onClose={() => setEditingList(null)}
        onSubmit={handleUpdateList}
      />

      <WishItemForm
        isDefaultList={isDefaultList}
        editingItem={editingItem}
        onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
        onCancel={handleCancelItemForm}
        isOpen={isItemFormOpen}
      />

      <ConvertToTaskModal
        item={convertingItem}
        isOpen={!!convertingItem}
        onClose={() => setConvertingItem(null)}
        onConvert={handleConvertToTask}
      />
    </div>
  )
}
