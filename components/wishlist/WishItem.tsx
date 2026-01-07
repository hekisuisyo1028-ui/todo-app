'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  GripVertical, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Check, 
  ChevronDown, 
  ChevronRight,
  CalendarPlus 
} from 'lucide-react'
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
import type { WishItem as WishItemType } from '@/types'

interface WishItemProps {
  item: WishItemType
  isDefaultList: boolean // ウィッシュリスト（理由必須）かどうか
  onToggleComplete: (id: string) => void
  onEdit: (item: WishItemType) => void
  onDelete: (id: string) => void
  onConvertToTask: (item: WishItemType) => void
  isDragging?: boolean
}

export function WishItem({
  item,
  isDefaultList,
  onToggleComplete,
  onEdit,
  onDelete,
  onConvertToTask,
  isDragging = false,
}: WishItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isReasonExpanded, setIsReasonExpanded] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const hasReason = item.reason && item.reason.trim().length > 0

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group flex flex-col p-4 border-b border-slate-100 last:border-b-0 transition-all bg-white',
          isDragging && 'opacity-50',
          item.is_completed && 'bg-slate-50'
        )}
      >
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none text-slate-300 hover:text-slate-400 transition-colors"
          >
            <GripVertical className="h-5 w-5" />
          </button>

          {/* Custom Checkbox */}
          <button
            onClick={() => onToggleComplete(item.id)}
            className={cn(
              'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0',
              item.is_completed
                ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-transparent'
                : 'border-slate-300 hover:border-purple-400'
            )}
          >
            {item.is_completed && (
              <Check className="h-4 w-4 text-white" />
            )}
          </button>

          {/* Item Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'font-medium transition-all',
                  item.is_completed && 'line-through text-slate-400'
                )}
              >
                {item.title}
              </span>
            </div>
          </div>

          {/* Reason Toggle Button */}
          {hasReason && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReasonExpanded(!isReasonExpanded)}
              className="h-8 px-2 text-slate-400 hover:text-slate-600"
            >
              {isReasonExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span className="ml-1 text-xs">理由</span>
            </Button>
          )}

          {/* Convert to Task Button */}
          {!item.is_completed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onConvertToTask(item)}
              className="h-8 px-2 text-purple-500 hover:text-purple-700 hover:bg-purple-50"
              title="TODOに追加"
            >
              <CalendarPlus className="h-4 w-4" />
            </Button>
          )}

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(item)} className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                編集
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onConvertToTask(item)} 
                className="cursor-pointer"
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                TODOに追加
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Expandable Reason */}
        {hasReason && isReasonExpanded && (
          <div className="mt-3 ml-14 pl-3 border-l-2 border-purple-200">
            <p className={cn(
              'text-sm text-slate-600',
              item.is_completed && 'text-slate-400'
            )}>
              {item.reason}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>アイテムを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{item.title}」を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(item.id)}
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
