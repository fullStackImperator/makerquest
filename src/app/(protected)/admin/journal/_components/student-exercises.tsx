'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Hourglass,
  Loader2,
  Pencil,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { reviewExerciseResponse } from '@/actions/exercise-review'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { QUESTION_KIND_LABELS } from '@/lib/exercises/types'
import type { TeacherExerciseView, TeacherQuestionView } from '@/lib/exercises/teacher-queries'
import { cn } from '@/lib/utils'

const STATUS: Record<NonNullable<TeacherExerciseView['status']> | 'NONE', { label: string; className: string }> = {
  NONE: { label: 'Nicht begonnen', className: 'text-muted-foreground' },
  IN_PROGRESS: { label: 'In Arbeit', className: 'text-sky-700 dark:text-sky-300' },
  SUBMITTED: { label: 'Abgegeben', className: 'text-sky-700 dark:text-sky-300' },
  NEEDS_REVIEW: { label: 'Wartet auf Prüfung', className: 'text-amber-700 dark:text-amber-300' },
  GRADED: { label: 'Bewertet', className: 'text-emerald-700 dark:text-emerald-300' },
}

/** A student's Aufgaben in the quest; open short answers can be graded in place. */
export function StudentExercises({
  courseId,
  exercises,
}: {
  courseId: string
  exercises: TeacherExerciseView[]
}) {
  const firstPendingId = exercises.flatMap((e) => e.questions).find((q) => q.needsReview)?.id

  useEffect(() => {
    if (!firstPendingId) return
    document
      .getElementById(`question-${firstPendingId}`)
      ?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [firstPendingId])

  if (exercises.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 px-6 py-16 text-center text-sm">
        <ClipboardList className="size-7" aria-hidden />
        Dieser Quest hat noch keine Aufgaben.
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      {exercises.map((exercise) => (
        <ExerciseCard key={exercise.id} courseId={courseId} exercise={exercise} />
      ))}
    </div>
  )
}

function ExerciseCard({ courseId, exercise }: { courseId: string; exercise: TeacherExerciseView }) {
  const status = STATUS[exercise.status ?? 'NONE']
  const started = exercise.questions.some((q) => q.tries > 0)

  return (
    <article className="bg-card rounded-xl border shadow-sm">
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b px-4 py-3">
        {exercise.source === 'chapter' ? (
          <BookOpen className="text-muted-foreground size-4" aria-hidden />
        ) : (
          <ClipboardList className="size-4 text-sky-600" aria-hidden />
        )}
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">
          {exercise.source === 'chapter' && <span className="text-muted-foreground font-normal">Kapitel · </span>}
          {exercise.title}
        </h3>
        {!exercise.isPublished && <Badge variant="outline">Entwurf</Badge>}
        <span className={cn('text-xs font-medium', status.className)}>{status.label}</span>
        {started && (
          <span className="text-muted-foreground text-xs tabular-nums">
            {exercise.totalScore}/{exercise.maxScore} Pkt
            {exercise.xpAwarded != null && ` · ${exercise.xpAwarded} XP`}
          </span>
        )}
      </header>

      {started ? (
        <ol className="divide-y">
          {exercise.questions.map((q, index) => (
            <QuestionRow key={q.id} courseId={courseId} question={q} index={index + 1} />
          ))}
        </ol>
      ) : (
        <p className="text-muted-foreground px-4 py-3 text-xs">
          {exercise.questions.length} {exercise.questions.length === 1 ? 'Frage' : 'Fragen'} ·{' '}
          {exercise.maxScore} Punkte
        </p>
      )}
    </article>
  )
}

function QuestionRow({
  courseId,
  question: q,
  index,
}: {
  courseId: string
  question: TeacherQuestionView
  index: number
}) {
  const answered = q.tries > 0
  const [editing, setEditing] = useState(false)
  // Only grades a teacher gave can be changed; auto-graded answers keep their first-try points.
  const canChange = q.reviewed && !q.needsReview && !!q.responseId

  return (
    <li id={`question-${q.id}`} className="scroll-mt-4 space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground tabular-nums">{index}.</span>
        <Badge variant="secondary">{QUESTION_KIND_LABELS[q.kind]}</Badge>
        <span className="ml-auto flex items-center gap-2">
          {answered && q.tries > 1 && (
            <span className="text-muted-foreground">{q.tries} Versuche</span>
          )}
          <ScoreChip question={q} />
        </span>
      </div>

      {q.prompt && <p className="line-clamp-2 text-sm">{q.prompt}</p>}

      {answered ? (
        <div className="space-y-1.5 text-sm">
          <AnswerBlock label="Antwort" lines={q.answer} className="bg-muted/40" />
          {q.expected.length > 0 && q.correct !== true && (
            <AnswerBlock label="Erwartet" lines={q.expected} className="text-muted-foreground" />
          )}
          {q.feedback && !q.needsReview && !editing && (
            <p className="text-muted-foreground text-xs">
              <span className="font-medium">Feedback:</span> {q.feedback}
            </p>
          )}
          {canChange && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline"
            >
              <Pencil className="size-3" aria-hidden />
              Bewertung ändern
            </button>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs italic">Noch nicht beantwortet</p>
      )}

      {q.needsReview && q.responseId && (
        <ReviewForm courseId={courseId} responseId={q.responseId} question={q} />
      )}
      {editing && q.responseId && (
        <ReviewForm
          courseId={courseId}
          responseId={q.responseId}
          question={q}
          onClose={() => setEditing(false)}
        />
      )}
    </li>
  )
}

function ScoreChip({ question: q }: { question: TeacherQuestionView }) {
  if (q.needsReview) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 font-medium text-amber-800 dark:text-amber-200">
        <Hourglass className="size-3" aria-hidden />
        offen · max {q.points}
      </span>
    )
  }
  if (q.score == null) return <span className="text-muted-foreground">– / {q.points}</span>
  const full = q.score >= q.points
  const Icon = full ? CheckCircle2 : XCircle
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium tabular-nums',
        full
          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
          : 'bg-muted text-foreground',
      )}
      title={q.reviewed ? 'Von der Lehrkraft bewertet' : 'Punkte aus dem ersten Versuch'}
    >
      <Icon className="size-3" aria-hidden />
      {q.score}/{q.points}
    </span>
  )
}

