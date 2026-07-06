'use client'
import { memo, useState, useEffect, useCallback } from 'react'
import {
  $createParagraphNode,
  $createTextNode,
  $insertNodes,
  type LexicalEditor,
} from 'lexical'
import useFixedBodyScroll from '../../../../hooks/useFixedBodyScroll'
import { SET_DIALOGS_COMMAND } from './commands'
import type { Announcement } from '../../../../types'
import { ANNOUNCE_COMMAND } from '../../../commands'
import Compressor from 'compressorjs'
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
import { Progress } from '@/components/ui/progress'
import { Upload, ClipboardPaste } from 'lucide-react'

const OCRDialog = memo(function OCRDialog({
  open,
  editor,
}: {
  open: boolean
  editor: LexicalEditor
}) {
  const [formData, setFormData] = useState({ value: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setFormData({ value: '' })
  }, [open])

  const updateFormData = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFilesChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files || files.length === 0) return
      const file = files[0]
      event.target.value = ''
      new Compressor(file, {
        quality: 0.6,
        mimeType: 'image/jpeg',
        success(result: File) {
          updateValue(result)
        },
        error() {
          annouunce({
            message: {
              title: 'Uploading image failed',
              subtitle: 'Unsupported file type',
            },
          })
        },
      })
    },
    []
  )

  const ocr = useCallback(async (blob: Blob) => {
    try {
      setLoading(true)
      const fd = new FormData()
      fd.append(
        'file',
        blob,
        blob instanceof File ? blob.name : 'image.jpeg',
      )
      const response = await fetch('/api/ocr/pix2text', {
        method: 'POST',
        body: fd,
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `Server responded with status ${response.status}: ${errorText}`
        )
      }
      const result = await response.json()
      if (result.error) throw new Error(result.error)
      return result.generated_text
    } catch (error: unknown) {
      annouunce({
        message: {
          title: 'Something went wrong',
          subtitle: error instanceof Error ? error.message : String(error),
        },
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const updateValue = useCallback(
    async (blob: Blob) => {
      const latex = await ocr(blob)
      if (!latex) return
      setFormData((prev) => ({ ...prev, value: prev.value + latex }))
    },
    [ocr]
  )

  const readFromClipboard = useCallback(async () => {
    try {
      window.focus()
      const clipboardItem = await navigator.clipboard.read()
      if (!clipboardItem) throw new Error('Clipboard is empty')
      const data = await clipboardItem[0].getType('image/png').catch(() => {
        throw new Error('Clipboard item is not an image')
      })
      updateValue(data)
    } catch (err: unknown) {
      annouunce({
        message: {
          title: 'Reading image failed',
          subtitle: err instanceof Error ? err.message : String(err),
        },
      })
    }
  }, [updateValue])

  const annouunce = useCallback(
    (announcement: Announcement) => {
      editor.dispatchCommand(ANNOUNCE_COMMAND, announcement)
    },
    [editor]
  )

  const closeDialog = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { ocr: { open: false } })
  }

  const handleSubmit = async () => {
    const { value } = formData
    editor.update(() => {
      const nodes = value
        .split('\n')
        .map((line) => {
          const textNode = $createTextNode(line)
          const paragraphNode = $createParagraphNode().append(textNode)
          return paragraphNode
        })
      $insertNodes(nodes)
    })
    closeDialog()
    setTimeout(() => editor.focus(), 0)
  }

  useFixedBodyScroll(open)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Image to Text</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild disabled={loading}>
              <label className="flex cursor-pointer items-center gap-2">
                <Upload className="size-4" />
                Upload Image
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFilesChange}
                  disabled={loading}
                />
              </label>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={readFromClipboard}
              disabled={loading}
            >
              <ClipboardPaste className="size-4 mr-2" />
              Paste from Clipboard
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ocr-result">Result</Label>
            <Textarea
              id="ocr-result"
              name="value"
              value={formData.value}
              onChange={updateFormData}
              disabled={loading}
              rows={6}
              className="resize-none"
            />
          </div>
          {loading && <Progress value={undefined} className="h-1" />}
        </div>
        <DialogFooter className="mt-6">
          <Button type="button" variant="ghost" onClick={closeDialog}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

export default OCRDialog
