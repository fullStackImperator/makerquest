'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Settings2, Trash2, Wand2 } from 'lucide-react'
import { toast } from 'sonner'

import { saveFinalAssessment, saveRubric, setCourseXp } from '@/actions/journal-teacher'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { RubricLevel } from '@/generated/enums'
import { cn } from '@/lib/utils'
import {
  formatJournalDate,
  formatJournalDateTime,
  RUBRIC_LEVEL_CLASS,
  RUBRIC_LEVEL_LABEL,
  RUBRIC_LEVELS,
  suggestOverallLevel,
} from '@/lib/journal/shared'
import type { ExerciseSummary } from '@/lib/exercises/teacher-queries'
import type {
  FinalAssessmentView,
  RubricCriterionView,
  WorkspaceStudentRow,
} from '@/lib/journal/teacher-queries'

const SHORT_LABEL: Record<RubricLevel, string> = {
  NOT_MET: 'nicht',
  PARTIAL: 'teilweise',
  MET: 'erreicht',
  EXCEEDED: 'übertroffen',
}

export function FinalGradePanel({
  courseId,
  student,
  rubric,
  assessment,
  exerciseSummary,
}: {
  courseId: string
  student: WorkspaceStudentRow
  rubric: RubricCriterionView[]
  assessment: FinalAssessmentView
  exerciseSummary: ExerciseSummary
}) {
  const router = useRouter()
  const [scores, setScores] = useState<Record<string, RubricLevel>>(assessment.scores)
  const [overall, setOverall] = useState<RubricLevel | null>(assessment.overallLevel)
  const [comment, setComment] = useState(assessment.comment)
  const [rubricOpen, setRubricOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const suggestion = suggestOverallLevel(
    rubric.map((c) => scores[c.id]).filter((l): l is RubricLevel => !!l),
  )

  const save = () =>
    startTransition(async () => {
      const result = await saveFinalAssessment({
        courseId,
        userId: student.userId,
        overallLevel: overall,
        comment,
        scores: Object.entries(scores).map(([criterionId, level]) => ({ criterionId, level })),
      })
      if (!result.success) return void toast.error(result.error)
      toast.success('Bewertung gespeichert')
      router.refresh()
    })

  const toggleXp = () =>
    startTransition(async () => {
      const result = await setCourseXp(courseId, student.userId, !assessment.courseXpAwarded)
      if (!result.success) return void toast.error(result.error)
      toast.success(assessment.courseXpAwarded ? 'Quest-XP zurückgenommen' : 'Quest-XP vergeben')
      router.refresh()
    })

  return (
    <div className="space-y-5 p-4">
      <section className="space-y-2">
        <h2 className="text-lg font-semibold leading-tight">{student.name}</h2>
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <Stat label="Kapitel" value={`${student.chaptersCompleted} / ${student.chaptersTotal}`} />
          <Stat label="Einträge" value={`${student.entryCount} (${student.readyCount} offen)`} />
          <Stat label="Eingeschrieben" value={formatJournalDate(student.enrolledAt)} />
          <Stat
            label="Letzte Einreichung"
            value={student.lastActivity ? formatJournalDate(student.lastActivity) : '—'}
          />
          {(student.klasse || student.jahrgang) && (
            <Stat
              label="Klasse / Jahrgang"
              value={[student.klasse, student.jahrgang].filter(Boolean).join(' · ')}
            />
          )}
        </dl>
      </section>

      {exerciseSummary.total > 0 && <ExerciseSummarySection summary={exerciseSummary} />}

      <section className="space-y-4 border-t pt-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Abschlussbewertung</h3>
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground h-7 gap-1 px-2 text-xs"
            onClick={() => setRubricOpen(true)}
          >
            <Settings2 className="size-3.5" />
            Kriterien
          </Button>
        </div>

        {rubric.map((criterion) => (
          <div key={criterion.id} className="space-y-1.5">
            <div>
              <p className="text-sm font-medium">{criterion.label}</p>
              {criterion.description && (
                <p className="text-muted-foreground text-xs">{criterion.description}</p>
              )}
            </div>
            <LevelPicker
              value={scores[criterion.id] ?? null}
              onChange={(level) =>
                setScores((prev) => {
                  const next = { ...prev }
                  if (level) next[criterion.id] = level
                  else delete next[criterion.id]
                  return next
                })
              }
            />
          </div>
        ))}

        <div className="bg-muted/40 space-y-1.5 rounded-lg p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Gesamt</p>
            {suggestion && suggestion !== overall && (
              <button
                type="button"
                onClick={() => setOverall(suggestion)}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
              >
                <Wand2 className="size-3" />
                Vorschlag: {RUBRIC_LEVEL_LABEL[suggestion]}
              </button>
            )}
          </div>
          <LevelPicker value={overall} onChange={setOverall} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="final-comment">Kommentar für den Schüler</Label>
          <Textarea
            id="final-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={5000}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs">
            {assessment.gradedAt
              ? `Bewertet ${formatJournalDateTime(assessment.gradedAt)}${assessment.gradedByName ? ` von ${assessment.gradedByName}` : ''}`
              : 'Noch nicht bewertet'}
          </p>
          <Button onClick={save} disabled={pending} className="gap-1.5">
            {pending && <Loader2 className="size-4 animate-spin" />}
            Speichern
          </Button>
        </div>
      </section>

      <section className="flex items-center justify-between gap-2 border-t pt-4">
        <div>
          <p className="text-sm font-medium">Quest-XP</p>
          <p className="text-muted-foreground text-xs">
            {assessment.courseXpAwarded ? 'Vergeben' : 'Noch nicht vergeben'}
          </p>
        </div>
        <Button
          size="sm"
          variant={assessment.courseXpAwarded ? 'outline' : 'secondary'}
          disabled={pending}
          onClick={toggleXp}
        >
          {assessment.courseXpAwarded ? 'Zurücknehmen' : 'XP vergeben'}
        </Button>
      </section>

      <RubricDialog
        key={rubric.map((c) => c.id).join()}
        open={rubricOpen}
        onOpenChange={setRubricOpen}
        courseId={courseId}
        rubric={rubric}
      />
    </div>
  )
}

function ExerciseSummarySection({ summary: s }: { summary: ExerciseSummary }) {
  const percent = s.maxPoints > 0 ? Math.round((s.points / s.maxPoints) * 100) : 0
  return (
    <section className="space-y-2 border-t pt-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">Aufgaben</h3>
        {s.pendingReview > 0 && (
          <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
            {s.pendingReview} {s.pendingReview === 1 ? 'Antwort offen' : 'Antworten offen'}
          </span>
        )}
      </div>
      <div className="bg-muted h-1.5 overflow-hidden rounded-full">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
      </div>
      <dl className="grid grid-cols-3 gap-2 text-xs">
        <Stat label="Punkte" value={`${s.points} / ${s.maxPoints} (${percent} %)`} />
        <Stat label="Bewertet" value={`${s.graded} / ${s.total}`} />
        <Stat label="XP" value={String(s.xp)} />
      </dl>
      <p className="text-muted-foreground text-[11px]">
        Punkte aus dem ersten Versuch bzw. der Bewertung der Lehrkraft. Offene Antworten zählen noch nicht.
      </p>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-md px-2 py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  )
}

function LevelPicker({
  value,
  onChange,
}: {
  value: RubricLevel | null
  onChange: (level: RubricLevel | null) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-1" role="radiogroup">
      {RUBRIC_LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          role="radio"
          aria-checked={value === level}
          title={RUBRIC_LEVEL_LABEL[level]}
          onClick={() => onChange(value === level ? null : level)}
          className={cn(
            'rounded-md border px-1 py-1.5 text-[11px] font-medium transition-colors',
            value === level
              ? RUBRIC_LEVEL_CLASS[level]
              : 'border-border/60 text-muted-foreground hover:bg-muted',
          )}
        >
          {SHORT_LABEL[level]}
        </button>
      ))}
    </div>
  )
}

