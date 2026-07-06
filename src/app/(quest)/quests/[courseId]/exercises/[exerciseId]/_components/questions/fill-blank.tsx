'use client'

import type { FillBlankSpec } from '@/lib/exercises/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function FillBlankInput({
  spec,
  values,
  onChange,
  disabled,
}: {
  spec: FillBlankSpec
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-3">
      {spec.blanks.map((blank) => (
        <div key={blank.id}>
          <Label className="text-sm">Lücke {blank.id}</Label>
          <Input
            value={values[blank.id] ?? ''}
            onChange={(e) =>
              onChange({ ...values, [blank.id]: e.target.value })
            }
            disabled={disabled}
            placeholder="Antwort…"
          />
        </div>
      ))}
    </div>
  )
}
