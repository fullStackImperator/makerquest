'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { EditorState, LexicalEditor } from 'lexical'
import type { ExerciseQuestion } from '@/generated/client'
import { LexicalContentEditor } from '@/components/lexical/lexical-content-editor'
import { updateQuestion } from '../../_actions/update-question'
import { deleteQuestion } from '../../_actions/delete-question'
import { QUESTION_KIND_LABELS } from '@/lib/exercises/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/modals/confirm-modal'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import 'mathlive/static.css'
import '@/app/(protected)/admin/quests/[courseId]/chapters/[chapterId]/_components/editor/theme.css'

export function QuestionEditorShell({
  question,
  courseId,
  exerciseId,
  children,
  onSaveSpec,
}: {
  question: ExerciseQuestion
  courseId: string
  exerciseId: string
  children: React.ReactNode
  onSaveSpec: () => Promise<{ spec: string; solution: string }>
}) {
  const router = useRouter()
  const promptRef = useRef<string | null>(null)
  const [points, setPoints] = useState(question.points)
  const [saving, setSaving] = useState(false)

  const onPromptChange = (
    editorState: EditorState,
    _e: LexicalEditor,
    _t: Set<string>,
  ) => {
    promptRef.current = JSON.stringify(editorState.toJSON())
  }

  const handleSave = async () => {
    setSaving(true)
    const { spec, solution } = await onSaveSpec()
    const result = await updateQuestion(courseId, exerciseId, question.id, {
      ...(promptRef.current ? { prompt: promptRef.current } : {}),
      spec,
      solution,
      points,
    })
    setSaving(false)
    if (result.success) {
      toast.success('Frage gespeichert')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const handleDelete = async () => {
    const result = await deleteQuestion(courseId, exerciseId, question.id)
    if (result.success) {
      toast.success('Frage gelöscht')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="border-border/50 space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <Badge>{QUESTION_KIND_LABELS[question.kind]}</Badge>
        <ConfirmModal onConfirm={handleDelete}>
          <Button variant="ghost" size="icon">
            <Trash2 className="size-4" />
          </Button>
        </ConfirmModal>
      </div>

      <div className="space-y-2">
        <Label>Aufgabenstellung</Label>
        <LexicalContentEditor
          initialData={question.prompt}
          editable
          onChange={onPromptChange}
        />
      </div>

      {children}

      <div className="flex items-center gap-4">
        <div className="space-y-1">
          <Label htmlFor={`pts-${question.id}`}>Punkte</Label>
          <Input
            id={`pts-${question.id}`}
            type="number"
            min={1}
            className="w-24"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value) || 1)}
          />
        </div>
        <Button onClick={handleSave} disabled={saving} className="mt-6">
          Frage speichern
        </Button>
      </div>
    </div>
  )
}
