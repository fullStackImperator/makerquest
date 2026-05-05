'use client'
import { $getSelection, $setSelection, type LexicalEditor } from 'lexical'
import { INSERT_LAYOUT_COMMAND } from '../../LayoutPlugin'
import { memo, useState } from 'react'
import { SET_DIALOGS_COMMAND } from './commands'
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
import { cn } from '@/lib/utils'

const LAYOUTS = [
  { label: '2 columns (equal width)', value: '1fr 1fr' },
  { label: '2 columns (25% - 75%)', value: '1fr 3fr' },
  { label: '3 columns (equal width)', value: '1fr 1fr 1fr' },
  { label: '3 columns (25% - 50% - 25%)', value: '1fr 2fr 1fr' },
  { label: '4 columns (equal width)', value: '1fr 1fr 1fr 1fr' },
]

function LayoutDialog({
  editor,
  open,
}: {
  editor: LexicalEditor
  open: boolean
}) {
  const [formData, setFormData] = useState({ layout: LAYOUTS[0].value })

  const handleSubmit = (
    event:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    editor.dispatchCommand(INSERT_LAYOUT_COMMAND, formData.layout)
    closeDialog()
    setTimeout(() => editor.focus(), 0)
  }

  const closeDialog = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { layout: { open: false } })
  }

  const restoreSelection = () => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()?.clone() ?? null
      editor.update(() => $setSelection(selection))
    })
  }

  const handleClose = () => {
    closeDialog()
    restoreSelection()
  }

  useFixedBodyScroll(open)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="sm:max-w-md"
        aria-labelledby="layout-dialog-title"
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle id="layout-dialog-title">Insert Layout</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
          <div className="space-y-3">
            <Label
              id="column-layout-group-label"
              className="text-sm font-semibold"
            >
              Column Layout
            </Label>
            <div
              role="radiogroup"
              aria-labelledby="column-layout-group-label"
              className="flex flex-col gap-2"
            >
              {LAYOUTS.map(({ label, value }) => (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent',
                    formData.layout === value &&
                      'border-primary bg-accent/50'
                  )}
                >
                  <input
                    type="radio"
                    name="layouts"
                    value={value}
                    checked={formData.layout === value}
                    onChange={() =>
                      setFormData((prev) => ({ ...prev, layout: value }))
                    }
                    className="size-4"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </form>
        <DialogFooter className="mt-6">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Insert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default memo(LayoutDialog)
