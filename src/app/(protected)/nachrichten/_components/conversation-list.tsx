'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, Search, UserPlus, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { formatJournalDate } from '@/lib/journal/shared'
import { useRecipientSearch } from '@/components/messages/use-recipient-search'
import type { ConversationSummary, ThreadKey } from '@/lib/messages'
import { cn } from '@/lib/utils'

/** Link to a thread; the URL scheme is explained in the inbox page. */
function threadHref(c: Pick<ConversationSummary, 'courseId' | 'teacherId' | 'studentId' | 'role'>) {
  if (c.courseId) {
    return c.role === 'student'
      ? `/nachrichten?quest=${c.courseId}`
      : `/nachrichten?quest=${c.courseId}&student=${c.studentId}`
  }
  return c.role === 'student' ? `/nachrichten?teacher=${c.teacherId}` : `/nachrichten?student=${c.studentId}`
}

const rowKey = (c: { courseId?: string | null; teacherId?: string | null; studentId: string }) =>
  `${c.courseId ?? `direct:${c.teacherId}`}-${c.studentId}`

/** The inbox list with a search over names, emails (teachers only) and quests. */
export function ConversationList({
  conversations,
  selected,
  emptyText,
  isTeacher,
}: {
  conversations: ConversationSummary[]
  selected: ThreadKey | null
  emptyText: string
  isTeacher: boolean
}) {
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (terms.length === 0) return conversations
    // Every word must match somewhere, so "anna 8b" finds Anna in class 8b.
    return conversations.filter((c) => terms.every((t) => c.searchText.includes(t)))
  }, [conversations, query])

  // Teachers: enrolled students without a conversation yet.
  const { active: showSuggestions, searching, suggestions } = useRecipientSearch(query, isTeacher)

  const existing = useMemo(
    () => new Set(conversations.map(rowKey)),
    [conversations],
  )
  const newRecipients = suggestions.filter((s) => !existing.has(rowKey(s)))

  return (
    <>
      {(conversations.length > 0 || isTeacher) && (
        <div className="border-b p-3">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isTeacher ? 'Name, E-Mail oder Quest' : 'Quest oder Lehrkraft'}
              aria-label="Unterhaltungen durchsuchen"
              className="pr-8 pl-8"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
                aria-label="Suche leeren"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversations.length === 0 && !showSuggestions ? (
          <p className="text-muted-foreground p-4 text-sm">{emptyText}</p>
        ) : visible.length === 0 ? (
          !showSuggestions && <p className="text-muted-foreground p-4 text-sm">Keine Unterhaltung gefunden.</p>
        ) : (
          <ul>
            {visible.map((c) => (
              <li key={rowKey(c)}>
                <ConversationRow
                  conversation={c}
                  selected={!!selected && rowKey(selected) === rowKey(c)}
                />
              </li>
            ))}
          </ul>
        )}

        {showSuggestions && (
          <section aria-label="Neue Unterhaltung">
            <h2 className="text-muted-foreground bg-muted/40 flex items-center gap-2 border-b px-4 py-2 text-[11px] font-semibold tracking-wide uppercase">
              Neue Unterhaltung
              {searching && <Loader2 className="size-3 animate-spin" aria-hidden />}
            </h2>
            {newRecipients.length === 0 ? (
              !searching && (
                <p className="text-muted-foreground px-4 py-3 text-xs">
                  {visible.length === 0 ? 'Keine Schüler oder Unterhaltungen gefunden.' : 'Keine weiteren Schüler gefunden.'}
                </p>
              )
            ) : (
              <ul>
                {newRecipients.map((r) => (
                  <li key={`${r.courseId}-${r.studentId}`}>
                    <Link
                      href={threadHref({ courseId: r.courseId, teacherId: null, studentId: r.studentId, role: 'teacher' })}
                      scroll={false}
                      className="hover:bg-muted/50 flex items-center gap-3 border-b px-4 py-2.5 transition-colors"
                    >
                      <UserPlus className="text-muted-foreground size-4 shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {r.studentName}
                          {r.studentKlasse && (
                            <span className="text-muted-foreground ml-1.5 text-xs font-normal">{r.studentKlasse}</span>
                          )}
                        </span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {r.courseTitle} · {r.studentEmail}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </>
  )
}

function ConversationRow({ conversation: c, selected }: { conversation: ConversationSummary; selected: boolean }) {
  return (
    <Link
      href={threadHref(c)}
      scroll={false}
      aria-current={selected ? 'page' : undefined}
      className={cn(
        'hover:bg-muted/50 block space-y-0.5 border-b px-4 py-3 transition-colors',
        selected && 'bg-muted border-l-primary border-l-2',
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn('min-w-0 flex-1 truncate text-sm', c.unread > 0 ? 'font-semibold' : 'font-medium')}>
          {c.role === 'student' ? (c.courseTitle ?? c.teacherName) : c.studentName}
        </span>
        <span className="text-muted-foreground shrink-0 text-[11px]">{formatJournalDate(c.lastMessageAt)}</span>
      </div>
      {(c.role === 'teacher' || !c.courseId) && (
        <p className="text-muted-foreground truncate text-xs">{c.courseTitle ?? 'Direktnachricht'}</p>
      )}
      <div className="flex items-center gap-2">
        <p className={cn('min-w-0 flex-1 truncate text-xs', c.unread > 0 ? 'text-foreground' : 'text-muted-foreground')}>
          {c.lastMessage.mine && 'Du: '}
          {c.lastMessage.body}
        </p>
        {c.unread > 0 && (
          <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-[11px] font-semibold tabular-nums">
            {c.unread}
          </span>
        )}
      </div>
    </Link>
  )
}
