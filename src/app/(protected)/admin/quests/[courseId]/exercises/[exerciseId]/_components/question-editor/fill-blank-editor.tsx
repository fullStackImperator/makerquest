'use client'

import type { ExerciseQuestion } from '@/generated/client'
import type { FillBlankSpec, FillBlankSolution } from '@/lib/exercises/types'
import { QuestionEditorShell } from './question-editor-shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useState } from 'react'

export function FillBlankEditor({
  question,
  courseId,
  exerciseId,
}: {
  question: ExerciseQuestion
  courseId: string
  exerciseId: string
}) {
  const spec = question.spec as FillBlankSpec
  const solution = question.solution as FillBlankSolution
  const [blanks, setBlanks] = useState(spec.blanks)
  const [values, setValues] = useState(solution.values)

  const onSaveSpec = async () => ({
    spec: JSON.stringify({ blanks }),
    solution: JSON.stringify({ values }),
  })

  const addBlank = () => {
    const id = `b${Date.now()}`
    setBlanks([
      ...blanks,
      {
        id,
        accept: [],
        caseSensitive: false,
        normalizeWhitespace: true,
      },
    ])
    setValues({ ...values, [id]: '' })
  }

  return (
    <QuestionEditorShell
      question={question}
      courseId={courseId}
      exerciseId={exerciseId}
      onSaveSpec={onSaveSpec}
    >
      <p className="text-muted-foreground text-sm">
        Verwende im Aufgabentext Platzhalter wie{' '}
        <code className="bg-muted rounded px-1">{`{{blank:b1}}`}</code>
      </p>
      <div className="space-y-3">
        {blanks.map((blank) => (
          <div
            key={blank.id}
            className="border-border/50 space-y-2 rounded border p-3"
          >
            <Label>Lücke: {blank.id}</Label>
            <div>
              <Label className="text-xs">Richtige Antwort</Label>
              <Input
                value={values[blank.id] ?? ''}
                onChange={(e) =>
                  setValues({ ...values, [blank.id]: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="text-xs">
                Alternative Antworten (kommagetrennt)
              </Label>
              <Input
                value={blank.accept.join(', ')}
                onChange={(e) =>
                  setBlanks(
                    blanks.map((b) =>
                      b.id === blank.id
                        ? {
                            ...b,
                            accept: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          }
                        : b,
                    ),
                  )
                }
              />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addBlank}>
          <Plus className="mr-1 size-4" />
          Lücke
        </Button>
      </div>
    </QuestionEditorShell>
  )
}