function AnswerBlock({ label, lines, className }: { label: string; lines: string[]; className?: string }) {
  return (
    <div className={cn('rounded-md px-3 py-2', className)}>
      <p className="text-muted-foreground mb-0.5 text-[11px] font-medium uppercase tracking-wide">{label}</p>
      {lines.length === 0 ? (
        <p className="italic">(leer)</p>
      ) : (
        lines.map((line, i) => (
          <p key={i} className="break-words whitespace-pre-wrap">
            {line}
          </p>
        ))
      )}
    </div>
  )
}

function ReviewForm({
  courseId,
  responseId,
  question: q,
  onClose,
}: {
  courseId: string
  responseId: string
  question: TeacherQuestionView
  /** Set when changing an earlier grade; closes the form. */
  onClose?: () => void
}) {
  const router = useRouter()
  const regrade = !!onClose
  const [score, setScore] = useState(String((regrade ? q.score : q.ai?.score) ?? ''))
  const [feedback, setFeedback] = useState((regrade ? q.feedback : q.ai?.feedback) ?? '')
  const [pending, startTransition] = useTransition()

  const points = Number(score)
  const valid = score !== '' && Number.isInteger(points) && points >= 0 && points <= q.points

  const save = () =>
    startTransition(async () => {
      const result = await reviewExerciseResponse({ courseId, responseId, score: points, feedback })
      if (!result.success) return void toast.error(result.error)
      toast.success(regrade ? 'Bewertung geändert' : 'Antwort bewertet')
      onClose?.()
      router.refresh()
    })

  return (
    <div
      className={cn(
        'space-y-3 rounded-lg border p-3',
        regrade ? 'bg-muted/30' : 'border-amber-500/40 bg-amber-500/5',
      )}
    >
      {regrade ? (
        <p className="text-muted-foreground text-xs">
          Punkte und XP des Schülers werden neu berechnet, auch bereits ausgezahlte XP.
        </p>
      ) : q.ai ? (
        <div className="space-y-1 text-xs">
          <p className="flex items-center gap-1 font-medium text-amber-900 dark:text-amber-100">
            <Sparkles className="size-3.5" aria-hidden />
            KI-Vorschlag: {q.ai.score}/{q.points} Punkte
          </p>
          <p className="text-muted-foreground">{q.ai.feedback}</p>
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">Kein KI-Vorschlag vorhanden.</p>
      )}

      <div className="flex items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor={`score-${q.id}`} className="text-xs">
            Punkte (0–{q.points})
          </Label>
          <Input
            id={`score-${q.id}`}
            type="number"
            min={0}
            max={q.points}
            step={1}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-24"
          />
        </div>
        <div className="flex gap-1">
          {[0, q.points].map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant="outline"
              className="h-9"
              onClick={() => setScore(String(value))}
            >
              {value === 0 ? '0' : 'Voll'}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`feedback-${q.id}`} className="text-xs">
          Feedback für den Schüler (optional)
        </Label>
        <Textarea
          id={`feedback-${q.id}`}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={2}
          maxLength={2000}
        />
      </div>

      <div className="flex justify-end gap-2">
        {regrade && (
          <Button size="sm" variant="ghost" onClick={onClose} disabled={pending}>
            Abbrechen
          </Button>
        )}
        <Button size="sm" onClick={save} disabled={pending || !valid} className="gap-1.5">
          {pending && <Loader2 className="size-4 animate-spin" />}
          {regrade ? 'Änderung speichern' : 'Bewerten'}
        </Button>
      </div>
    </div>
  )
}
