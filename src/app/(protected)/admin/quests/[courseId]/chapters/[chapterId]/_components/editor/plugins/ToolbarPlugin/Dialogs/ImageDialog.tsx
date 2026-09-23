'use client'
import { $getSelection, $setSelection, type LexicalEditor } from 'lexical'
import { INSERT_IMAGE_COMMAND, type InsertImagePayload } from '../../ImagePlugin'
import { useEffect, useState, memo } from 'react'
import Compressor from 'compressorjs'
import { ImageNode } from '../../../nodes/ImageNodeNew/ImageNode'
import { SET_DIALOGS_COMMAND } from './commands'
import { getImageDimensions } from '../../../nodes/utils'
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
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import {
  compressImage,
  useEditorVariant,
} from '../../../context/EditorVariantContext'

function ImageDialog({
  editor,
  node,
  open,
}: {
  editor: LexicalEditor
  node: ImageNode | null
  open: boolean
}) {
  const { uploadImage } = useEditorVariant()
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState<InsertImagePayload>({
    src: '',
    altText: '',
    width: 0,
    height: 0,
    showCaption: true,
  })

  useEffect(() => {
    if (!open) return
    const next =
      node
        ? {
            src: node.getSrc(),
            altText: node.getAltText(),
            width: node.getWidth(),
            height: node.getHeight(),
            showCaption: node.getShowCaption(),
          }
        : {
            src: '',
            altText: '',
            width: 0,
            height: 0,
            showCaption: true,
          }
    const t = setTimeout(() => setFormData(next), 0)
    return () => clearTimeout(t)
  }, [node, open])

  const updateFormData = async (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLInputElement> & { target: { checked?: boolean } }
  ) => {
    const { name, value } = event.target
    const checked =
      'checked' in event.target ? (event.target as HTMLInputElement).checked : undefined
    if (name === 'src') {
      try {
        const dimensions = await getImageDimensions(value)
        setFormData((prev) => ({ ...prev, ...dimensions, [name]: value }))
      } catch {
        setFormData((prev) => ({ ...prev, [name]: value }))
      }
    } else if (name === 'showCaption' && checked !== undefined) {
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const uploadAndLoadImage = async (file: File) => {
    if (!uploadImage) return
    setIsUploading(true)
    try {
      const url = await uploadImage(await compressImage(file))
      const altText = file.name.replace(/\.[^/.]+$/, '')
      try {
        const dimensions = await getImageDimensions(url)
        setFormData((prev) => ({ ...prev, src: url, altText, ...dimensions, showCaption: true }))
      } catch {
        setFormData((prev) => ({ ...prev, src: url, altText, showCaption: true }))
      }
    } catch {
      toast.error('Bild konnte nicht hochgeladen werden')
    } finally {
      setIsUploading(false)
    }
  }

  const loadImage = (files: FileList | null) => {
    if (uploadImage) {
      if (files?.[0]) uploadAndLoadImage(files[0])
      return
    }
    const reader = new FileReader()
    reader.onload = async function () {
      if (typeof reader.result === 'string') {
        try {
          const dimensions = await getImageDimensions(reader.result)
          setFormData((prev) => ({
            ...prev,
            src: reader.result as string,
            altText: files![0].name.replace(/\.[^/.]+$/, ''),
            ...dimensions,
            showCaption: true,
          }))
        } catch {
          setFormData((prev) => ({
            ...prev,
            src: reader.result as string,
            altText: files![0].name.replace(/\.[^/.]+$/, ''),
            showCaption: true,
          }))
        }
      }
    }
    if (files !== null) {
      new Compressor(files[0], {
        quality: 0.6,
        mimeType: 'image/jpeg',
        success(result: File) {
          reader.readAsDataURL(result)
        },
        error() {
          reader.readAsDataURL(files[0])
        },
      })
    }
  }

  const isDisabled = formData.src === '' || isUploading

  const insertImage = (payload: InsertImagePayload) => {
    if (!node) editor.dispatchCommand(INSERT_IMAGE_COMMAND, payload)
    else editor.update(() => node.update(payload))
  }

  const closeDialog = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { image: { open: false } })
  }

  const restoreSelection = () => {
    editor.read(() => {
      const selection = $getSelection()?.clone() ?? null
      editor.update(() => $setSelection(selection))
    })
  }

  const handleSubmit = async () => {
    insertImage(formData)
    closeDialog()
    setTimeout(() => editor.focus(), 0)
  }

  const handleClose = () => {
    closeDialog()
    restoreSelection()
  }

  useFixedBodyScroll(open)

  return (
    <Dialog open={!!open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="sm:max-w-md"
        aria-labelledby="image-dialog-title"
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle id="image-dialog-title">Insert Image</DialogTitle>
        </DialogHeader>
        <form className="mt-4 space-y-4" noValidate>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">From URL</Label>
            <Input
              type="url"
              value={formData.src}
              onChange={updateFormData}
              name="src"
              placeholder="Image URL"
              autoComplete="url"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">From File</Label>
            <Button type="button" variant="outline" asChild>
              <label className="flex cursor-pointer items-center gap-2">
                {isUploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {isUploading ? 'Wird hochgeladen…' : 'Upload File'}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  disabled={isUploading}
                  onChange={(e) => loadImage(e.target.files)}
                />
              </label>
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="image-alt">Alt Text</Label>
            <Input
              id="image-alt"
              value={formData.altText}
              onChange={updateFormData}
              name="altText"
              placeholder="Alt text"
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="image-width">Width</Label>
              <Input
                id="image-width"
                type="number"
                value={formData.width || ''}
                onChange={updateFormData}
                name="width"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-height">Height</Label>
              <Input
                id="image-height"
                type="number"
                value={formData.height || ''}
                onChange={updateFormData}
                name="height"
                className="w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="image-caption"
              checked={formData.showCaption}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  showCaption: checked === true,
                }))
              }
            />
            <Label htmlFor="image-caption" className="font-normal">
              Show Caption
            </Label>
          </div>
        </form>
        <DialogFooter className="mt-6">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button disabled={isDisabled} onClick={handleSubmit}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default memo(ImageDialog)
