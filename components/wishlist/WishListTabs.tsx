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
import { Plus, Lock, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
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
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}

function SortableTab({ list, isActive, onClick, onEdit, onDelete }: SortableTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: list.id,
    disabled: list.is_default, // ウィッシュリストはドラッグ不可
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center gap-1 px-4 py-2 rounded-t-lg border-b-2 transition-all cursor-pointer select-none',
        isActive
          ? 'bg-white border-purple-500 text-purple-700'
          : 'bg-slate-100 border-transparent text-slate-600 hover:bg-slate-200',
        isDragging && 'opacity-50 z-50',
        !list.is_default && 'cursor-grab active:cursor-grabbing'
      )}
      {...(list.is_default ? {} : { ...attributes, ...listeners })}
      onClick={onClick}
    >
      {list.is_default && (
        <Lock className="h-3 w-3 text-slate-400 mr-1" />
      )}
      <span className="font-medium whitespace-nowrap">{list.title}</span>
      
      {/* 編集・削除メニュー（デフォルトリスト以外） */}
      {!list.is_default && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className="cursor-pointer"
            >
              <Pencil className="mr-2 h-4 w-4" />
              名前を変更
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

interface WishListTabsProps {
  lists: WishList[]
  activeListId: string | null
  onSelectList: (id: string) => void
  onReorderLists: (lists: WishList[]) => void
  onCreateList: () => void
  onEditList: (list: WishList) => void
  onDeleteList: (list: WishList) => void
}

export function WishListTabs({
  lists,
  activeListId,
  onSelectList,
  onReorderLists,
  onCreateList,
  onEditList,
  onDeleteList,
}: WishListTabsProps) {
  const [deleteTarget, setDeleteTarget] = useState<WishList | null>(null)

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = lists.findIndex((list) => list.id === active.id)
      const newIndex = lists.findIndex((list) => list.id === over.id)
      
      // デフォルトリストは常に先頭に固定
      const defaultList = lists.find((l) => l.is_default)
      if (defaultList) {
        const nonDefaultLists = lists.filter((l) => !l.is_default)
        const reorderedNonDefault = arrayMove(
          nonDefaultLists,
          nonDefaultLists.findIndex((l) => l.id === active.id),
          nonDefaultLists.findIndex((l) => l.id === over.id)
        )
        onReorderLists([defaultList, ...reorderedNonDefault])
      } else {
        onReorderLists(arrayMove(lists, oldIndex, newIndex))
      }
    }
  }

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDeleteList(deleteTarget)
      setDeleteTarget(null)
    }
  }

  // デフォルトリストを先頭に、その他はsort_order順
  const sortedLists = [...lists].sort((a, b) => {
    if (a.is_default) return -1
    if (b.is_default) return 1
    return a.sort_order - b.sort_order
  })

  return (
    <>
      <div className="flex items-center gap-1 overflow-x-auto pb-0 border-b border-slate-200">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedLists.map((l) => l.id)}
            strategy={horizontalListSortingStrategy}
          >
            {sortedLists.map((list) => (
              <SortableTab
                key={list.id}
                list={list}
                isActive={list.id === activeListId}
                onClick={() => onSelectList(list.id)}
                onEdit={() => onEditList(list)}
                onDelete={() => setDeleteTarget(list)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* 新規リスト追加ボタン */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCreateList}
          className="flex items-center gap-1 px-3 py-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg ml-2"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">追加</span>
        </Button>
      </div>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>リストを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteTarget?.title}」とその中のすべてのアイテムが削除されます。
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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
