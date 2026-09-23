import { Award } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  formatJournalDate,
  RUBRIC_LEVEL_CLASS,
  RUBRIC_LEVEL_LABEL,
} from '@/lib/journal/shared'
import type { StudentFinalGrade } from '@/lib/journal/queries'

/** The teacher's final assessment of a quest journal, as the student sees it. */
export function JournalFinalGradeCard({ grade }: { grade: StudentFinalGrade }) {
  return (
    <section className="border-border/60 bg-card space-y-4 rounded-xl border p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-700 dark:text-violet-300">
          <Award className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-widest">
            Abschlussbewertung
          </p>
          <p className="text-muted-foreground text-xs">
            {grade.gradedByName} · {formatJournalDate(grade.gradedAt)}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full border px-3 py-1 text-sm font-semibold',
            RUBRIC_LEVEL_CLASS[grade.overallLevel],
          )}
        >
          {RUBRIC_LEVEL_LABEL[grade.overallLevel]}
        </span>
      </div>

      {grade.scores.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {grade.scores.map((s) => (
            <li
              key={s.label}
              className="border-border/50 flex items-start justify-between gap-2 rounded-lg border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{s.label}</p>
                {s.description && (
                  <p className="text-muted-foreground text-xs">{s.description}</p>
                )}
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                  RUBRIC_LEVEL_CLASS[s.level],
                )}
              >
                {RUBRIC_LEVEL_LABEL[s.level]}
              </span>
            </li>
          ))}
        </ul>
      )}

      {grade.comment && (
        <p className="bg-muted/50 rounded-lg px-3 py-2 text-sm whitespace-pre-wrap">
          {grade.comment}
        </p>
      )}
    </section>
  )
}
