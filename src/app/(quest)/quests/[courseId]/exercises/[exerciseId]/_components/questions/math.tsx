'use client'

import { useEffect, useRef } from 'react'

export function MathInput({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (latex: string) => void
  disabled?: boolean
}) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      await import('mathlive')
      if (!mounted || !ref.current) return
      const el = ref.current as HTMLElement & {
        value?: string
        addEventListener?: (e: string, fn: () => void) => void
      }
      if ('math-field' in customElements) {
        const field = document.createElement('math-field') as HTMLElement & {
          value: string
        }
        field.style.width = '100%'
        field.style.minHeight = '48px'
        if (disabled) field.setAttribute('read-only', '')
        field.value = value
        field.addEventListener('input', () => {
          onChange((field as { value: string }).value)
        })
        ref.current.innerHTML = ''
        ref.current.appendChild(field)
      }
    })()
    return () => {
      mounted = false
    }
  }, [disabled])

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="border-border/50 min-h-[48px] rounded-md border p-2"
    />
  )
}
