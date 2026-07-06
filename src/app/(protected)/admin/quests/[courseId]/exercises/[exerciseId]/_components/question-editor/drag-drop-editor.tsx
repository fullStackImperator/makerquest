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
import { ArrowRight, Grip, Plus, Trash2 } from 'lucide-react'
import type { ExerciseQuestion } from '@/generated/client'
import type { DragDropSpec, DragDropSolution } from '@/lib/exercises/types'
import { QuestionEditorShell } from './question-editor-shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function SortableOrderRow({
  id,
  label,
  onLabelChange,
  onRemove,
  canRemove,
}: {
  id: string
  label: string
  onLabelChange: (label: string) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'border-border/50 bg-muted/20 flex items-center gap-2 rounded-md border p-2',
        isDragging && 'opacity-60 shadow-md',
      )}
    >
      <button
        type="button"
        className="text-muted-foreground hover:bg-muted cursor-grab rounded p-1 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <Grip className="size-4" />
      </button>
      <Input
        value={label}
        onChange={(e) => onLabelChange(e.target.value)}
        className="flex-1"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label="Entfernen"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}

export function DragDropEditor({
  question,
  courseId,
  exerciseId,
}: {
  question: ExerciseQuestion
  courseId: string
  exerciseId: string
}) {
  const spec = question.spec as DragDropSpec
  const solution = question.solution as DragDropSolution

  const [mode, setMode] = useState<'matching' | 'ordering'>(
    spec.mode ?? 'ordering',
  )
  const [items, setItems] = useState(spec.items)
  const [targets, setTargets] = useState(spec.targets ?? [])
  const [order, setOrder] = useState(
    'order' in solution ? solution.order : items.map((i) => i.id),
  )
  const [pairs, setPairs] = useState(
    'pairs' in solution ? solution.pairs : ({} as Record<string, string>),
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    if (mode === 'matching' && targets.length === 0) {
      const t1 = newId('ziel')
      const t2 = newId('ziel')
      setTargets([
        { id: t1, label: 'Ziel 1' },
        { id: t2, label: 'Ziel 2' },
      ])
    }
  }, [mode, targets.length])

  const onSaveSpec = async () => {
    if (mode === 'ordering') {
      return {
        spec: JSON.stringify({ mode, items }),
        solution: JSON.stringify({ order }),
      }
    }
    return {
      spec: JSON.stringify({ mode, items, targets }),
      solution: JSON.stringify({ pairs }),
    }
  }

  const addItem = () => {
    const id = newId('item')
    setItems([...items, { id, label: 'Neuer Begriff' }])
    setOrder([...order, id])
  }

  const addTarget = () => {
    setTargets([...targets, { id: newId('ziel'), label: 'Neues Ziel' }])
  }

  const removeItem = (id: string) => {
    if (items.length <= 2) return
    setItems(items.filter((i) => i.id !== id))
    setOrder(order.filter((oid) => oid !== id))
    const nextPairs = { ...pairs }
    delete nextPairs[id]
    setPairs(nextPairs)
  }

  const removeTarget = (id: string) => {
    if (targets.length <= 2) return
    setTargets(targets.filter((t) => t.id !== id))
    setPairs(
      Object.fromEntries(
        Object.entries(pairs).map(([itemId, targetId]) => [
          itemId,
          targetId === id ? '' : targetId,
        ]),
      ),
    )
  }

  const handleOrderDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setOrder((current) => {
      const oldIndex = current.indexOf(String(active.id))
      const newIndex = current.indexOf(String(over.id))
      if (oldIndex === -1 || newIndex === -1) return current
      return arrayMove(current, oldIndex, newIndex)
    })
  }

  const handleModeChange = (v: 'matching' | 'ordering') => {
    setMode(v)
    if (v === 'ordering') {
      setOrder(items.map((i) => i.id))
    } else if (targets.length === 0) {
      const t1 = newId('ziel')
      const t2 = newId('ziel')
      setTargets([
        { id: t1, label: 'Ziel 1' },
        { id: t2, label: 'Ziel 2' },
      ])
    }
  }

  const orderedItems = order
    .map((id) => items.find((i) => i.id === id))
    .filter(Boolean) as { id: string; label: string }[]

  return (
    <QuestionEditorShell
      question={question}
      courseId={courseId}
      exerciseId={exerciseId}
      onSaveSpec={onSaveSpec}
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Aufgabentyp</Label>
          <Select value={mode} onValueChange={handleModeChange}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ordering">
                Reihenfolge — Elemente in die richtige Reihenfolge bringen
              </SelectItem>
              <SelectItem value="matching">
                Zuordnung — Begriffe den richtigen Zielen zuordnen
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {mode === 'ordering' && (
          <div className="space-y-3">
            <div>
              <Label>Elemente (Reihenfolge = Lösung)</Label>
              <p className="text-muted-foreground mt-1 text-xs">
                Ziehe die Zeilen per Griff-Symbol. Die Reihenfolge hier ist die
                korrekte Lösung für die Schülerinnen und Schüler.
              </p>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleOrderDragEnd}
            >
              <SortableContext
                items={order}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {orderedItems.map((item) => (
                    <SortableOrderRow
                      key={item.id}
                      id={item.id}
                      label={item.label}
                      onLabelChange={(label) =>
                        setItems(
                          items.map((it) =>
                            it.id === item.id ? { ...it, label } : it,
                          ),
                        )
                      }
                      onRemove={() => removeItem(item.id)}
                      canRemove={items.length > 2}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-1 size-4" />
              Element hinzufügen
            </Button>
          </div>
        )}

        {mode === 'matching' && (
          <>
            <div className="space-y-3">
              <div>
                <Label>Ziele (rechte Spalte für SuS)</Label>
                <p className="text-muted-foreground mt-1 text-xs">
                  z. B. Kategorien, Definitionen oder Antworten, denen Begriffe
                  zugeordnet werden.
                </p>
              </div>
              {targets.map((target) => (
                <div key={target.id} className="flex gap-2">
                  <Input
                    value={target.label}
                    placeholder="z. B. „Photosynthese“"
                    onChange={(e) =>
                      setTargets(
                        targets.map((t) =>
                          t.id === target.id
                            ? { ...t, label: e.target.value }
                            : t,
                        ),
                      )
                    }
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTarget(target.id)}
                    disabled={targets.length <= 2}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTarget}
              >
                <Plus className="mr-1 size-4" />
                Ziel hinzufügen
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Begriffe (linke Spalte für SuS)</Label>
                <p className="text-muted-foreground mt-1 text-xs">
                  Was die Lernenden einem Ziel zuordnen sollen.
                </p>
              </div>
              {items.map((item) => (
                <div key={item.id} className="flex gap-2">
                  <Input
                    value={item.label}
                    placeholder="z. B. „Chlorophyll“"
                    onChange={(e) =>
                      setItems(
                        items.map((it) =>
                          it.id === item.id
                            ? { ...it, label: e.target.value }
                            : it,
                        ),
                      )
                    }
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length <= 2}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-1 size-4" />
                Begriff hinzufügen
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Richtige Zuordnung</Label>
                <p className="text-muted-foreground mt-1 text-xs">
                  Wähle für jeden Begriff das passende Ziel — keine IDs nötig.
                </p>
              </div>
              <div className="border-border/50 space-y-2 rounded-lg border p-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <span className="min-w-0 flex-1 text-sm font-medium">
                      {item.label || '(ohne Text)'}
                    </span>
                    <ArrowRight className="text-muted-foreground hidden size-4 shrink-0 sm:block" />
                    <Select
                      value={pairs[item.id] || undefined}
                      onValueChange={(targetId) =>
                        setPairs({ ...pairs, [item.id]: targetId })
                      }
                    >
                      <SelectTrigger className="w-full sm:w-56">
                        <SelectValue placeholder="Ziel wählen…" />
                      </SelectTrigger>
                      <SelectContent>
                        {targets.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </QuestionEditorShell>
  )
}
