import { Minus, Plus } from 'lucide-react'
import type { LexicalEditor } from 'lexical'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const MIN_ALLOWED_FONT_SIZE = 8
const MAX_ALLOWED_FONT_SIZE = 72

export const FontSizePicker = ({
  fontSize,
  updateFontSize,
}: {
  fontSize: string
  updateFontSize: (fontSize: number) => void
}): React.ReactElement => {
  const current = parseInt(fontSize, 10) || 15

  const increaseFontSize = useCallback(() => {
    let updated = current
    if (current < MIN_ALLOWED_FONT_SIZE) updated = MIN_ALLOWED_FONT_SIZE
    else if (current < 12) updated += 1
    else if (current < 20) updated += 2
    else if (current < 36) updated += 4
    else if (current <= 60) updated += 12
    else updated = MAX_ALLOWED_FONT_SIZE
    updateFontSize(updated)
  }, [current, updateFontSize])

  const decreaseFontSize = useCallback(() => {
    let updated = current
    if (current > MAX_ALLOWED_FONT_SIZE) updated = MAX_ALLOWED_FONT_SIZE
    else if (current >= 48) updated -= 12
    else if (current >= 24) updated -= 4
    else if (current >= 14) updated -= 2
    else if (current >= 9) updated -= 1
    else updated = MIN_ALLOWED_FONT_SIZE
    updateFontSize(updated)
  }, [current, updateFontSize])

  return (
    <div
      className="flex items-center border border-input rounded-md shadow-xs bg-transparent [&_button]:rounded-none"
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={current <= MIN_ALLOWED_FONT_SIZE}
        onClick={(e) => {
          e.stopPropagation()
          decreaseFontSize()
        }}
        className="h-8 w-10 rounded-r-none border-0 border-r border-input hover:bg-accent"
        aria-label="Decrease font size"
      >
        <Minus className="size-4" />
      </Button>
      <Input
        type="number"
        min={MIN_ALLOWED_FONT_SIZE}
        max={MAX_ALLOWED_FONT_SIZE}
        value={current}
        onChange={(e) => {
          const n = parseInt(e.target.value || '0', 10) % 100
          updateFontSize(n)
          e.target.focus()
        }}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') e.stopPropagation()
        }}
        className={cn(
          'h-8 w-12 rounded-none border-0 border-r border-input text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
        )}
        onClick={(e) => e.stopPropagation()}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={current >= MAX_ALLOWED_FONT_SIZE}
        onClick={(e) => {
          e.stopPropagation()
          increaseFontSize()
        }}
        className="h-8 w-10 rounded-l-none border-0 hover:bg-accent"
        aria-label="Increase font size"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  )
}
