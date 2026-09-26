'use client'

import { useCallback, useState, useTransition } from 'react'
import { CheckCircle2, Clock, Loader2, RotateCcw, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import 'mathlive/static.css'
import '@/app/(protected)/admin/quests/[courseId]/chapters/[chapterId]/_components/editor/theme.css'

import { checkAnswer, type CheckAnswerResult } from '@/actions/exercise-check'
import { LexicalContentEditor, parseLexicalJson } from '@/components/lexical/lexical-content-editor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PublicQuestion, QuestionState } from '@/lib/exercises/public-question'
import { QUESTION_KIND_LABELS, type H5pAnswer, type QuestionAnswer } from '@/lib/exercises/types'
import { DragDropInput } from './questions/drag-drop'
import { FillBlankInput } from './questions/fill-blank'
import { H5pInput } from './questions/h5p'
import { MathInput } from './questions/math'
import { McSingleInput } from './questions/mc-single'
import { ShortTextInput } from './questions/short-text'

export type ExerciseProgress = Extract<CheckAnswerResult, { success: true }>['progress']

function hasAnswer(question: PublicQuestion, answer: QuestionAnswer | null) {
  if (!answer) return false
  switch (question.kind) {
    case 'MC_SINGLE':
      return !!(answer as { optionId?: string }).optionId
    case 'FILL_BLANK':
      return Object.values((answer as { values?: Record<string, string> }).values ?? {}).some((v) => v.trim())
    case 'SHORT_TEXT':
      return !!(answer as { text?: string }).text?.trim()
    case 'MATH':
      return !!(answer as { latex?: string }).latex?.trim()
    default:
      return true
  }
}

/**
 * One question with its own "Prüfen": immediate feedback, retries until
 * correct, points only for the first try. Used in Aufgaben and chapters.
 */
export function QuestionCard({
  question,
  initialState,
  label,
  onProgress,
  onStateChange,
}: {
  question: PublicQuestion
  initialState: QuestionState
  /** e.g. "Frage 2" */
  label?: string
  onProgress?: (progress: ExerciseProgress) => void
  /** Reports the new state after each check (e.g. to know when all are solved). */
  onStateChange?: (questionId: string, state: QuestionState) => void
}) {
  const [state, setState] = useState(initialState)
  const [answer, setAnswer] = useState<QuestionAnswer | null>(initialState.answer)
  const [pending, startTransition] = useTransition()

  const isShortText = question.kind === 'SHORT_TEXT'
  const locked = state.correct === true || (isShortText && state.tries > 0)
  // A retry after a wrong answer: the result shown belongs to the last check.
  const [dirtySinceCheck, setDirtySinceCheck] = useState(false)

  const check = useCallback(
    (value: QuestionAnswer | null) => {
      if (!value) return
      startTransition(async () => {
        const result = await checkAnswer(question.id, JSON.stringify(value))
        if (!result.success) return void toast.error(result.error)
        setState(result.state)
        setDirtySinceCheck(false)
        onStateChange?.(question.id, result.state)
        if (result.progress) onProgress?.(result.progress)
      })
    },
    [question.id, onProgress, onStateChange],
  )

  const update = (value: QuestionAnswer) => {
    setAnswer(value)
    setDirtySinceCheck(true)
  }

  // H5P reports its own result; check it right away.
  const onH5pAnswer = useCallback(
    (value: H5pAnswer) => {
      setAnswer(value)
      check(value)
    },
    [check],
  )

  const showResult = state.tries > 0 && !(dirtySinceCheck && !locked)
  // An untouched ordering task: the displayed order is the answer.
  const effectiveAnswer: QuestionAnswer | null =
    answer ??
    (question.kind === 'DRAG_DROP' && question.spec.mode === 'ordering'
      ? { order: question.spec.items.map((i) => i.id) }
      : null)

  return (
    <div className="bg-card space-y-4 rounded-xl border p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{label ?? 'Frage'}</p>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs tabular-nums">
            {question.xp > 0
              ? `bis zu ${question.xp} XP`
              : `${question.points} ${question.points === 1 ? 'Punkt' : 'Punkte'}`}
          </span>
          <Badge variant="secondary">{QUESTION_KIND_LABELS[question.kind]}</Badge>
        </div>
      </div>

      <LexicalContentEditor initialData={parseLexicalJson(question.prompt)} editable={false} />

      <QuestionInput
        question={question}
        answer={answer}
        onAnswer={update}
        onH5pAnswer={onH5pAnswer}
        disabled={locked || pending}
      />

      {showResult && <ResultBanner question={question} state={state} />}

      {state.explanation != null && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase tracking-wide">Erklärung</p>
          <LexicalContentEditor initialData={parseLexicalJson(state.explanation)} editable={false} />
        </div>
      )}

      {!locked && question.kind !== 'H5P' && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => check(effectiveAnswer)}
            disabled={pending || !hasAnswer(question, effectiveAnswer)}
            className="gap-1.5"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : state.tries > 0 ? (
              <RotateCcw className="size-4" />
            ) : null}
            {isShortText ? 'Abschicken' : state.tries > 0 ? 'Nochmal prüfen' : 'Prüfen'}
          </Button>
          {isShortText && state.tries === 0 && (
            <p className="text-muted-foreground text-xs">
              Du kannst deine Antwort nur einmal abschicken. Deine Lehrkraft bewertet sie.
            </p>
          )}
          {!isShortText && state.tries === 0 && (
            <p className="text-muted-foreground text-xs">
              {question.xp > 0 ? 'XP' : 'Punkte'} gibt es nur für den ersten Versuch.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function ResultBanner({ question, state }: { question: PublicQuestion; state: QuestionState }) {
  const max = question.points
  // XP earned for this question: its XP share × share of points reached.
  const earned = (points: number | null) =>
    max > 0 ? Math.round((question.xp * (points ?? 0)) / max) : 0
  const reward = (points: number | null) =>
    question.xp > 0
      ? `${earned(points)} XP`
      : `${points ?? 0}/${max} ${max === 1 ? 'Punkt' : 'Punkte'}`

  if (state.pending) {
    return (
      <Banner tone="amber" icon={Clock}>
        Abgeschickt – deine Lehrkraft prüft deine Antwort.
      </Banner>
    )
  }

  if (question.kind === 'SHORT_TEXT') {
    return (
      <Banner tone={state.points === max ? 'green' : 'neutral'} icon={CheckCircle2}>
        Bewertet: {reward(state.points)}
        {state.feedback && <span className="mt-1 block font-normal">{state.feedback}</span>}
      </Banner>
    )
  }

  if (state.correct) {
    return (
      <Banner tone="green" icon={CheckCircle2}>
        {state.tries === 1
          ? `Richtig! +${reward(state.points ?? max)}`
          : question.xp > 0
            ? `Richtig! XP gibt es nur beim ersten Versuch: ${reward(state.points)}.`
            : `Richtig! Punkte gab es nur beim ersten Versuch: ${reward(state.points)}.`}
      </Banner>
    )
  }

  return (
    <Banner tone="red" icon={XCircle}>
      Leider nicht richtig – versuch es noch einmal.
      <span className="mt-1 block text-xs font-normal">
        {question.xp > 0 ? 'XP' : 'Punkte'} (erster Versuch): {reward(state.points)} · {state.tries}{' '}
        {state.tries === 1 ? 'Versuch' : 'Versuche'}
        {question.kind === 'H5P' && state.feedback ? ` · ${state.feedback}` : ''}
      </span>
    </Banner>
  )
}

function Banner({
  tone,
  icon: Icon,
  children,
}: {
  tone: 'green' | 'red' | 'amber' | 'neutral'
  icon: typeof Clock
  children: React.ReactNode
}) {
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium',
        tone === 'green' && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
        tone === 'red' && 'border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-200',
        tone === 'amber' && 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100',
        tone === 'neutral' && 'border-border bg-muted/40',
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}

function QuestionInput({
  question,
  answer,
  onAnswer,
  onH5pAnswer,
  disabled,
}: {
  question: PublicQuestion
  answer: QuestionAnswer | null
  onAnswer: (a: QuestionAnswer) => void
  onH5pAnswer: (a: H5pAnswer) => void
  disabled: boolean
}) {
  switch (question.kind) {
    case 'MC_SINGLE':
      return (
        <McSingleInput
          questionId={question.id}
          spec={question.spec}
          value={(answer as { optionId?: string } | null)?.optionId}
          onChange={(optionId) => onAnswer({ optionId })}
          disabled={disabled}
        />
      )
    case 'FILL_BLANK':
      return (
        <FillBlankInput
          spec={question.spec}
          values={(answer as { values?: Record<string, string> } | null)?.values ?? {}}
          onChange={(values) => onAnswer({ values })}
          disabled={disabled}
        />
      )
    case 'SHORT_TEXT':
      return (
        <ShortTextInput
          spec={question.spec}
          value={(answer as { text?: string } | null)?.text ?? ''}
          onChange={(text) => onAnswer({ text })}
          disabled={disabled}
        />
      )
    case 'MATH':
      return (
        <MathInput
          value={(answer as { latex?: string } | null)?.latex ?? ''}
          onChange={(latex) => onAnswer({ latex })}
          disabled={disabled}
        />
      )
    case 'DRAG_DROP':
      return (
        <DragDropInput
          spec={question.spec}
          value={(answer as { order?: string[]; pairs?: Record<string, string> } | null) ?? {}}
          onChange={(v) => onAnswer(v.order ? { order: v.order } : { pairs: v.pairs ?? {} })}
          disabled={disabled}
        />
      )
    case 'H5P':
      return (
        <H5pInput
          spec={question.spec}
          value={answer as H5pAnswer | undefined}
          onAnswer={onH5pAnswer}
          disabled={disabled}
        />
      )
  }
}
