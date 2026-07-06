'use client'
import { type LexicalEditor } from 'lexical'
import { MathNode } from '../../../nodes/MathNode'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  $getNodeStyleValueForProperty,
  $patchStyle,
} from '../../../nodes/utils'
import ColorPicker from './ColorPicker'
import type { MathfieldElement } from 'mathlive'
import useFixedBodyScroll from '../../../../hooks/useFixedBodyScroll'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Progress } from '@/components/ui/progress'
import { Trash2, Pencil, Save, Brush, Menu } from 'lucide-react'
import { ANNOUNCE_COMMAND } from '../../../commands'
import type { Announcement } from '../../../../types'
import dynamic from 'next/dynamic'
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawProps,
} from '@excalidraw/excalidraw/types'
import useOnlineStatus from '../../../../hooks/useOnlineStatus'
import { cn } from '@/lib/utils'

const EXCALIDRAW_MODULE = '@excalidraw/excalidraw'
const getExcalidrawModule = () =>
  import(/* webpackIgnore: true */ EXCALIDRAW_MODULE).catch(() => null)

const Excalidraw = dynamic<ExcalidrawProps>(
  () =>
    getExcalidrawModule().then((mod) =>
      mod ? { default: mod.Excalidraw } : { default: () => null }
    ),
  { ssr: false }
)

const WolframIcon = () => (
  <svg
    viewBox="0 0 20 20"
    className="size-4"
    fill="currentColor"
    aria-hidden
  >
    <path d="M15.33 10l2.17-2.47-3.19-.71.33-3.29-3 1.33L10 2 8.35 4.86l-3-1.33.32 3.29-3.17.71L4.67 10 2.5 12.47l3.19.71-.33 3.29 3-1.33L10 18l1.65-2.86 3 1.33-.32-3.29 3.19-.71zm-2.83 1.5h-5v-1h5zm0-2h-5v-1h5z" />
  </svg>
)

const themeMode = 'light'

export const useCallbackRefState = () => {
  const [refValue, setRefValue] = useState<ExcalidrawImperativeAPI | null>(null)
  const refCallback = useCallback(
    (value: ExcalidrawImperativeAPI | null) => setRefValue(value),
    []
  )
  return [refValue, refCallback] as const
}

const FONT_SIZE_OPTIONS: [string, string][] = [
  ['10px', '10'],
  ['11px', '11'],
  ['12px', '12'],
  ['13px', '13'],
  ['14px', '14'],
  ['15px', '15'],
  ['16px', '16'],
  ['17px', '17'],
  ['18px', '18'],
  ['19px', '19'],
  ['20px', '20'],
]