function RubricDialog({
  open,
  onOpenChange,
  courseId,
  rubric,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  rubric: RubricCriterionView[]
}) {
  const router = useRouter()
  const [criteria, setCriteria] = useState(
    rubric.map((c) => ({ id: c.id as string | undefined, label: c.label, description: c.description ?? '' })),
  )
  const [pending, startTransition] = useTransition()

  const update = (index: number, field: 'label' | 'description', value: string) =>
    setCriteria((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)))

  const save = () =>
    startTransition(async () => {
      const result = await saveRubric({ courseId, criteria })
      if (!result.success) return void toast.error(result.error)
      toast.success('Kriterien gespeichert')
      onOpenChange(false)
      router.refresh()
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bewertungskriterien</DialogTitle>
          <DialogDescription>
            Gilt für alle Schüler dieses Quests. Entfernte Kriterien verlieren ihre Bewertungen.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {criteria.map((c, index) => (
            <div key={c.id ?? `new-${index}`} className="flex gap-2">
              <div className="flex-1 space-y-1.5">
                <Input
                  value={c.label}
                  onChange={(e) => update(index, 'label', e.target.value)}
                  placeholder="Name"
                  maxLength={80}
                />
                <Input
                  value={c.description}
                  onChange={(e) => update(index, 'description', e.target.value)}
                  placeholder="Beschreibung (optional)"
                  maxLength={300}
                  className="text-xs"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Kriterium entfernen"
                disabled={criteria.length <= 1}
                onClick={() => setCriteria((prev) => prev.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="outline"
            className="gap-1.5"
            disabled={criteria.length >= 10}
            onClick={() => setCriteria((prev) => [...prev, { id: undefined, label: '', description: '' }])}
          >
            <Plus className="size-4" />
            Kriterium
          </Button>
          <Button onClick={save} disabled={pending} className="gap-1.5">
            {pending && <Loader2 className="size-4 animate-spin" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
