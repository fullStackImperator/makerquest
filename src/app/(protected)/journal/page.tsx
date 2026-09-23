import Link from 'next/link'
import { redirect } from 'next/navigation'
import { NotebookPen } from 'lucide-react'

import { getSessionUser } from '@/lib/get-session-user'
import {
  getJournalQuestGroups,
  getStudentFinalGrade,
  getStudentJournalEntries,
} from '@/lib/journal/queries'
import { JournalFinalGradeCard } from '@/components/journal/journal-final-grade-card'
import { JournalTimeline } from '@/components/journal/journal-timeline'
import { cn } from '@/lib/utils'

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ quest?: string }>
}) {
  const user = await getSessionUser()
  if (!user) redirect('/')

  const { quest } = await searchParams
  const [groups, allEntries] = await Promise.all([
    getJournalQuestGroups(user.id),
    getStudentJournalEntries(user.id),
  ])

  // Quests the student can write for, plus any quest they already have entries in.
  const questTitles = new Map<string, string>()
  for (const g of groups) for (const q of g.quests) questTitles.set(q.id, q.title)
  for (const e of allEntries) questTitles.set(e.courseId, e.courseTitle)

  const activeQuest = quest && questTitles.has(quest) ? quest : undefined
  const entries = activeQuest
    ? allEntries.filter((e) => e.courseId === activeQuest)
    : allEntries
  const reviseCount = entries.filter((e) => e.status === 'REVISE').length
  const finalGrade = activeQuest ? await getStudentFinalGrade(user.id, activeQuest) : null

  const newHref = `/journal/new${activeQuest ? `?quest=${activeQuest}` : ''}`

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-10">
      <header className="flex items-start gap-3">
        <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
          <NotebookPen className="size-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Journal</h1>
          <p className="text-muted-foreground text-sm">
            Dokumentiere deine Projekte Schritt für Schritt. Eingereichte
            Einträge sieht deine Lehrkraft.
          </p>
        </div>
      </header>

      {questTitles.size > 1 && (
        <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Nach Quest filtern">
          <FilterLink href="/journal" active={!activeQuest}>
            Alle
          </FilterLink>
          {[...questTitles].map(([id, title]) => (
            <FilterLink key={id} href={`/journal?quest=${id}`} active={activeQuest === id}>
              {title}
            </FilterLink>
          ))}
        </nav>
      )}

      {reviseCount > 0 && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {reviseCount === 1
            ? '1 Eintrag soll überarbeitet werden.'
            : `${reviseCount} Einträge sollen überarbeitet werden.`}
        </p>
      )}

      {finalGrade && <JournalFinalGradeCard grade={finalGrade} />}

      {groups.length === 0 && allEntries.length === 0 ? (
        <p className="border-border/60 bg-muted/20 text-muted-foreground rounded-xl border border-dashed px-6 py-12 text-center text-sm">
          Melde dich zuerst für einen{' '}
          <Link href="/quests" className="text-foreground underline underline-offset-4">
            Quest
          </Link>{' '}
          an, um dein Journal zu beginnen.
        </p>
      ) : (
        <JournalTimeline
          entries={entries}
          basePath="/journal"
          newHref={newHref}
          showQuest={!activeQuest}
        />
      )}
    </section>
  )
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'border-border/60 hover:bg-muted',
      )}
    >
      {children}
    </Link>
  )
}
