'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock, Lock, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { QuestionCard, type ExerciseProgress } from '@/components/exercises/question-card'
import { LexicalContentEditor, parseLexicalJson } from '@/components/lexical/lexical-content-editor'
import { Progress } from '@/components/ui/progress'
import type { PublicQuestion, QuestionState } from '@/lib/exercises/public-question'
import 'mathlive/static.css'
import '@/app/(protected)/admin/quests/[courseId]/chapters/[chapterId]/_components/editor/theme.css'

type ProgressState = NonNullable<ExerciseProgress>

/** A separate Aufgabe: each question is checked on its own; a summary appears when all are answered. */
export function ExerciseRunner({
  intro,
  xpReward,
  questions,
  initialProgress,
  xpAwarded,
  nextHref,
}: {
  intro: unknown
  xpReward: number
  questions: { question: PublicQuestion; state: QuestionState }[]
  initialProgress: ProgressState | null
  xpAwarded: number | null
  /** Next chapter or Aufgabe of the quest. */
  nextHref?: string
}) {
  const maxScore = questions.reduce((s, q) => s + q.question.points, 0)
  const [progress, setProgress] = useState<ProgressState>(
    initialProgress ?? { checked: 0, total: questions.length, totalScore: 0, maxScore, status: 'IN_PROGRESS' },
  )
  const onProgress = useCallback((p: ExerciseProgress) => p && setProgress(p), [])

  // Passed = every question solved at least once (short answers: submitted).
  const [states, setStates] = useState(
    () => new Map(questions.map(({ question, state }) => [question.id, state])),
  )
  const onStateChange = useCallback(
    (id: string, state: QuestionState) => setStates((prev) => new Map(prev).set(id, state)),
    [],
  )
  const passed = questions.every(({ question }) => {
    const s = states.get(question.id)
    if (!s || s.tries === 0) return false
    return question.kind === 'SHORT_TEXT' || s.correct === true
  })

  const complete = progress.checked === progress.total && progress.total > 0

  return (
    <div className="space-y-6">
      {intro != null && (
        <div className="bg-card rounded-xl border p-4 shadow-sm sm:p-5">
          <LexicalContentEditor initialData={parseLexicalJson(intro)} editable={false} />
        </div>
      )}

      <div className="bg-card space-y-2 rounded-xl border p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium">
            {progress.checked} von {progress.total} Fragen beantwortet
          </span>
          <span className="text-muted-foreground tabular-nums">
            {progress.totalScore}/{progress.maxScore} Punkte
            {xpReward > 0 && ` · bis zu ${xpReward} XP`}
          </span>
        </div>
        <Progress value={progress.total ? (progress.checked / progress.total) * 100 : 0} />
      </div>

      {questions.map(({ question, state }, i) => (
        <QuestionCard
          key={question.id}
          question={question}
          initialState={state}
          label={`Frage ${i + 1}`}
          onProgress={onProgress}
          onStateChange={onStateChange}
        />
      ))}

      {complete && !passed && (
        <div className="flex items-start gap-3 rounded-xl border border-sky-500/40 bg-sky-500/10 p-4 text-sm">
          <Lock className="mt-0.5 size-5 shrink-0 text-sky-700" />
          <p>
            <strong>Fast geschafft!</strong> Beantworte alle Fragen richtig, um die Aufgabe zu
            bestehen und das nächste Kapitel freizuschalten. XP zählen trotzdem nur für den ersten
            Versuch.
          </p>
        </div>
      )}

      {complete && passed && (
        <div
          className={
            progress.status === 'NEEDS_REVIEW'
              ? 'flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4'
              : 'flex items-start gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4'
          }
        >
          {progress.status === 'NEEDS_REVIEW' ? (
            <Clock className="mt-0.5 size-5 shrink-0 text-amber-600" />
          ) : (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
          )}
          <div className="space-y-1 text-sm">
            <p className="font-semibold">
              {progress.status === 'NEEDS_REVIEW'
                ? 'Aufgabe bestanden! Deine Lehrkraft prüft noch eine Antwort – das nächste Kapitel ist schon frei.'
                : `Aufgabe bestanden: ${progress.totalScore}/${progress.maxScore} Punkte – das nächste Kapitel ist frei.`}
            </p>
            {progress.status === 'GRADED' && xpReward > 0 && (
              <p className="text-muted-foreground flex items-center gap-1">
                <Sparkles className="size-3.5" />
                {xpAwarded != null
                  ? `${xpAwarded} XP erhalten`
                  : 'XP werden gutgeschrieben'}
              </p>
            )}
          </div>
          {nextHref && (
            <Button asChild size="sm" className="ml-auto shrink-0 gap-1.5 self-center">
              <Link href={nextHref}>
                Weiter
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
