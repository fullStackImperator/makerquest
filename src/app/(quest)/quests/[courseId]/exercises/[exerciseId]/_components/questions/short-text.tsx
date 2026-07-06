'use client'

import type { ShortTextSpec } from '@/lib/exercises/types'
import { Textarea } from '@/components/ui/textarea'

export function ShortTextInput({
  spec,
  value,
  onChange,
  disabled,
}: {
  spec: ShortTextSpec
  value: string
  onChange: (text: string) => void
  disabled?: boolean
}) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      maxLength={spec.maxLength}
      rows={4}
      placeholder="Deine Antwort…"
    />
  )
}
