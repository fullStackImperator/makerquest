'use client'

import type { ExerciseQuestion } from '@/generated/client'
import type { ShortTextSpec } from '@/lib/exercises/types'
import { QuestionEditorShell } from './question-editor-shell'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useState } from 'react'

export function ShortTextEditor({
  question,
  courseId,
  exerciseId,
}: {
  question: ExerciseQuestion
  courseId: string
  exerciseId: string
}) {
  const spec = question.spec as ShortTextSpec
  const [rubric, setRubric] = useState(spec.rubric ?? '')
  const [exemplar, setExemplar] = useState(spec.exemplar ?? '')
  const [maxLength, setMaxLength] = useState(spec.maxLength ?? 500)
  const [autoFlagBelow, setAutoFlagBelow] = useState(spec.autoFlagBelow ?? 0.8)
  const [alwaysReview, setAlwaysReview] = useState(spec.alwaysReview ?? false)

  const onSaveSpec = async () => ({
    spec: JSON.stringify({
      rubric,
      exemplar,
      maxLength,
      autoFlagBelow,
      alwaysReview,
    }),
    solution: JSON.stringify({}),
  })

  return (
    <QuestionEditorShell
      question={question}
      courseId={courseId}
      exerciseId={exerciseId}
      onSaveSpec={onSaveSpec}
    >
      <div className="space-y-3">
        <div>
          <Label>Bewertungskriterien (Rubric)</Label>
          <Textarea
            value={rubric}
            onChange={(e) => setRubric(e.target.value)}
            rows={3}
          />
        </div>
        <div>
          <Label>Musterantwort</Label>
          <Textarea
            value={exemplar}
            onChange={(e) => setExemplar(e.target.value)}
            rows={2}
          />
        </div>
        <div>
          <Label>Max. Zeichen</Label>
          <Input
            type="number"
            value={maxLength}
            onChange={(e) => setMaxLength(Number(e.target.value))}
            className="w-32"
          />
        </div>
        <div>
          <Label>Confidence-Schwelle (0–1)</Label>
          <Input
            type="number"
            step={0.05}
            min={0}
            max={1}
            value={autoFlagBelow}
            onChange={(e) => setAutoFlagBelow(Number(e.target.value))}
            className="w-32"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            Unter diesem Wert → Lehrerprüfung
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={alwaysReview}
            onCheckedChange={(c) => setAlwaysReview(!!c)}
          />
          <Label>Immer Lehrerprüfung</Label>
        </div>
      </div>
    </QuestionEditorShell>
  )
}
