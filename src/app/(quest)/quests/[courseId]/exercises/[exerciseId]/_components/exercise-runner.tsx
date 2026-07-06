'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import type {
  AttemptStatus,
  Exercise,
  ExerciseAttempt,
  ExerciseQuestion,
  ExerciseResponse,
} from '@/generated/client'
import type {
  DragDropSpec,
  FillBlankSpec,
  McSingleSpec,
  QuestionAnswer,
  ShortTextSpec,
} from '@/lib/exercises/types'
import { LexicalContentEditor, parseLexicalJson } from '@/components/lexical/lexical-content-editor'
import { saveResponse } from '../_actions/save-response'
import { submitAttempt } from '../_actions/submit-attempt'
import { McSingleInput } from './questions/mc-single'
import { FillBlankInput } from './questions/fill-blank'
import { ShortTextInput } from './questions/short-text'
import { MathInput } from './questions/math'
import { DragDropInput } from './questions/drag-drop'
import { ResultSummary } from './result-summary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QUESTION_KIND_LABELS } from '@/lib/exercises/types'
import { toast } from 'sonner'
import 'mathlive/static.css'
import '@/app/(protected)/admin/quests/[courseId]/chapters/[chapterId]/_components/editor/theme.css'

type RunnerProps = {
  exercise: Exercise & { questions: ExerciseQuestion[] }
  attempt: ExerciseAttempt & { responses: ExerciseResponse[] }
  courseId: string
}

function buildAnswerMap(
  responses: ExerciseResponse[],
): Record<string, QuestionAnswer> {
  const map: Record<string, QuestionAnswer> = {}
  for (const r of responses) {
    map[r.questionId] = r.answer as QuestionAnswer
  }
  return map
}

export function ExerciseRunner({
  exercise,
  attempt: initialAttempt,
  courseId,
}: RunnerProps) {
  const router = useRouter()
  const [attempt, setAttempt] = useState(initialAttempt)
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>(
    () => buildAnswerMap(initialAttempt.responses),
  )
  const [submitting, setSubmitting] = useState(false)

  const readOnly =
    attempt.status === 'GRADED' ||
    attempt.status === 'NEEDS_REVIEW' ||
    attempt.status === 'SUBMITTED'

  const save = useCallback(
    async (questionId: string, answer: QuestionAnswer) => {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }))
      if (readOnly) return
      await saveResponse(
        attempt.id,
        questionId,
        JSON.stringify(answer),
      )
    },
    [attempt.id, readOnly],
  )

  const handleSubmit = async () => {
    setSubmitting(true)
    const result = await submitAttempt(attempt.id)
    setSubmitting(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Abgegeben!')
    router.refresh()
  }

  if (
    attempt.status === 'GRADED' ||
    attempt.status === 'NEEDS_REVIEW'
  ) {
    return (
      <ResultSummary
        exercise={exercise}
        attempt={attempt}
        responses={attempt.responses}
      />
    )
  }

  return (
    <div className="space-y-6">
      {exercise.intro && (
        <Card>
          <CardContent className="pt-6">
            <LexicalContentEditor
              initialData={parseLexicalJson(exercise.intro)}
              editable={false}
            />
          </CardContent>
        </Card>
      )}

      {exercise.questions.map((q, idx) => (
        <Card key={q.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Frage {idx + 1}
              </CardTitle>
              <Badge variant="secondary">
                {QUESTION_KIND_LABELS[q.kind]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <LexicalContentEditor
              initialData={parseLexicalJson(q.prompt)}
              editable={false}
            />
            <QuestionInput
              question={q}
              answer={answers[q.id]}
              onAnswer={(a) => save(q.id, a)}
              disabled={readOnly}
            />
          </CardContent>
        </Card>
      ))}

      <Button
        onClick={handleSubmit}
        disabled={submitting || readOnly}
        size="lg"
        className="w-full sm:w-auto"
      >
        {submitting ? 'Wird abgegeben…' : 'Abgeben'}
      </Button>
    </div>
  )
}

function QuestionInput({
  question,
  answer,
  onAnswer,
  disabled,
}: {
  question: ExerciseQuestion
  answer?: QuestionAnswer
  onAnswer: (a: QuestionAnswer) => void
  disabled?: boolean
}) {
  switch (question.kind) {
    case 'MC_SINGLE':
      return (
        <McSingleInput
          questionId={question.id}
          spec={question.spec as McSingleSpec}
          value={(answer as { optionId?: string })?.optionId}
          onChange={(optionId) => onAnswer({ optionId })}
          disabled={disabled}
        />
      )
    case 'FILL_BLANK':
      return (
        <FillBlankInput
          spec={question.spec as FillBlankSpec}
          values={(answer as { values?: Record<string, string> })?.values ?? {}}
          onChange={(values) => onAnswer({ values })}
          disabled={disabled}
        />
      )
    case 'SHORT_TEXT':
      return (
        <ShortTextInput
          spec={question.spec as ShortTextSpec}
          value={(answer as { text?: string })?.text ?? ''}
          onChange={(text) => onAnswer({ text })}
          disabled={disabled}
        />
      )
    case 'MATH':
      return (
        <MathInput
          value={(answer as { latex?: string })?.latex ?? ''}
          onChange={(latex) => onAnswer({ latex })}
          disabled={disabled}
        />
      )
    case 'DRAG_DROP':
      return (
        <DragDropInput
          spec={question.spec as DragDropSpec}
          value={
            (answer as { order?: string[]; pairs?: Record<string, string> }) ??
            {}
          }
          onChange={(v) =>
            onAnswer(
              v.order
                ? { order: v.order }
                : { pairs: v.pairs ?? {} },
            )
          }
          disabled={disabled}
        />
      )
    default:
      return null
  }
}
