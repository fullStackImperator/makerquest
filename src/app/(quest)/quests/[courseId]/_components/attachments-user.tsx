'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { File, Loader2, PlusCircle, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Attachment, Course } from '@/generated/client'
import { FileUpload } from '@/components/files/file-upload'
import { displayAttachmentName } from '@/lib/attachment-display'
import { addAttachment } from '../_actions/add-attachment'
import { deleteAttachment } from '../_actions/delete-attachment'

interface AttachmentFormProps {
  initialData: Course & { attachments: Attachment[] }
  courseId: string
}

export const AttachmentFormUser = ({
  initialData,
  courseId,
}: AttachmentFormProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const toggleEdit = () => setIsEditing((current) => !current)

  const onSubmit = async (url: string, fileName?: string) => {
    const result = await addAttachment(courseId, url, fileName)
    if (!result.success) return toast.error(result.error)
    toast.success('Datei hochgeladen')
    toggleEdit()
    router.refresh()
  }

  const onDelete = async (id: string) => {
    try {
      setDeletingId(id)
      const result = await deleteAttachment(courseId, id)
      if (!result.success) return toast.error(result.error)
      toast.success('Datei gelöscht')
      router.refresh()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
            <Upload className="size-3.5" aria-hidden />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Ergebnisse
            </p>
            <p className="text-sm font-medium leading-tight">Hochladen</p>
          </div>
        </div>
        <Button
          onClick={toggleEdit}
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
        >
          {isEditing ? (
            'Abbrechen'
          ) : (
            <>
              <PlusCircle className="size-3.5" />
              Datei
            </>
          )}
        </Button>
      </div>

      {!isEditing && (
        <>
          {initialData.attachments.length === 0 && (
            <div className="border-border/60 bg-muted/20 text-muted-foreground rounded-lg border border-dashed px-3 py-6 text-center text-sm">
              Keine Dateien vorhanden
            </div>
          )}
          {initialData.attachments.length > 0 && (
            <ul className="space-y-2">
              {initialData.attachments.map((attachment) => (
                <li
                  key={attachment.id}
                  className="border-border/50 bg-background flex items-center gap-2 rounded-lg border px-3 py-2.5"
                >
                  <File className="text-muted-foreground size-4 shrink-0" />
                  <p className="min-w-0 flex-1 truncate text-xs font-medium">
                    {displayAttachmentName(attachment)}
                  </p>
                  {deletingId === attachment.id ? (
                    <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => onDelete(attachment.id)}
                      className="text-muted-foreground hover:text-foreground shrink-0 rounded p-1 transition-colors"
                      aria-label="Datei löschen"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {isEditing && (
        <div className="space-y-3">
          <FileUpload
            endpoint="courseAttachment"
            onChange={(url, fileName) => {
              if (url) onSubmit(url, fileName)
            }}
          />
          <p className="text-muted-foreground text-xs leading-relaxed">
            Lade dein Ergebnis hoch — dein Lehrer kann es bewerten.
          </p>
        </div>
      )}
    </div>
  )
}
