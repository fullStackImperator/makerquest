'use client'
import { $getSelection, $setSelection, type LexicalEditor } from 'lexical'
import React, { memo, useEffect, useState } from 'react'
import { SET_DIALOGS_COMMAND } from './commands'
import useFixedBodyScroll from '../../../../hooks/useFixedBodyScroll'
import { TOGGLE_LINK_COMMAND, type LinkNode } from '@lexical/link'
import { sanitizeUrl } from '../../../utils/url'
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
import { Unlink } from 'lucide-react'

function LinkDialog({
  editor,
  node,
  open,
}: {
  editor: LexicalEditor
  node: LinkNode | null
  open: boolean
}) {
  const [formData, setFormData] = useState({ url: 'https://' })

  useEffect(() => {
    if (!open) return
    const next = node ? { url: node.__url } : { url: 'https://' }
    const t = setTimeout(() => setFormData(next), 0)
    return () => clearTimeout(t)
  }, [node, open])

  const updateFormData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    setFormData({ url: value })
  }

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    if (!node) editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl(formData.url))
    else editor.update(() => node.setURL(sanitizeUrl(formData.url)))
    closeDialog()
    setTimeout(() => {
      editor.focus()
    }, 0)
  }

  const closeDialog = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { link: { open: false } })
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

  const handleDelete = () => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    closeDialog()
  }

  useFixedBodyScroll(open)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent aria-labelledby="link-dialog-title" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle id="link-dialog-title">Insert Link</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              name="url"
              type="url"
              autoComplete="url"
              value={formData.url}
              onChange={updateFormData}
              className="w-full"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleDelete}
            disabled={!node}
            className="text-destructive border-destructive/50 hover:bg-destructive/10"
          >
            <Unlink className="size-4 mr-2" />
            Unlink
          </Button>
        </form>
        <DialogFooter className="mt-6">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.url}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default memo(LinkDialog)
