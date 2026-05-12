'use client'
import { $getSelection, $setSelection, type LexicalEditor } from 'lexical'
import { memo, useEffect, useState } from 'react'
import { SET_DIALOGS_COMMAND } from './commands'
import useFixedBodyScroll from '../../../../hooks/useFixedBodyScroll'
import { INSERT_IFRAME_COMMAND } from '../../IFramePlugin'
import type { IFrameNode } from '../../../nodes/IFrameNode/IFrameNode'
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

function IFrameDialog({
  editor,
  node,
  open,
}: {
  editor: LexicalEditor
  node: IFrameNode | null
  open: boolean
}) {
  const [formData, setFormData] = useState({
    src: '',
    altText: 'iframe',
    width: 560,
    height: 315,
    showCaption: true,
  })

  useEffect(() => {
    if (!open) return
    if (node) {
      setFormData({
        src: node.getSrc(),
        altText: node.getAltText(),
        width: node.getWidth(),
        height: node.getHeight(),
        showCaption: node.getShowCaption(),
      })
    } else {
      setFormData({
        src: '',
        altText: 'iframe',
        width: 560,
        height: 315,
        showCaption: true,
      })
    }
  }, [node, open])

  const updateFormData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    const checked =
      name === 'showCaption'
        ? (event.target as HTMLInputElement).checked
        : undefined
    if (checked !== undefined) {
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    const payload = {
      ...formData,
      width: Number(formData.width) || 560,
      height: Number(formData.height) || 315,
    }
    if (!node) editor.dispatchCommand(INSERT_IFRAME_COMMAND, payload)
    else editor.update(() => node.update(payload))
    closeDialog()
    setTimeout(() => editor.focus(), 0)
  }

  const closeDialog = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { iframe: { open: false } })
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
        aria-labelledby="iframe-dialog-title"
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle id="iframe-dialog-title">Insert IFrame</DialogTitle>
        </DialogHeader>
        <form className="mt-4 space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="iframe-src">Embed URL</Label>
            <Input
              id="iframe-src"
              value={formData.src}
              onChange={updateFormData}
              name="src"
              placeholder="https://..."
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="iframe-alt">Alt Text</Label>
            <Input
              id="iframe-alt"
              value={formData.altText}
              onChange={updateFormData}
              name="altText"
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="iframe-width">Width</Label>
              <Input
                id="iframe-width"
                type="number"
                value={formData.width}
                onChange={updateFormData}
                name="width"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iframe-height">Height</Label>
              <Input
                id="iframe-height"
                type="number"
                value={formData.height}
                onChange={updateFormData}
                name="height"
                className="w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="iframe-caption"
              checked={formData.showCaption}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  showCaption: checked === true,
                }))
              }
            />
            <Label htmlFor="iframe-caption" className="font-normal">
              Show Caption
            </Label>
          </div>
        </form>
        <DialogFooter className="mt-6">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.src}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default memo(IFrameDialog)
