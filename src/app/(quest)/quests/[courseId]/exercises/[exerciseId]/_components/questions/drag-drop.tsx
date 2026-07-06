'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { DragDropSpec } from '@/lib/exercises/types'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export function DragDropInput({
  spec,
  value,
  onChange,
  disabled,
}: {
  spec: DragDropSpec
  value: { order?: string[]; pairs?: Record<string, string> }
  onChange: (v: { order?: string[]; pairs?: Record<string, string> }) => void
  disabled?: boolean
}) {
  const [order, setOrder] = useState<string[]>(
    value.order ?? spec.items.map((i) => i.id),
  )

  const move = (from: number, to: number) => {
    if (disabled || to < 0 || to >= order.length) return
    const next = [...order]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setOrder(next)
    onChange({ order: next })
  }

  if (spec.mode === 'matching') {
    const pairs = value.pairs ?? {}
    const targets = spec.targets ?? []

    if (targets.length === 0) {
      return (
        <p className="text-muted-foreground text-sm">
          Diese Aufgabe ist noch nicht vollständig eingerichtet (keine Ziele).
        </p>
      )
    }

    return (
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm">
          Ordne jeden Begriff dem passenden Ziel zu.
        </p>
        <div className="hidden gap-4 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[1fr_auto_1fr]">
          <span>Begriff</span>
          <span />
          <span>Ziel</span>
        </div>
        {spec.items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'border-border/50 bg-muted/10 grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-3',
              disabled && 'opacity-60',
            )}
          >
            <Label className="text-sm font-medium leading-snug sm:font-normal">
              {item.label}
            </Label>
            <ArrowRight
              className="text-muted-foreground hidden size-4 sm:block"
              aria-hidden
            />
            <Select
              value={pairs[item.id] || undefined}
              onValueChange={(targetId) =>
                onChange({ pairs: { ...pairs, [item.id]: targetId } })
              }
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
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
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Bringe die Elemente in die richtige Reihenfolge (↑ / ↓).
      </p>
      {order.map((id, index) => {
        const item = spec.items.find((i) => i.id === id)
        if (!item) return null
        return (
          <div
            key={id}
            className={cn(
              'border-border/50 flex items-center justify-between rounded-md border px-3 py-2',
              disabled && 'opacity-60',
            )}
          >
            <span className="font-medium">{item.label}</span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={disabled || index === 0}
                onClick={() => move(index, index - 1)}
                className="hover:bg-muted rounded px-2 py-1 text-xs"
                aria-label="Nach oben"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={disabled || index === order.length - 1}
                onClick={() => move(index, index + 1)}
                className="hover:bg-muted rounded px-2 py-1 text-xs"
                aria-label="Nach unten"
              >
                ↓
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
