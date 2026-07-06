'use client'

import { useMemo } from 'react'
import type { McSingleSpec } from '@/lib/exercises/types'
import { shuffleOptionsWithSeed } from '@/lib/exercises/shuffle-options'
import { cn } from '@/lib/utils'

export function McSingleInput({
  questionId,
  spec,
  value,
  onChange,
  disabled,
}: {
  questionId: string
  spec: McSingleSpec
  value: string | undefined
  onChange: (optionId: string) => void
  disabled?: boolean
}) {
  const options = useMemo(() => {
    if (!spec.shuffle) return spec.options
    return shuffleOptionsWithSeed(spec.options, questionId)
  }, [spec.options, spec.shuffle, questionId])

  const groupName = `mc-${questionId}`

  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt.id}
          className={cn(
            'border-border/50 flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2',
            value === opt.id && 'border-primary bg-primary/5',
            disabled && 'pointer-events-none opacity-60',
          )}
        >
          <input
            type="radio"
            name={groupName}
            checked={value === opt.id}
            onChange={() => onChange(opt.id)}
            disabled={disabled}
            className="size-4"
          />
          <span className="flex-1">{opt.label}</span>
        </label>
      ))}
    </div>
  )
}
