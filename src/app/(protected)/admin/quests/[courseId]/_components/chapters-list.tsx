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
import { Grip, Pencil } from 'lucide-react'

import type { Chapter } from '@/generated/client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ChaptersListProps {
  items: Chapter[]
  onReorder: (updateData: { id: string; position: number }[]) => void
  onEdit: (id: string) => void
}

function SortableChapterItem({
  chapter,
  onEdit,
}: {
  chapter: Chapter
  onEdit: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'border-border/50 bg-muted/20 text-foreground mb-1.5 flex items-center gap-x-2 rounded-md border text-sm last:mb-0',
        chapter.isPublished && 'bg-primary/5 border-primary/25 text-primary',
        isDragging && 'opacity-50 shadow-lg z-10'
      )}
    >
      <button
        type="button"
        className={cn(
          'flex items-center justify-center px-2 py-3 rounded-l-md border-r border-border cursor-grab active:cursor-grabbing',
          'hover:bg-muted transition',
          chapter.isPublished ? 'border-r-primary/20' : ''
        )}
        {...attributes}
        {...listeners}
      >
        <Grip className="h-5 w-5" />
      </button>
      <span className="flex-1 truncate">{chapter.title}</span>
      <div className="ml-auto pr-3 flex items-center gap-x-2 shrink-0">
        {chapter.isFree && (
          <Badge variant="secondary" className="text-xs">
            Kostenlos
          </Badge>
        )}
        <Badge
          className={cn(
            'text-xs',
            chapter.isPublished ? 'bg-primary' : 'bg-muted-foreground/30'
          )}
        >
          {chapter.isPublished ? 'Veröffentlicht' : 'Entwurf'}
        </Badge>
        <button
          type="button"
          onClick={() => onEdit(chapter.id)}
          className="p-1 rounded hover:bg-muted transition"
          aria-label="Kapitel bearbeiten"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function ChaptersList({ items, onReorder, onEdit }: ChaptersListProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [chapters, setChapters] = useState(items)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    setChapters(items)
  }, [items])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    setChapters((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      if (oldIndex === -1 || newIndex === -1) return items

      const reordered = arrayMove(items, oldIndex, newIndex)

      const startIndex = Math.min(oldIndex, newIndex)
      const endIndex = Math.max(oldIndex, newIndex)
      const updatedChapters = reordered.slice(startIndex, endIndex + 1)

      onReorder(
        updatedChapters.map((chapter) => ({
          id: chapter.id,
          position: reordered.findIndex((item) => item.id === chapter.id),
        }))
      )

      return reordered
    })
  }

  if (!isMounted) {
    return (
      <div className="space-y-4">
        {items.map((chapter) => (
          <div
            key={chapter.id}
            className={cn(
              'flex items-center gap-x-2 rounded-md border mb-4 text-sm p-3',
              'bg-muted/50 border-border'
            )}
          >
            <div className="w-9 h-9 rounded flex items-center justify-center bg-muted">
              <Grip className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="flex-1 truncate">{chapter.title}</span>
            <Badge variant="secondary" className="text-xs">
              {chapter.isPublished ? 'Veröffentlicht' : 'Entwurf'}
            </Badge>
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
        items={chapters.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-0">
          {chapters.map((chapter) => (
            <SortableChapterItem
              key={chapter.id}
              chapter={chapter}
              onEdit={onEdit}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
