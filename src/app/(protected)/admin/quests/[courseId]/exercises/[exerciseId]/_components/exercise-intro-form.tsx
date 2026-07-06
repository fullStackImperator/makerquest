'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { EditorState, LexicalEditor } from 'lexical'
import type { Exercise } from '@/generated/client'
import { LexicalContentEditor } from '@/components/lexical/lexical-content-editor'
import { updateExercise } from '../_actions/update-exercise'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import 'mathlive/static.css'
import '@/app/(protected)/admin/quests/[courseId]/chapters/[chapterId]/_components/editor/theme.css'

export function ExerciseIntroForm({
  initialData,
  courseId,
  exerciseId,
}: {
  initialData: Exercise
  courseId: string
  exerciseId: string
}) {
  const router = useRouter()
  const pendingRef = useRef<string | null>(null)
  const [saving, setSaving] = useState(false)

  const onChange = (
    editorState: EditorState,
    _editor: LexicalEditor,
    _tags: Set<string>,
  ) => {
    pendingRef.current = JSON.stringify(editorState.toJSON())
  }

  const onSave = async () => {
    if (!pendingRef.current) return
    setSaving(true)
    const result = await updateExercise(courseId, exerciseId, {
      intro: pendingRef.current,
    })
    setSaving(false)
    if (result.success) {
      toast.success('Einleitung gespeichert')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="space-y-3">
      <LexicalContentEditor
        initialData={initialData.intro}
        editable
        onChange={onChange}
      />
      <Button onClick={onSave} disabled={saving} size="sm">
        Einleitung speichern
      </Button>
    </div>
  )
}
