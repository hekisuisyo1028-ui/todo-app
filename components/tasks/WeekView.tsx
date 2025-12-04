'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MoreHorizontal, Pencil, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, formatDateISO, getDateLabel, isTodayDate } from '@/lib/utils'
import type { Task } from '@/types'
import { PRIORITY_CONFIG } from '@/types'

interface WeekDayColumnProps {
  date: Date
  tasks: Task[]
  onToggleComplete: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

function WeekDayColumn({ date, tasks, onToggleComplete, onEdit, onDelete }: WeekDayColumnProps) {
  const dateStr = formatDateISO(date)
  const isToday = isTodayDate(date)
  
  const { setNodeRef, isOver } = useDroppable({ id: dateStr })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-1 min-w-[180px] rounded-xl transition-all',
        isToday 
          ? 'bg-gradient-to-b from-blue-50 to-indigo-50 ring-2 ring-blue-200' 
          : 'bg-slate-50',
        isOver && 'ring-2 ring-blue-400 bg-blue-50'
      )}
    >
      {/* Day Header */}
      <div className={cn(
        'px-3 py-2 border-b',
        isToday ? 'border-blue-200' : 'border-slate-200'
      )}>
        <span className={cn(
          'text-sm font-semibold',
          isToday ? 'text-blue-700' : 'text-slate-700'
        )}>
          {getDateLabel(date)}
        </span>
        <span className="ml-2 text-xs text-slate-400">
          {tasks.length}件
        </span>
      </div>
      
      {/* Tasks */}
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="p-2 space-y-2 min-h-[120px]">
          {tasks.map((task) => (
            <WeekTaskItem
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          {tasks.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">
              タスクなし
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

interface WeekTaskItemProps {
  task: Task
  onToggleComplete: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

function WeekTaskItem({ task, onToggleComplete, onEdit, onDelete }: WeekTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityConfig = PRIORITY_CONFIG[task.priority]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 p-2.5 bg-white rounded-lg border border-slate-200 shadow-sm text-sm transition-all',
        isDragging && 'opacity-50 shadow-lg',
        task.is_completed && 'bg-slate-50 opacity-75'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none text-slate-300 hover:text-slate-400"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <button
        onClick={() => onToggleComplete(task.id)}
        className={cn(
          'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0',
          task.is_completed
            ? 'bg-blue-500 border-transparent'
            : 'border-slate-300 hover:border-blue-400'
        )}
      >
        {task.is_completed && <Check className="h-3 w-3 text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn(
            'truncate text-xs font-medium',
            task.is_completed && 'line-through text-slate-400'
          )}>
            {task.title}
          </span>
          <span className={cn(
            'w-2 h-2 rounded-full flex-shrink-0',
            task.priority === 'high' && 'bg-red-500',
            task.priority === 'medium' && 'bg-amber-500',
            task.priority === 'low' && 'bg-green-500',
          )} />
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 rounded-md"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(task)} className="cursor-pointer">
            <Pencil className="mr-2 h-3 w-3" />
            編集
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(task.id)} className="cursor-pointer text-red-600">
            <Trash2 className="mr-2 h-3 w-3" />
            削除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

interface WeekViewProps {
  dates: Date[]
  tasksByDate: Record<string, Task[]>
  onToggleComplete: (id: string) => Promise<void>
  onEdit: (task: Task) => void
  onDelete: (id: string) => Promise<void>
  onMoveTask: (taskId: string, newDate: string) => Promise<void>
}

export function WeekView({
  dates,
  tasksByDate,
  onToggleComplete,
  onEdit,
  onDelete,
  onMoveTask,
}: WeekViewProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string
    for (const tasks of Object.values(tasksByDate)) {
      const task = tasks.find(t => t.id === taskId)
      if (task) {
        setActiveTask(task)
        break
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string
    const isDateColumn = dates.some(d => formatDateISO(d) === overId)
    
    if (isDateColumn) {
      let currentDate = ''
      for (const [date, tasks] of Object.entries(tasksByDate)) {
        if (tasks.some(t => t.id === taskId)) {
          currentDate = date
          break
        }
      }

      if (currentDate !== overId) {
        await onMoveTask(taskId, overId)
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {dates.map((date) => {
          const dateStr = formatDateISO(date)
          return (
            <WeekDayColumn
              key={dateStr}
              date={date}
              tasks={tasksByDate[dateStr] || []}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )
        })}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="p-2.5 bg-white rounded-lg border-2 border-blue-400 shadow-xl text-sm">
            <span className="font-medium">{activeTask.title}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
