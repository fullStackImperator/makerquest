'use client'
import * as React from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Highlighter, Eraser, Palette } from 'lucide-react'

const textPalette = [
  '#d7170b',
  '#fe8a2b',
  '#ffc02b',
  '#63b215',
  '#21ba3a',
  '#17cfcf',
  '#0d80f2',
  '#a219e6',
  '#eb4799',
  '#000000',
  '#666666',
  '#A6A6A6',
  '#d4d5d2',
  '#ffffff',
]

const backgroundPalette = [
  '#fbbbb6',
  '#ffe0c2',
  '#fff1c2',
  '#d0e8b9',
  '#bceac4',
  '#b9f1f1',
  '#b6d9fb',
  '#e3baf8',
  '#f9c8e0',
  '#353535',
  '#8C8C8C',
  '#D0D0D0',
  '#F0F0F0',
  '#ffffff',
]

export default function ColorPicker({
  onColorChange,
  onClose,
  toggle = 'togglebutton',
}: {
  onColorChange: (key: string, value: string) => void
  onClose?: () => void
  toggle?: 'togglebutton' | 'menuitem'
}): React.ReactElement {
  const [open, setOpen] = React.useState(false)

  const handleClose = () => {
    setOpen(false)
    onClose?.()
  }

  const onChange = (key: string, value: string) => {
    onColorChange(key, value)
  }

  const trigger =
    toggle === 'menuitem' ? (
      <button
        type="button"
        className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
        onClick={() => setOpen((o) => !o)}
      >
        <Highlighter className="size-4" />
        Color
      </button>
    ) : (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 px-2 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
        data-state={open ? 'on' : 'off'}
        onClick={() => setOpen((o) => !o)}
      >
        <Palette className="size-4" />
      </Button>
    )

  return (
    <Popover open={open} onOpenChange={(o) => !o && handleClose()}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="center" className="w-[280px] p-2">
        <div className="flex flex-wrap gap-0">
          <p className="w-full px-2 py-1 text-xs font-medium text-muted-foreground">
            Text
          </p>
          {textPalette.map((color, index) => (
            <button
              key={index}
              type="button"
              className="size-6 rounded-full border border-border hover:ring-2 hover:ring-ring"
              style={{ backgroundColor: color, borderColor: color }}
              onClick={() => {
                onChange('text', color)
              }}
              aria-label={`Text color ${color}`}
            />
          ))}
          <button
            type="button"
            className="flex size-6 items-center justify-center rounded border border-border hover:bg-accent"
            onClick={() => onChange('text', 'inherit')}
            aria-label="Clear text color"
          >
            <Eraser className="size-3.5" />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-0">
          <p className="w-full px-2 py-1 text-xs font-medium text-muted-foreground">
            Background
          </p>
          {backgroundPalette.map((color, index) => (
            <button
              key={index}
              type="button"
              className="size-6 rounded-full border border-border hover:ring-2 hover:ring-ring"
              style={{ backgroundColor: color }}
              onClick={() => onChange('background', color)}
              aria-label={`Background color ${color}`}
            />
          ))}
          <button
            type="button"
            className="flex size-6 items-center justify-center rounded border border-border hover:bg-accent"
            onClick={() => onChange('background', 'inherit')}
            aria-label="Clear background color"
          >
            <Eraser className="size-3.5" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
