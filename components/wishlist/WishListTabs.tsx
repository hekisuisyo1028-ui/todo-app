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
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, MoreHorizontal, Pencil, Trash2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import type { WishList } from '@/types'

interface SortableTabProps {
  list: WishList
  isActive: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

function SortableTab({ list, isActive, onSelect, onEdit, onDelete }: SortableTabProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    disabled: list.is_default, // デフォルトリストはドラッグ不可
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group flex items-center gap-1 px-4 py-2 rounded-t-lg border-b-2 transition-all cursor-pointer select-none',
          isActive
            ? 'bg-white border-purple-500 text-purple-700'
            : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100',
          isDragging && 'opacity-50'
        )}
        onClick={onSelect}
        {...(list.is_default ? {} : { ...attributes, ...listeners })}
      >
        <span className="font-medium whitespace-nowrap">{list.title}</span>
        
        {list.is_default && (
          <Lock className="h-3 w-3 text-slate-400 ml-1" />
        )}

        {!list.is_default && isActive && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Pencil className="mr-2 h-4 w-4" />
                名前を変更
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>リストを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{list.title}」とその中のすべてのアイテムが削除されます。
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-red-600 hover:bg-red-700 rounded-xl"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface WishListTabsProps {
  lists: WishList[]
  activeListId: string | null
  onSelectList: (id: string) => void
  onCreateList: () => void
  onEditList: (list: WishList) => void
  onDeleteList: (id: string) => void
  onReorderLists: (reorderedLists: WishList[]) => void
  loading: boolean
}

export function WishListTabs({
  lists,
  activeListId,
  onSelectList,
  onCreateList,
  onEditList,
  onDeleteList,
  onReorderLists,
  loading,
}: WishListTabsProps) {
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

  // デフォルトリストを先頭に固定
  const defaultList = lists.find(l => l.is_default)
  const customLists = lists.filter(l => !l.is_default).sort((a, b) => a.sort_order - b.sort_order)
  const sortedLists = defaultList ? [defaultList, ...customLists] : customLists

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = customLists.findIndex(list => list.id === active.id)
      const newIndex = customLists.findIndex(list => list.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newCustomLists = arrayMove(customLists, oldIndex, newIndex)
        const updatedLists = newCustomLists.map((list, index) => ({
          ...list,
          sort_order: index + 1, // デフォルトリストが0なので1から開始
        }))
        onReorderLists(defaultList ? [defaultList, ...updatedLists] : updatedLists)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 border-b border-slate-200 overflow-x-auto">
        <div className="h-10 w-32 bg-slate-200 animate-pulse rounded-lg"></div>
        <div className="h-10 w-24 bg-slate-100 animate-pulse rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 px-4 pt-4 border-b border-slate-200 overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={customLists.map(list => list.id)}
          strategy={horizontalListSortingStrategy}
        >
          {sortedLists.map(list => (
            <SortableTab
              key={list.id}
              list={list}
              isActive={list.id === activeListId}
              onSelect={() => onSelectList(list.id)}
              onEdit={() => onEditList(list)}
              onDelete={() => onDeleteList(list.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add List Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onCreateList}
        className="flex items-center gap-1 px-3 py-2 text-slate-500 hover:text-slate-700 whitespace-nowrap"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">リスト追加</span>
      </Button>
    </div>
  )
}
