'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { formatJournalDate, RUBRIC_LEVEL_CLASS, RUBRIC_LEVEL_LABEL } from '@/lib/journal/shared'
import type { WorkspaceCourse, WorkspaceStudentRow } from '@/lib/journal/teacher-queries'

const ALL = '__all'
// Anything waiting for the teacher: journal entries and short answers.
const open = (s: WorkspaceStudentRow) => s.readyCount + s.reviewCount
type SortKey = 'ready' | 'name' | 'activity' | 'progress'

export function StudentList({
  courses,
  courseId,
  students,
  selectedUserId,
  tab,
}: {
  courses: WorkspaceCourse[]
  courseId: string | null
  students: WorkspaceStudentRow[]
  selectedUserId: string | null
  /** Kept when switching students. */
  tab: 'journal' | 'aufgaben'
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState(ALL)
  const [sort, setSort] = useState<SortKey>('ready')

  // Filter values like "8b" or "Jahrgang 2026" from the fields on User.
  const groups = useMemo(() => {
    const values = new Set<string>()
    for (const s of students) {
      if (s.klasse) values.add(`klasse:${s.klasse}`)
      if (s.jahrgang) values.add(`jahrgang:${s.jahrgang}`)
    }
    return [...values].sort()
  }, [students])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const [field, value] = group === ALL ? [null, null] : group.split(':')
    return students
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .filter((s) => !field || (field === 'klasse' ? s.klasse : s.jahrgang) === value)
      .sort((a, b) => {
        if (sort === 'ready') return open(b) - open(a) || a.name.localeCompare(b.name, 'de')
        if (sort === 'activity') return (b.lastActivity ?? '').localeCompare(a.lastActivity ?? '')
        if (sort === 'progress') {
          return (
            b.chaptersCompleted + b.exercisesCompleted - (a.chaptersCompleted + a.exercisesCompleted) ||
            a.name.localeCompare(b.name, 'de')
          )
        }
        return a.name.localeCompare(b.name, 'de')
      })
  }, [students, query, group, sort])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2 border-b p-3">
        <Select
          value={courseId ?? undefined}
          onValueChange={(id) => router.push(`/admin/journal?course=${id}`)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Quest auswählen" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="truncate">{c.title}</span>
                {c.readyCount > 0 && (
                  <span className="ml-2 rounded-full bg-sky-500/15 px-1.5 text-[11px] text-sky-700 dark:text-sky-300">
                    {c.readyCount}
                  </span>
                )}
                {c.reviewCount > 0 && (
                  <span className="ml-1 rounded-full bg-amber-500/15 px-1.5 text-[11px] text-amber-800 dark:text-amber-200">
                    {c.reviewCount}
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {courseId && (
          <>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Schüler suchen"
                className="pl-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={group} onValueChange={setGroup} disabled={groups.length === 0}>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Alle Klassen</SelectItem>
                  {groups.map((g) => {
                    const [field, value] = g.split(':')
                    return (
                      <SelectItem key={g} value={g}>
                        {field === 'klasse' ? `Klasse ${value}` : `Jahrgang ${value}`}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ready">Offene zuerst</SelectItem>
                  <SelectItem value="activity">Letzte Aktivität</SelectItem>
                  <SelectItem value="progress">Fortschritt</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!courseId ? (
          <p className="text-muted-foreground p-4 text-sm">Wähle einen Quest aus.</p>
        ) : visible.length === 0 ? (
          <p className="text-muted-foreground p-4 text-sm">
            {students.length === 0 ? 'Noch keine Schüler eingeschrieben.' : 'Keine Treffer.'}
          </p>
        ) : (
          <ul>
            {visible.map((s) => (
              <li key={s.userId}>
                <StudentRow
                  student={s}
                  href={`/admin/journal?course=${courseId}&student=${s.userId}${tab === 'aufgaben' ? '&tab=aufgaben' : ''}`}
                  selected={s.userId === selectedUserId}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StudentRow({
  student: s,
  href,
  selected,
}: {
  student: WorkspaceStudentRow
  href: string
  selected: boolean
}) {
  const done = s.chaptersCompleted + s.exercisesCompleted
  const total = s.chaptersTotal + s.exercisesTotal
  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <Link
      href={href}
      scroll={false}
      aria-current={selected ? 'page' : undefined}
      className={cn(
        'hover:bg-muted/50 block space-y-1.5 border-b px-3 py-2.5 transition-colors',
        selected && 'bg-muted border-l-primary border-l-2',
      )}
    >
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.name}</span>
        {s.readyCount > 0 && (
          <span
            className="rounded-full bg-sky-500 px-1.5 text-[11px] font-semibold text-white tabular-nums"
            title={`${s.readyCount} eingereicht, noch nicht bewertet`}
          >
            {s.readyCount}
          </span>
        )}
        {s.reviewCount > 0 && (
          <span
            className="rounded-full bg-amber-500 px-1.5 text-[11px] font-semibold text-white tabular-nums"
            title={`${s.reviewCount} ${s.reviewCount === 1 ? 'Antwort wartet' : 'Antworten warten'} auf Prüfung`}
          >
            {s.reviewCount}
          </span>
        )}
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
              <div
                className={cn('h-full rounded-full', percent === 100 ? 'bg-emerald-500' : 'bg-primary')}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-muted-foreground text-[11px] tabular-nums">
              {done}/{total} erledigt
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>
            {s.chaptersCompleted} von {s.chaptersTotal} Kapiteln
          </p>
          <p>
            {s.exercisesCompleted} von {s.exercisesTotal} Aufgaben
          </p>
        </TooltipContent>
      </Tooltip>

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
        {s.klasse && <span>{s.klasse}</span>}
        <span title="Eingeschrieben">seit {formatJournalDate(s.enrolledAt)}</span>
        <span title="Letzte Einreichung">
          · {s.lastActivity ? `aktiv ${formatJournalDate(s.lastActivity)}` : 'keine Einträge'}
        </span>
        {s.finalLevel && (
          <span
            className={cn('rounded-full border px-1.5', RUBRIC_LEVEL_CLASS[s.finalLevel])}
            title="Abschlussbewertung"
          >
            {RUBRIC_LEVEL_LABEL[s.finalLevel]}
          </span>
        )}
      </div>
    </Link>
  )
}
