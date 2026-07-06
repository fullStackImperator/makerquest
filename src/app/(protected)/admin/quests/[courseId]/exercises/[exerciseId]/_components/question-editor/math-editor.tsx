'use client'

import type { ExerciseQuestion } from '@/generated/client'
import type { MathSpec, MathSolution } from '@/lib/exercises/types'
import { QuestionEditorShell } from './question-editor-shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'

export function MathQuestionEditor({
  question,
  courseId,
  exerciseId,
}: {
  question: ExerciseQuestion
  courseId: string
  exerciseId: string
}) {
  const spec = question.spec as MathSpec
  const solution = question.solution as MathSolution
  const [acceptable, setAcceptable] = useState(
    solution.acceptable?.length ? solution.acceptable : [''],
  )
  const [tolerance, setTolerance] = useState(spec.tolerance ?? undefined)

  const onSaveSpec = async () => ({
    spec: JSON.stringify({ acceptable, strict: false, tolerance }),
    solution: JSON.stringify({ acceptable: acceptable.filter(Boolean) }),
  })

  return (
    <QuestionEditorShell
      question={question}
      courseId={courseId}
      exerciseId={exerciseId}
      onSaveSpec={onSaveSpec}
    >
      <div className="space-y-3">
        <Label>Zulässige Ausdrücke (LaTeX)</Label>
        {acceptable.map((expr, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={expr}
              placeholder="z.B. 2x+3"
              onChange={(e) => {
                const next = [...acceptable]
                next[i] = e.target.value
                setAcceptable(next)
              }}
              className="font-mono"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() =>
                setAcceptable(acceptable.filter((_, idx) => idx !== i))
              }
              disabled={acceptable.length <= 1}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAcceptable([...acceptable, ''])}
        >
          <Plus className="mr-1 size-4" />
          Ausdruck
        </Button>
        <div>
          <Label>Toleranz (optional, für Zahlen)</Label>
          <Input
            type="number"
            step={0.01}
            value={tolerance ?? ''}
            onChange={(e) =>
              setTolerance(
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            className="w-32"
          />
        </div>
      </div>
    </QuestionEditorShell>
  )
}
