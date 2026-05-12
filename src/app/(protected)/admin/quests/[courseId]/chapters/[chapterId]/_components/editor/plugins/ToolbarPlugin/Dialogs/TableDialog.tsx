'use client'
import { $getSelection, $setSelection, type LexicalEditor } from 'lexical'
import { INSERT_TABLE_COMMAND } from '../../../nodes/TableNode/TableNode'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Minus, Plus } from 'lucide-react'

function TableDialog({
  editor,
  open,
}: {
  editor: LexicalEditor
  open: boolean
}) {
  const [formData, setFormData] = useState({
    rows: '3',
    columns: '3',
    includeHeaders: true,
  })

  const setRows = (rows: number) => {
    setFormData((prev) => ({
      ...prev,
      rows: Math.max(1, rows).toString(),
    }))
  }
  const setColumns = (columns: number) => {
    setFormData((prev) => ({
      ...prev,
      columns: Math.max(1, columns).toString(),
    }))
  }

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    editor.dispatchCommand(INSERT_TABLE_COMMAND, formData)
    closeDialog()
    setTimeout(() => editor.focus(), 0)
  }

  const closeDialog = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { table: { open: false } })
    setFormData({ rows: '3', columns: '3', includeHeaders: true })
  }

  const restoreSelection = () => {
    editor.read(() => {
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
        aria-labelledby="table-dialog-title"
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle id="table-dialog-title">Insert Table</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-6" noValidate>
          <div className="flex flex-col items-center gap-2">
            <Label>Rows</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setRows(+formData.rows - 1)}
                aria-label="Decrease rows"
              >
                <Minus className="size-4" />
              </Button>
              <Input
                type="number"
                min={1}
                className="w-20 text-center"
                value={formData.rows}
                onChange={(e) => setRows(+e.target.value || 1)}
                name="rows"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setRows(+formData.rows + 1)}
                aria-label="Increase rows"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Label>Columns</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setColumns(+formData.columns - 1)}
                aria-label="Decrease columns"
              >
                <Minus className="size-4" />
              </Button>
              <Input
                type="number"
                min={1}
                className="w-20 text-center"
                value={formData.columns}
                onChange={(e) => setColumns(+e.target.value || 1)}
                name="columns"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setColumns(+formData.columns + 1)}
                aria-label="Increase columns"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Checkbox
              id="table-headers"
              checked={formData.includeHeaders}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  includeHeaders: checked === true,
                }))
              }
            />
            <Label htmlFor="table-headers" className="font-normal">
              Include Headers
            </Label>
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

export default memo(TableDialog)
