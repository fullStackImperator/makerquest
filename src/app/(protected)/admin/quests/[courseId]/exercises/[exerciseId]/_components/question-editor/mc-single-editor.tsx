'use client'

import type { ExerciseQuestion } from '@/generated/client'
import type { McSingleSpec, McSingleSolution } from '@/lib/exercises/types'
import { QuestionEditorShell } from './question-editor-shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'

export function McSingleEditor({
  question,
  courseId,
  exerciseId,
}: {
  question: ExerciseQuestion
  courseId: string
  exerciseId: string
}) {
  const spec = question.spec as McSingleSpec
  const solution = question.solution as McSingleSolution
  const [options, setOptions] = useState(spec.options)
  const [correctId, setCorrectId] = useState(solution.correctOptionId)
  const [shuffle, setShuffle] = useState(spec.shuffle ?? true)

  const onSaveSpec = async () => ({
    spec: JSON.stringify({ options, shuffle }),
    solution: JSON.stringify({ correctOptionId: correctId }),
  })

  const addOption = () => {
    const id = `opt-${Date.now()}`
    setOptions([...options, { id, label: 'Neue Antwort' }])
  }

  const removeOption = (id: string) => {
    const next = options.filter((o) => o.id !== id)
    setOptions(next)
    if (correctId === id && next[0]) setCorrectId(next[0].id)
  }

  return (
    <QuestionEditorShell
      question={question}
      courseId={courseId}
      exerciseId={exerciseId}
      onSaveSpec={onSaveSpec}
    >
      <div className="space-y-3">
        <Label>Antwortoptionen</Label>
        {options.map((opt) => (
          <div key={opt.id} className="flex items-center gap-2">
            <input
              type="radio"
              name={`correct-${question.id}`}
              checked={correctId === opt.id}
              onChange={() => setCorrectId(opt.id)}
            />
            <Input
              value={opt.label}
              onChange={(e) =>
                setOptions(
                  options.map((o) =>
                    o.id === opt.id ? { ...o, label: e.target.value } : o,
                  ),
                )
              }
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeOption(opt.id)}
              disabled={options.length <= 2}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addOption}>
          <Plus className="mr-1 size-4" />
          Option
        </Button>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`shuffle-${question.id}`}
            checked={shuffle}
            onCheckedChange={(c) => setShuffle(!!c)}
          />
          <Label htmlFor={`shuffle-${question.id}`}>
            Reihenfolge mischen
          </Label>
        </div>
      </div>
    </QuestionEditorShell>
  )
}
