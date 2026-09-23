import Link from 'next/link'
import { ChevronRight, NotebookPen } from 'lucide-react'

import { db } from '@/lib/db'

/** Entry point to the quest's journal, with counts that need the student's attention. */
export async function JournalSidebarCard({
  courseId,
  userId,
}: {
  courseId: string
  userId: string
}) {
  const counts = await db.journalEntry.groupBy({
    by: ['status'],
    where: { courseId, userId },
    _count: { _all: true },
  })
  const count = (status: string) =>
    counts.find((c) => c.status === status)?._count._all ?? 0
  const total = counts.reduce((sum, c) => sum + c._count._all, 0)
  const revise = count('REVISE')

  return (
    <Link
      href={`/quests/${courseId}/journal`}
      className="flex items-center gap-3 rounded-lg bg-lime-400 px-3 py-3 text-lime-950 shadow-[0_0_18px_rgba(163,230,53,0.55)] ring-1 ring-lime-300 transition-all hover:bg-lime-300 hover:shadow-[0_0_28px_rgba(163,230,53,0.8)] focus-visible:ring-2 focus-visible:ring-lime-600 focus-visible:outline-none"
    >
      <div className="bg-lime-950/10 flex size-9 shrink-0 items-center justify-center rounded-md">
        <NotebookPen className="size-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">Mein Journal</p>
        <p className="text-xs text-lime-900">
          {total === 0
            ? 'Dokumentiere dein Projekt'
            : `${total} ${total === 1 ? 'Eintrag' : 'Einträge'}`}
        </p>
      </div>
      {revise > 0 && (
        <span
          className="shrink-0 rounded-full bg-lime-950 px-2 py-0.5 text-[11px] font-semibold text-lime-300"
          title={`${revise} zum Überarbeiten`}
        >
          {revise} überarbeiten
        </span>
      )}
      <ChevronRight className="size-4 shrink-0 opacity-80" aria-hidden />
    </Link>
  )
}
