'use client'

import { useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BookOpen, ClipboardList, Grip, Pencil } from 'lucide-react'

import type { CourseItem } from '@/lib/exercises/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CourseItemsListProps {
  items: CourseItem[]
  onReorder: (
    updateData: { kind: 'chapter' | 'exercise'; id: string; position: number }[],
  ) => void
  onEdit: (kind: 'chapter' | 'exercise', id: string) => void
}

function SortableCourseItem({
  item,
  onEdit,
}: {
  item: CourseItem
  onEdit: (kind: 'chapter' | 'exercise', id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const Icon = item.kind === 'chapter' ? BookOpen : ClipboardList

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'border-border/50 bg-muted/20 text-foreground mb-1.5 flex items-center gap-x-2 rounded-md border text-sm last:mb-0',
        item.isPublished && 'bg-primary/5 border-primary/25 text-primary',
        isDragging && 'z-10 opacity-50 shadow-lg',
      )}
    >
      <button
        type="button"
        className={cn(
          'hover:bg-muted flex cursor-grab items-center justify-center rounded-l-md border-r border-border px-2 py-3 transition active:cursor-grabbing',
          item.isPublished ? 'border-r-primary/20' : '',
        )}
        {...attributes}
        {...listeners}
      >
        <Grip className="h-5 w-5" />
      </button>
      <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{item.title}</span>
      <div className="ml-auto flex shrink-0 items-center gap-x-2 pr-3">
        <Badge variant="outline" className="text-xs">
          {item.kind === 'chapter' ? 'Kapitel' : 'Aufgabe'}
        </Badge>
        {item.isFree && (
          <Badge variant="secondary" className="text-xs">
            Kostenlos
          </Badge>
        )}
        <Badge
          className={cn(
            'text-xs',
            item.isPublished ? 'bg-primary' : 'bg-muted-foreground/30',
          )}
        >
          {item.isPublished ? 'Veröffentlicht' : 'Entwurf'}
        </Badge>
        <button
          type="button"
          onClick={() => onEdit(item.kind, item.id)}
          className="hover:bg-muted rounded p-1 transition"
          aria-label="Bearbeiten"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function CourseItemsList({
  items,
  onReorder,
  onEdit,
}: CourseItemsListProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [list, setList] = useState(items)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    setList(items)
  }, [items])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setList((current) => {
      const oldIndex = current.findIndex((i) => i.id === active.id)
      const newIndex = current.findIndex((i) => i.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return current

      const reordered = arrayMove(current, oldIndex, newIndex)
      onReorder(
        reordered.map((item, index) => ({
          kind: item.kind,
          id: item.id,
          position: index + 1,
        })),
      )
      return reordered
    })
  }

  if (!isMounted) {
    return (
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-muted/50 border-border mb-2 flex items-center gap-2 rounded-md border p-3 text-sm"
          >
            <span className="flex-1 truncate">{item.title}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={list.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div>
          {list.map((item) => (
            <SortableCourseItem key={item.id} item={item} onEdit={onEdit} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
