'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Loader2, Plus, UserRound } from 'lucide-react'

import { getStudentMessageOptions } from '@/actions/messages'
import { useRecipientSearch } from '@/components/messages/use-recipient-search'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { QuestOption, TeacherOption } from '@/lib/messages'

/** "+" in the inbox: teachers search a student, students pick one of their quests. */
export function NewConversationDialog({ isTeacher }: { isTeacher: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="ml-auto size-8 rounded-full"
        onClick={() => setOpen(true)}
        aria-label="Neue Unterhaltung"
        title="Neue Unterhaltung"
      >
        <Plus className="size-5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="border-b px-4 pt-4 pb-3">
            <DialogTitle>Neue Unterhaltung</DialogTitle>
            <DialogDescription>
              {isTeacher
                ? 'Suche einen Schüler nach Name, E-Mail, Klasse oder Quest.'
                : 'Schreib einer Lehrkraft direkt oder zu einer deiner Quests.'}
            </DialogDescription>
          </DialogHeader>
          {/* Mounted only while open, so the search starts empty each time. */}
          {open &&
            (isTeacher ? (
              <StudentPicker onDone={() => setOpen(false)} />
            ) : (
              <QuestPicker onDone={() => setOpen(false)} />
            ))}
        </DialogContent>
      </Dialog>
    </>
  )
}

function StudentPicker({ onDone }: { onDone: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const { active, searching, suggestions } = useRecipientSearch(query, true)

  return (
    // Results come from the server already filtered.
    <Command shouldFilter={false}>
      <CommandInput value={query} onValueChange={setQuery} placeholder="Name, E-Mail, Klasse oder Quest" />
      <CommandList className="max-h-[50vh]">
        {!active ? (
          <p className="text-muted-foreground px-4 py-6 text-center text-sm">Mindestens 2 Zeichen eingeben.</p>
        ) : searching && suggestions.length === 0 ? (
          <p className="text-muted-foreground flex items-center justify-center gap-2 px-4 py-6 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Suche …
          </p>
        ) : (
          <>
            <CommandEmpty>Keine Schüler gefunden.</CommandEmpty>
            <CommandGroup>
              {suggestions.map((s) => (
                <CommandItem
                  key={`${s.courseId}-${s.studentId}`}
                  value={`${s.courseId}-${s.studentId}`}
                  onSelect={() => {
                    onDone()
                    router.push(`/nachrichten?quest=${s.courseId}&student=${s.studentId}`)
                  }}
                  className="gap-3"
                >
                  <UserRound className="text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {s.studentName}
                      {s.studentKlasse && (
                        <span className="text-muted-foreground ml-1.5 text-xs font-normal">{s.studentKlasse}</span>
                      )}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {s.courseTitle} · {s.studentEmail}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  )
}

function QuestPicker({ onDone }: { onDone: () => void }) {
  const router = useRouter()
  const [options, setOptions] = useState<{ teachers: TeacherOption[]; quests: QuestOption[] } | null>(null)

  // Loaded each time the dialog opens (the picker is mounted only while open).
  useEffect(() => {
    let cancelled = false
    getStudentMessageOptions()
      .catch(() => ({ teachers: [], quests: [] }))
      .then((result) => !cancelled && setOptions(result))
    return () => {
      cancelled = true
    }
  }, [])

  const open = (href: string) => {
    onDone()
    router.push(href)
  }

  return (
    <Command>
      <CommandInput placeholder="Lehrkraft oder Quest suchen" />
      <CommandList className="max-h-[50vh]">
        {options === null ? (
          <p className="text-muted-foreground flex items-center justify-center gap-2 px-4 py-6 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Lade …
          </p>
        ) : (
          <>
            <CommandEmpty>Nichts gefunden.</CommandEmpty>
            {options.teachers.length > 0 && (
              <CommandGroup heading="Lehrkräfte">
                {options.teachers.map((t) => (
                  <CommandItem
                    key={t.teacherId}
                    // cmdk filters on this text.
                    value={`${t.name} ${t.teacherId}`}
                    onSelect={() => open(`/nachrichten?teacher=${t.teacherId}`)}
                    className="gap-3"
                  >
                    <UserRound className="text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate font-medium">{t.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {options.quests.length > 0 && (
              <CommandGroup heading="Zu einer Quest">
                {options.quests.map((q) => (
                  <CommandItem
                    key={q.courseId}
                    value={`${q.courseTitle} ${q.teacherNames.join(' ')} ${q.courseId}`}
                    onSelect={() => open(`/nachrichten?quest=${q.courseId}`)}
                    className="gap-3"
                  >
                    <BookOpen className="text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{q.courseTitle}</span>
                      {q.teacherNames.length > 0 && (
                        <span className="text-muted-foreground block truncate text-xs">
                          {q.teacherNames.join(', ')}
                        </span>
                      )}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </Command>
  )
}
