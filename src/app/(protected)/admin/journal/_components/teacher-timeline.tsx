'use client'

import { useEffect } from 'react'
import { NotebookPen } from 'lucide-react'

import type { TeacherJournalEntryView } from '@/lib/journal/teacher-queries'
import { TeacherEntry } from './teacher-entry'

/** A student's submitted entries, oldest on top; opens at the first one waiting for review. */
export function TeacherTimeline({ entries }: { entries: TeacherJournalEntryView[] }) {
  const firstReadyId = entries.find((e) => e.status === 'READY')?.id

  useEffect(() => {
    if (!firstReadyId) return
    document
      .getElementById(`entry-${firstReadyId}`)
      ?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [firstReadyId])

  if (entries.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 px-6 py-16 text-center text-sm">
        <NotebookPen className="size-7" aria-hidden />
        Noch keine eingereichten Einträge.
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      {entries.map((entry) => (
        <TeacherEntry
          key={`${entry.id}-${entry.versions.length}`}
          entry={entry}
          highlighted={entry.id === firstReadyId}
        />
      ))}
    </div>
  )
}
