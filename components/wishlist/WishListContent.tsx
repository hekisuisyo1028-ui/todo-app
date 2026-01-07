'use client'

import { useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Sparkles } from 'lucide-react'
import { WishItem } from './WishItem'
import { WishItemInlineForm } from './WishItemForm'
import type { WishItem as WishItemType, WishList } from '@/types'

interface WishListContentProps {
  list: WishList | null
  items: WishItemType[]
  searchQuery: string
  onAddItem: (data: { title: string; reason: string }) => void
  onToggleComplete: (id: string) => void
  onEditItem: (item: WishItemType) => void
  onDeleteItem: (id: string) => void
  onConvertToTask: (item: WishItemType) => void
  onReorderItems: (items: WishItemType[]) => void
}

export function WishListContent({
  list,
  items,
  searchQuery,
  onAddItem,
  onToggleComplete,
  onEditItem,
  onDeleteItem,
  onConvertToTask,
  onReorderItems,
}: WishListContentProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 検索フィルタリング
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    const query = searchQuery.toLowerCase()
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        (item.reason && item.reason.toLowerCase().includes(query))
    )
  }, [items, searchQuery])

  // 未完了・完了済みに分離
  const { activeItems, completedItems } = useMemo(() => {
    const active = filteredItems.filter((item) => !item.is_completed)
    const completed = filteredItems.filter((item) => item.is_completed)
    return {
      activeItems: active.sort((a, b) => a.sort_order - b.sort_order),
      completedItems: completed.sort((a, b) => a.sort_order - b.sort_order),
    }
  }, [filteredItems])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const allItems = [...activeItems, ...completedItems]
      const oldIndex = allItems.findIndex((item) => item.id === active.id)
      const newIndex = allItems.findIndex((item) => item.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(allItems, oldIndex, newIndex)
        onReorderItems(reordered)
      }
    }
  }

  if (!list) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <Sparkles className="h-12 w-12 mb-4" />
        <p>リストを選択してください</p>
      </div>
    )
  }

  const isDefaultList = list.is_default

  return (
    <div className="flex flex-col h-full">
      {/* インライン追加フォーム */}
      <WishItemInlineForm
        isDefaultList={isDefaultList}
        onSubmit={onAddItem}
      />

      {/* アイテム一覧 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-y-auto">
          {/* 未完了アイテム */}
          {activeItems.length > 0 ? (
            <SortableContext
              items={activeItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {activeItems.map((item) => (
                <WishItem
                  key={item.id}
                  item={item}
                  isDefaultList={isDefaultList}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEditItem}
                  onDelete={onDeleteItem}
                  onConvertToTask={onConvertToTask}
                />
              ))}
            </SortableContext>
          ) : (
            !searchQuery && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Sparkles className="h-10 w-10 mb-3" />
                <p className="text-sm">
                  {isDefaultList
                    ? 'ウィッシュを追加してみましょう'
                    : 'やりたいことを追加してみましょう'}
                </p>
              </div>
            )
          )}

          {/* 検索結果なし */}
          {searchQuery && filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <p className="text-sm">「{searchQuery}」に一致するアイテムはありません</p>
            </div>
          )}

          {/* 完了済みアイテム */}
          {completedItems.length > 0 && (
            <div className="mt-4">
              <div className="px-4 py-2 text-sm font-medium text-slate-500 bg-slate-50 border-y border-slate-100">
                完了済み ({completedItems.length})
              </div>
              <SortableContext
                items={completedItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {completedItems.map((item) => (
                  <WishItem
                    key={item.id}
                    item={item}
                    isDefaultList={isDefaultList}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEditItem}
                    onDelete={onDeleteItem}
                    onConvertToTask={onConvertToTask}
                  />
                ))}
              </SortableContext>
            </div>
          )}
        </div>
      </DndContext>
    </div>
  )
}
