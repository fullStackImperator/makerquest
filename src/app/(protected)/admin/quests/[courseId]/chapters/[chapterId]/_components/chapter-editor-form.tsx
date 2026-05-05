'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Chapter } from '@/generated/client'
import { Button } from '@/components/ui/button'
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FileText, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { updateChapter } from '../_actions/udate-chapter'

import 'mathlive/static.css'
import './editor/theme.css'
import Editor from './editorMe'

import type {
  SerializedEditorState,
  EditorState,
  LexicalEditor,
  SerializedTextNode,
  SerializedParagraphNode,
  SerializedRootNode,
} from 'lexical'
import { SerializedHeadingNode } from '@lexical/rich-text'

interface ChapterEditorFormProps {
  initialData: Chapter
  courseId: string
  chapterId: string
}

const generateInitialEditorState = (title: string): SerializedEditorState => {
  const headingText: SerializedTextNode = {
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    text: title,
    type: 'text',
    version: 1,
  }
  const heading: SerializedHeadingNode = {
    children: [headingText],
    direction: 'ltr',
    format: 'center',
    indent: 0,
    tag: 'h2',
    type: 'heading',
    version: 1,
  }
  const paragraph: SerializedParagraphNode = {
    children: [],
    direction: 'ltr',
    format: 'left',
    textFormat: 0,
    textStyle: '',
    indent: 0,
    type: 'paragraph',
    version: 1,
  }
  const root: SerializedRootNode = {
    children: [heading, paragraph],
    direction: 'ltr',
    type: 'root',
    version: 1,
    format: 'left',
    indent: 0,
  }
  return { root }
}

const parseEditorData = (data: unknown): SerializedEditorState | null => {
  if (!data) return null
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    if (parsed && typeof parsed === 'object' && 'root' in parsed) {
      return parsed as SerializedEditorState
    }
  } catch (error) {
    console.error('Failed to parse editor data', error)
  }
  return null
}

const editorShell =
  'border-border/60 bg-card overflow-hidden rounded-xl border shadow-sm/50'

export const ChapterEditorForm = ({
  initialData,
  courseId,
  chapterId,
}: ChapterEditorFormProps) => {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingContent, setPendingContent] =
    useState<SerializedEditorState | null>(null)
  const [currentContent, setCurrentContent] =
    useState<SerializedEditorState | null>(
      parseEditorData(initialData.mathEditor) ??
        generateInitialEditorState(initialData.title),
    )

  const editorData =
    currentContent ?? generateInitialEditorState(initialData.title)

  const handleEditorChange = (
    editorState: EditorState,
    _editor: LexicalEditor,
    _tags: Set<string>,
  ) => {
    setPendingContent(editorState.toJSON() as SerializedEditorState)
  }

  const onSubmit = async () => {
    if (!pendingContent) return
    try {
      setIsSubmitting(true)
      const result = await updateChapter(courseId, chapterId, {
        mathEditor: JSON.stringify(pendingContent),
      })
      if (!result.success) return toast.error(result.error)
      toast.success('Kapitel aktualisiert')
      setCurrentContent(pendingContent)
      setIsEditing(false)
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="text-muted-foreground size-5 shrink-0" />
              <CardTitle className="text-lg">Kapitelinhalt</CardTitle>
            </div>
            <CardDescription className="text-pretty">
              Text, Bilder, Aufgaben und Medien für dieses Kapitel
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={() => setIsEditing((c) => !c)}
            variant={isEditing ? 'ghost' : 'outline'}
            size="sm"
            className="shrink-0 sm:mt-0.5"
          >
            {isEditing ? (
              'Vorschau'
            ) : (
              <>
                <Pencil className="mr-2 size-4" />
                Inhalt bearbeiten
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {!isEditing && (
          <div className={cn(editorShell)}>
            <div
              className={cn(
                'min-h-48 p-5 md:p-8',
                !currentContent &&
                  'text-muted-foreground flex items-center justify-center italic',
              )}
            >
              {!currentContent && 'Noch kein Inhalt'}
              {currentContent && (
                <Editor
                  key="readonly-editor"
                  editorData={currentContent}
                  editorEditable={false}
                />
              )}
            </div>
          </div>
        )}

        {isEditing && (
          <div className={cn(editorShell)}>
            <div className="p-4 pt-5 md:p-6 md:pt-6">
              <Editor
                key="editable-editor"
                editorData={editorData}
                editorEditable={true}
                onChange={handleEditorChange}
              />
            </div>
            <div className="border-border/60 bg-muted/30 border-t px-4 py-4 md:px-6 md:pb-5">
              <Button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? 'Wird gespeichert…' : 'Inhalt speichern'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </>
  )
}
