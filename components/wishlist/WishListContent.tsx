'use client'

import { useState } from 'react'
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
import { ChevronDown, ChevronRight } from 'lucide-react'
import { WishItem } from './WishItem'
import { WishItemInlineForm } from './WishItemForm'
import { WishListSearch } from './WishListSearch'
import { cn } from '@/lib/utils'
import type { WishItem as WishItemType } from '@/types'

interface WishListContentProps {
  items: WishItemType[]
  isDefaultList: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onCreateItem: (data: { title: string; reason: string }) => void
  onEditItem: (item: WishItemType) => void
  onDeleteItem: (id: string) => void
  onToggleComplete: (id: string) => void
  onConvertToTask: (item: WishItemType) => void
  onReorderItems: (reorderedItems: WishItemType[]) => void
  loading: boolean
}

export function WishListContent({
  items,
  isDefaultList,
  searchQuery,
  onSearchChange,
  onCreateItem,
  onEditItem,
  onDeleteItem,
  onToggleComplete,
  onConvertToTask,
  onReorderItems,
  loading,
}: WishListContentProps) {
  const [showCompleted, setShowCompleted] = useState(true)

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

  // 未完了・完了で分離
  const incompleteItems = items.filter(item => !item.is_completed)
  const completedItems = items.filter(item => item.is_completed)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = incompleteItems.findIndex(item => item.id === active.id)
      const newIndex = incompleteItems.findIndex(item => item.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newIncompleteItems = arrayMove(incompleteItems, oldIndex, newIndex)
        // sort_orderを更新
        const updatedItems = newIncompleteItems.map((item, index) => ({
          ...item,
          sort_order: index,
        }))
        onReorderItems([...updatedItems, ...completedItems])
      }
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-slate-500">読み込み中...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Search */}
      <div className="p-4 border-b border-slate-100">
        <WishListSearch value={searchQuery} onChange={onSearchChange} />
      </div>

      {/* Add Item Form */}
      <WishItemInlineForm
        isDefaultList={isDefaultList}
        onSubmit={onCreateItem}
      />

      {/* Incomplete Items */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={incompleteItems.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {incompleteItems.map(item => (
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
      </DndContext>

      {/* Empty State */}
      {incompleteItems.length === 0 && !searchQuery && (
        <div className="p-8 text-center text-slate-400">
          <p>アイテムがありません</p>
          <p className="text-sm mt-1">上のフォームから追加してください</p>
        </div>
      )}

      {/* No Search Results */}
      {incompleteItems.length === 0 && searchQuery && (
        <div className="p-8 text-center text-slate-400">
          <p>「{searchQuery}」に一致するアイテムがありません</p>
        </div>
      )}

      {/* Completed Items */}
      {completedItems.length > 0 && (
        <div className="border-t border-slate-200">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full px-4 py-3 flex items-center gap-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
          >
            {showCompleted ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            完了済み ({completedItems.length})
          </button>

          {showCompleted && (
            <div className="bg-slate-50">
              {completedItems.map(item => (
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
            </div>
          )}
        </div>
      )}
    </div>
  )
}
