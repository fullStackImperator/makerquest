'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { EditorState } from 'lexical'
import { Loader2, Paperclip, Save, Send } from 'lucide-react'
import { toast } from 'sonner'
import 'mathlive/static.css'
import '@/app/(protected)/admin/quests/[courseId]/chapters/[chapterId]/_components/editor/theme.css'

import { saveJournalEntry } from '@/actions/journal'
import { LexicalContentEditor } from '@/components/lexical/lexical-content-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { uploadJournalImage } from '@/lib/journal/upload-journal-image'
import { useUploadThing } from '@/lib/uploadthing'
import { EMPTY_LEXICAL_STATE } from '@/lib/lexical/defaults'
import type {
  JournalAttachmentView,
  JournalEntryView,
  JournalQuestGroup,
  JournalQuestOption,
} from '@/lib/journal/shared'
import { JournalAttachments } from './journal-attachments'
import { JournalStatusBadge } from './journal-status-badge'

const NO_CHAPTER = '__none'

type JournalEntryFormProps = {
  /** Existing entry when editing; omitted for a new entry. */
  entry?: JournalEntryView
  /** Where to go after saving or cancelling. */
  returnHref: string
} & (
  | { fixedQuest: JournalQuestOption; questGroups?: never; initialCourseId?: never }
  | { fixedQuest?: never; questGroups: JournalQuestGroup[]; initialCourseId?: string }
)

export function JournalEntryForm({
  entry,
  returnHref,
  fixedQuest,
  questGroups,
  initialCourseId,
}: JournalEntryFormProps) {
  const router = useRouter()
  const allQuests = fixedQuest ? [fixedQuest] : questGroups.flatMap((g) => g.quests)

  const [courseId, setCourseId] = useState<string>(
    entry?.courseId ?? fixedQuest?.id ?? initialCourseId ?? '',
  )
  const [chapterId, setChapterId] = useState<string>(entry?.chapterId ?? NO_CHAPTER)
  const [title, setTitle] = useState(entry?.title ?? '')
  const [attachments, setAttachments] = useState<JournalAttachmentView[]>(
    entry?.attachments ?? [],
  )
  const [pending, startTransition] = useTransition()
  const contentRef = useRef<string>(JSON.stringify(entry?.content ?? EMPTY_LEXICAL_STATE))
  const fileInputRef = useRef<HTMLInputElement>(null)

  // The editor keeps its first props, so read the current quest through a ref.
  const courseIdRef = useRef(courseId)
  useEffect(() => {
    courseIdRef.current = courseId
  }, [courseId])
  const uploadImage = useCallback(
    (file: File) => uploadJournalImage(courseIdRef.current, file),
    [],
  )

  const [uploadProgress, setUploadProgress] = useState(0)
  const { startUpload, isUploading } = useUploadThing('journalAttachment', {
    onUploadProgress: setUploadProgress,
    onUploadError: (error) => {
      toast.error(error.message || 'Upload fehlgeschlagen')
    },
  })

  const quest = allQuests.find((q) => q.id === courseId)
  // A submitted entry stays with its quest (enforced on the server as well).
  const questLocked = !!fixedQuest || (!!entry && entry.status !== 'DRAFT')

  const onFilesSelected = async (fileList: FileList | null) => {
    if (!fileList?.length || !courseId) return
    setUploadProgress(0)
    const uploaded = await startUpload(Array.from(fileList), { courseId })
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!uploaded) return
    setAttachments((prev) => [
      ...prev,
      ...uploaded.map((f) => ({
        url: f.serverData?.url ?? f.ufsUrl,
        fileKey: f.key,
        name: f.name,
        mimeType: f.type || null,
        size: f.size,
      })),
    ])
  }

  const save = (submit: boolean) =>
    startTransition(async () => {
      if (!courseId) return void toast.error('Wähle zuerst einen Quest aus')
      const result = await saveJournalEntry({
        id: entry?.id,
        courseId,
        chapterId: chapterId === NO_CHAPTER ? null : chapterId,
        title,
        content: contentRef.current,
        attachments,
        submit,
      })
      if (!result.success) return void toast.error(result.error)
      toast.success(submit ? 'Eintrag eingereicht' : 'Entwurf gespeichert')
      router.push(returnHref)
      router.refresh()
    })

  const busy = pending || isUploading

  return (
    <div className="space-y-5 pb-16">
      {entry?.status === 'REVISE' && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Deine Lehrkraft möchte, dass du diesen Eintrag überarbeitest. Das
          Feedback findest du in der Zeitleiste unter dem Eintrag.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Quest</Label>
          {fixedQuest ? (
            <p className="border-border/60 bg-muted/30 flex h-9 items-center rounded-md border px-3 text-sm">
              {fixedQuest.title}
            </p>
          ) : (
            <Select
              value={courseId || undefined}
              onValueChange={(value) => {
                setCourseId(value)
                setChapterId(NO_CHAPTER)
              }}
              disabled={questLocked}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Wofür ist dieser Eintrag?" />
              </SelectTrigger>
              <SelectContent>
                {questGroups.map((group) => (
                  <SelectGroup key={group.learningPathTitle ?? '__single'}>
                    <SelectLabel>
                      {group.learningPathTitle
                        ? `Lernpfad: ${group.learningPathTitle}`
                        : 'Einzelne Quests'}
                    </SelectLabel>
                    {group.quests.map((q) => (
                      <SelectItem key={`${group.learningPathTitle}-${q.id}`} value={q.id}>
                        {q.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Kapitel (optional)</Label>
          <Select
            value={chapterId}
            onValueChange={setChapterId}
            disabled={!quest || quest.chapters.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Kein Kapitel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CHAPTER}>Kein Kapitel</SelectItem>
              {quest?.chapters.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="journal-title">Titel</Label>
        <Input
          id="journal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z. B. Schaltung gelötet"
          maxLength={200}
          className="bg-background"
        />
      </div>

      {courseId ? (
        <>
          <div className="space-y-1.5">
            <Label>Was hast du gemacht und gelernt?</Label>
            <div className="border-border/60 bg-background rounded-lg border">
              <LexicalContentEditor
                initialData={entry?.content}
                editable
                variant="student"
                uploadImage={uploadImage}
                onChange={(state: EditorState) => {
                  contentRef.current = JSON.stringify(state.toJSON())
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Dateien</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={busy}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Paperclip className="size-3.5" />
                    Datei anhängen
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => onFilesSelected(e.target.files)}
              />
            </div>
            {attachments.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                Fotos, Videos, Code, 3D-Modelle, PDFs … (Videos bis 256 MB)
              </p>
            ) : (
              <JournalAttachments
                attachments={attachments}
                onRemove={(index) =>
                  setAttachments((prev) => prev.filter((_, i) => i !== index))
                }
              />
            )}
          </div>
        </>
      ) : (
        <p className="border-border/60 bg-muted/20 text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm">
          Wähle zuerst den Quest aus, zu dem dein Eintrag gehört.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        {entry && <JournalStatusBadge status={entry.status} />}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button asChild variant="ghost" disabled={busy}>
            <Link href={returnHref}>Abbrechen</Link>
          </Button>
          <Button variant="outline" className="gap-1.5" disabled={busy || !courseId} onClick={() => save(false)}>
            <Save className="size-4" />
            {entry?.status === 'REVISE' ? 'Speichern' : 'Entwurf speichern'}
          </Button>
          <Button className="gap-1.5" disabled={busy || !courseId} onClick={() => save(true)}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {entry?.status === 'REVISE' ? 'Erneut einreichen' : 'Einreichen'}
          </Button>
        </div>
      </div>
    </div>
  )
}
