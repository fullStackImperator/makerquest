'use client'

import type {
  Exercise,
  ExerciseAttempt,
  ExerciseQuestion,
  ExerciseResponse,
} from '@/generated/client'
import { LexicalContentEditor, parseLexicalJson } from '@/components/lexical/lexical-content-editor'
import { ATTEMPT_STATUS_LABELS } from '@/lib/exercises/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import 'mathlive/static.css'
import '@/app/(protected)/admin/quests/[courseId]/chapters/[chapterId]/_components/editor/theme.css'

export function ResultSummary({
  exercise,
  attempt,
  responses,
}: {
  exercise: Exercise & { questions: ExerciseQuestion[] }
  attempt: ExerciseAttempt
  responses: ExerciseResponse[]
}) {
  const responseMap = new Map(responses.map((r) => [r.questionId, r]))

  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Ergebnis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-2xl font-semibold tabular-nums">
            {attempt.totalScore} / {attempt.maxScore} Punkte
          </p>
          <Badge>
            {ATTEMPT_STATUS_LABELS[attempt.status]}
          </Badge>
          {attempt.status === 'NEEDS_REVIEW' && (
            <p className="text-muted-foreground text-sm">
              Einige Antworten werden noch von einem Lehrer geprüft.
            </p>
          )}
        </CardContent>
      </Card>

      {exercise.questions.map((q, idx) => {
        const res = responseMap.get(q.id)
        const score = res?.finalScore ?? res?.autoScore ?? 0
        const max = q.points
        const correct = score >= max
        const pending = res?.needsReview

        return (
          <Card key={q.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">Frage {idx + 1}</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm tabular-nums">
                    {score}/{max}
                  </span>
                  {pending ? (
                    <Clock className="text-amber-600 size-5" />
                  ) : correct ? (
                    <CheckCircle2 className="text-emerald-600 size-5" />
                  ) : (
                    <XCircle className="text-destructive size-5" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <LexicalContentEditor
                initialData={parseLexicalJson(q.prompt)}
                editable={false}
              />
              {res?.feedback && (
                <p
                  className={cn(
                    'rounded-md border px-3 py-2 text-sm',
                    correct
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-border bg-muted/30',
                  )}
                >
                  {typeof res.feedback === 'string'
                    ? res.feedback
                    : String(res.feedback)}
                </p>
              )}
              {q.explanation && (
                <div className="border-border/50 rounded-md border p-3">
                  <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                    Erklärung
                  </p>
                  <LexicalContentEditor
                    initialData={parseLexicalJson(q.explanation)}
                    editable={false}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