export default function MathTools({
  editor,
  node,
  className,
}: {
  editor: LexicalEditor
  node: MathNode
  className?: string
}) {
  const [value, setValue] = useState<string | null>(null)
  const isOnline = useOnlineStatus()
  const [excalidrawAPI, excalidrawAPIRefCallback] = useCallbackRefState()
  const [fontSize, setFontSize] = useState('15px')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    editor.read(() => {
      const fs = $getNodeStyleValueForProperty(node, 'font-size', '15px')
      setFontSize(fs)
    })
  }, [editor, node])

  const applyStyleMath = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        // @ts-expect-error Lexical node patch
        $patchStyle(node, styles)
      })
    },
    [editor, node]
  )

  const onFontSizeSelect = useCallback(
    (v: string) => {
      setFontSize(v)
      applyStyleMath({ 'font-size': v })
    },
    [applyStyleMath]
  )

  const onColorChange = useCallback(
    (key: string, value: string) => {
      const styleKey = key === 'text' ? 'color' : 'background-color'
      const mathfield = node.getMathfield()
      if (!mathfield) return
      if (mathfield.selectionIsCollapsed) {
        applyStyleMath({ [styleKey]: value })
      } else {
        const style =
          key === 'text' ? { color: value } : { backgroundColor: value }
        const selection = mathfield.selection
        const range = selection.ranges[0]
        mathfield.applyStyle(style, range)
      }
    },
    [applyStyleMath, node]
  )

  const [open, setOpen] = useState(false)
  const openEditDialog = useCallback(() => setOpen(true), [])
  const handleClose = useCallback(() => {
    setOpen(false)
    setValue(null)
    restoreSelection()
  }, [])

  const restoreSelection = () => {
    const mathfield = node.getMathfield()
    if (!mathfield) return
    setTimeout(() => {
      mathfield.focus()
      const mathVirtualKeyboard = (window as unknown as { mathVirtualKeyboard?: { show: (o: { animate: boolean }) => void } }).mathVirtualKeyboard
      mathVirtualKeyboard?.show({ animate: true })
    }, 0)
  }

  const mathfieldRef = useRef<MathfieldElement>(null)
  const [formData, setFormData] = useState({ value: node.getValue() })
  useEffect(() => {
    setFormData({ value: node.getValue() })
  }, [node])

  const updateFormData = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value
      setFormData((prev) => ({ ...prev, value: val }))
      if (mathfieldRef.current) mathfieldRef.current.setValue(val)
    },
    []
  )

  const handleEdit = useCallback(
    (
      e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
    ) => {
      e.preventDefault()
      const { value: v } = formData
      const mathfield = node.getMathfield()
      if (!mathfield) return
      mathfield.setValue(v, { selectionMode: 'after' })
      handleClose()
    },
    [formData, handleClose, node]
  )

  const openWolfram = useCallback(() => {
    const mathfield = node.getMathfield()
    if (!mathfield) return
    const selection = mathfield.selection
    const val =
      mathfield.getValue(selection, 'latex-unstyled') ||
      mathfield.getValue('latex-unstyled')
    window.open(
      `https://www.wolframalpha.com/input?i=${encodeURIComponent(val)}`
    )
    setTimeout(() => setValue(null), 0)
  }, [node])

  useFixedBodyScroll(open)

  const ocr = useCallback(async (blob: Blob) => {
    try {
      setLoading(true)
      const fd = new FormData()
      fd.append(
        'file',
        blob,
        blob instanceof File ? blob.name : 'image.png',
      )
      const response = await fetch('/api/ocr/pix2text', {
        method: 'POST',
        body: fd,
      })
      if (!response.ok)
        throw new Error(`Server responded with status ${response.status}`)
      const result = await response.json()
      return result.generated_text
    } catch (err: unknown) {
      annouunce({
        message: {
          title: 'Something went wrong',
          subtitle: err instanceof Error ? err.message : String(err),
        },
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const handleFreeHand = useCallback(async () => {
    const mod = await getExcalidrawModule()
    const exportToBlob = mod?.exportToBlob
    if (!exportToBlob || !excalidrawAPI) return
    const blob = await exportToBlob({
      elements: excalidrawAPI.getSceneElements(),
      mimeType: 'image/png',
      exportPadding: 16,
    })
    const latex = await ocr(blob)
    if (!latex) return
    const mathfield = node.getMathfield()
    if (!mathfield) return
    mathfield.executeCommand(['insert', latex])
    setValue(null)
  }, [excalidrawAPI, node, ocr])

  const annouunce = useCallback(
    (announcement: Announcement) => {
      editor.dispatchCommand(ANNOUNCE_COMMAND, announcement)
    },
    [editor]
  )

  return (
    <>
      <ToggleGroup
        type="single"
        value={value ?? ''}
        onValueChange={(v) => setValue(v || null)}
        className={cn('gap-0', className)}
      >
        <ToggleGroupItem
          value="wolfram"
          aria-label="Open in Wolfram Alpha"
          onClick={openWolfram}
          disabled={!isOnline}
          className={cn(isOnline && 'text-[#f96932]')}
        >
          <WolframIcon />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="edit"
          aria-label="Edit LaTeX"
          onClick={openEditDialog}
        >
          <Pencil className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="draw"
          aria-label="Draw"
          disabled={!isOnline}
        >
          <Brush className="size-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit LaTeX</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="math-latex-value">LaTeX Value</Label>
                <Textarea
                  id="math-latex-value"
                  name="value"
                  value={formData.value}
                  onChange={updateFormData}
                  className="min-h-20 resize-none font-mono text-sm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Preview
                </Label>
                <math-field
                  ref={mathfieldRef}
                  value={formData.value}
                  style={{ width: 'auto', margin: '0 auto' }}
                  read-only
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleEdit}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {value === 'draw' && (
        <div className="absolute left-0 top-13 z-1000 h-40 w-full border border-border bg-background [&_.layer-ui__wrapper]:!hidden [&_.App-top-bar]:!hidden [&_.App-bottom-bar]:!hidden [&_.popover]:!hidden [&_canvas]:rounded">
          <Excalidraw
            excalidrawAPI={excalidrawAPIRefCallback}
            initialData={{
              elements: [],
              appState: {
                activeTool: {
                  type: 'freedraw',
                  lastActiveTool: null,
                  customType: null,
                  locked: true,
                },
                currentItemStrokeWidth: 0.5,
              },
            }}
            theme={themeMode}
            langCode="en"
          />
          <Button
            type="button"
            size="icon-sm"
            className="absolute bottom-2 right-2 z-1001"
            onClick={handleFreeHand}
            disabled={loading}
          >
            <Save className="size-4" />
          </Button>
          {loading && (
            <Progress
              value={undefined}
              className="absolute bottom-0 left-0 right-0 z-1001 h-1 rounded-none"
            />
          )}
        </div>
      )}

      <ColorPicker onColorChange={onColorChange} onClose={handleClose} />

      <Select value={fontSize} onValueChange={onFontSizeSelect}>
        <SelectTrigger className="h-8 w-14">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_SIZE_OPTIONS.map(([option, text]) => (
            <SelectItem key={option} value={option}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className={cn('relative flex items-center gap-0', className)}>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Math menu"
          onClick={(e) => {
            const mathfield = node.getMathfield()
            if (!mathfield) return
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
            mathfield.showMenu({
              location: { x: rect.left, y: rect.top + 40 },
              modifiers: {
                alt: false,
                control: false,
                shift: false,
                meta: false,
              },
            })
            setTimeout(() => setValue(null), 0)
          }}
        >
          <Menu className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Delete"
          onClick={() => {
            editor.update(() => {
              node.selectPrevious()
              node.remove()
            })
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </>
  )
}
