'use client'

import { useState, useTransition, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Pencil,
  RotateCcw,
  Send,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import 'mathlive/static.css'
import '@/app/(protected)/admin/quests/[courseId]/chapters/[chapterId]/_components/editor/theme.css'

import { deleteJournalEntry, saveJournalEntry } from '@/actions/journal'
import { LexicalContentEditor } from '@/components/lexical/lexical-content-editor'
import { ConfirmModal } from '@/components/modals/confirm-modal'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  formatJournalDate,
  formatJournalDateTime,
  isJournalEntryEditable,
  JOURNAL_EVENT_LABEL,
  type JournalEntryView,
  type JournalEventView,
} from '@/lib/journal/shared'
import { JournalAttachments } from './journal-attachments'
import { JournalStatusBadge } from './journal-status-badge'

export function JournalEntryCard({
  entry,
  editHref,
  showQuest = false,
  actions,
  headerExtra,
  contentKey,
  highlighted = false,
}: {
  entry: JournalEntryView
  /** Link to the edit page; the student actions are hidden without it. */
  editHref?: string
  showQuest?: boolean
  /** Rendered below the event list, e.g. the teacher's review controls. */
  actions?: ReactNode
  /** Rendered above the content, e.g. a version switcher. */
  headerExtra?: ReactNode
  /** Changing it re-mounts the read-only editor (the editor keeps its first content). */
  contentKey?: string
  highlighted?: boolean
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(entry.status !== 'ACCEPTED')
  const [pending, startTransition] = useTransition()

  const editable = isJournalEntryEditable(entry.status)
  // Shown to the student only (the edit link marks the student's own view).
  const latestRevision =
    editHref && entry.status === 'REVISE'
      ? entry.events.findLast((e) => e.kind === 'REVISION_REQUESTED')
      : undefined
  const deletable = entry.status === 'DRAFT' && entry.versionCount === 0

  const submit = () =>
    startTransition(async () => {
      const result = await saveJournalEntry({
        id: entry.id,
        courseId: entry.courseId,
        chapterId: entry.chapterId,
        title: entry.title,
        content: JSON.stringify(entry.content),
        attachments: entry.attachments,
        submit: true,
      })
      if (!result.success) return void toast.error(result.error)
      toast.success('Eintrag eingereicht')
      router.refresh()
    })

  const remove = () =>
    startTransition(async () => {
      const result = await deleteJournalEntry(entry.id)
      if (!result.success) return void toast.error(result.error)
      toast.success('Entwurf gelöscht')
      router.refresh()
    })

  return (
    <article id={`entry-${entry.id}`} className="relative scroll-mt-4 pl-8">
      {/* timeline rail + dot */}
      <span className="bg-border absolute top-0 bottom-0 left-[11px] w-px" aria-hidden />
      {entry.status === 'ACCEPTED' ? (
        <span
          className="bg-background absolute top-3.5 left-0 flex size-6 items-center justify-center rounded-full"
          aria-hidden
        >
          <CheckCircle2 className="size-6 fill-emerald-500 text-white dark:text-emerald-950" />
        </span>
      ) : (
        <span
          className={cn(
            'border-background absolute top-4 left-[5px] size-3.5 rounded-full border-2',
            entry.status === 'READY' && 'bg-sky-500',
            entry.status === 'REVISE' && 'bg-amber-500',
            entry.status === 'DRAFT' && 'bg-muted-foreground/40',
          )}
          aria-hidden
        />
      )}

      <div
        className={cn(
          'border-border/60 bg-card rounded-xl border shadow-sm',
          entry.status === 'DRAFT' && 'border-dashed',
          highlighted && 'ring-2 ring-sky-500/50',
        )}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-start gap-3 p-4 text-left"
          aria-expanded={expanded}
        >
          <div className="min-w-0 flex-1 space-y-1">
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <time dateTime={entry.entryDate} className="text-foreground font-medium tabular-nums">
                {formatJournalDate(entry.entryDate)}
              </time>
              {showQuest && <span>· {entry.courseTitle}</span>}
              {entry.chapterTitle && (
                <span className="bg-muted rounded px-1.5 py-0.5">{entry.chapterTitle}</span>
              )}
              {entry.versionCount > 1 && (
                <span className="rounded-full border border-violet-500/40 bg-violet-500/10 px-1.5 py-0.5 font-medium text-violet-700 dark:text-violet-300">
                  Version {entry.versionCount} · überarbeitet
                </span>
              )}
            </div>
            <h3 className="flex items-center gap-1.5 text-[15px] font-semibold leading-snug">
              {entry.status === 'ACCEPTED' && (
                <CheckCircle2
                  className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-label="Angenommen"
                />
              )}
              <span className="truncate">{entry.title || 'Ohne Titel'}</span>
            </h3>
          </div>
          <JournalStatusBadge status={entry.status} className="mt-0.5 shrink-0" />
          <ChevronDown
            className={cn(
              'text-muted-foreground mt-0.5 size-4 shrink-0 transition-transform',
              expanded && 'rotate-180',
            )}
            aria-hidden
          />
        </button>

        {expanded && (
          <div className="space-y-4 border-t px-4 pt-3 pb-4">
            {latestRevision && (
              <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2.5 text-sm">
                <p className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-100">
                  <RotateCcw className="size-4 shrink-0" aria-hidden />
                  Bitte überarbeiten
                </p>
                {latestRevision.body && (
                  <p className="mt-1 whitespace-pre-wrap text-amber-950 dark:text-amber-50">
                    {latestRevision.body}
                  </p>
                )}
              </div>
            )}
            {headerExtra}
            <LexicalContentEditor
              key={contentKey}
              initialData={entry.content}
              editable={false}
              variant="student"
            />
            <JournalAttachments attachments={entry.attachments} />

            {entry.events.length > 0 && (
              <ol className="space-y-2 border-t pt-3">
                {entry.events.map((event, i) => (
                  <JournalEventItem
                    key={event.id}
                    event={event}
                    resubmission={
                      event.kind === 'SUBMITTED' &&
                      entry.events.slice(0, i).some((e) => e.kind === 'SUBMITTED')
                    }
                  />
                ))}
              </ol>
            )}

            {actions}

            {(editable || deletable) && editHref && (
              <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link href={editHref}>
                    <Pencil className="size-3.5" />
                    Bearbeiten
                  </Link>
                </Button>
                {editable && (
                  <Button size="sm" className="gap-1.5" onClick={submit} disabled={pending}>
                    {pending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                    {entry.status === 'REVISE' ? 'Erneut einreichen' : 'Einreichen'}
                  </Button>
                )}
                {deletable && (
                  <ConfirmModal onConfirm={remove}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground ml-auto gap-1.5"
                      disabled={pending}
                    >
                      <Trash2 className="size-3.5" />
                      Löschen
                    </Button>
                  </ConfirmModal>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

function JournalEventItem({
  event,
  resubmission,
}: {
  event: JournalEventView
  /** A SUBMITTED event that follows an earlier submission. */
  resubmission: boolean
}) {
  const when = formatJournalDateTime(event.createdAt)

  if (event.kind === 'COMMENT') {
    return (
      <li className={cn('flex gap-2', event.authorIsStudent && 'flex-row-reverse')}>
        <MessageSquare className="text-muted-foreground mt-1 size-3.5 shrink-0" aria-hidden />
        <div
          className={cn(
            'max-w-[85%] rounded-lg px-3 py-2 text-sm',
            event.authorIsStudent ? 'bg-primary/10' : 'bg-muted',
          )}
        >
          <p className="text-muted-foreground mb-0.5 text-[11px]">
            {event.authorName} · {when}
          </p>
          <p className="whitespace-pre-wrap">{event.body}</p>
        </div>
      </li>
    )
  }

  if (event.kind === 'REVISION_REQUESTED') {
    return (
      <li className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-900 dark:text-amber-100">
          <RotateCcw className="size-4 shrink-0" aria-hidden />
          Überarbeitung angefordert
        </div>
        {event.body && (
          <p className="mt-1.5 text-sm whitespace-pre-wrap text-amber-950 dark:text-amber-50">
            {event.body}
          </p>
        )}
        <p className="mt-1.5 text-[11px] text-amber-800/80 dark:text-amber-200/70">
          {event.authorName} · {when}
        </p>
      </li>
    )
  }

  if (event.kind === 'ACCEPTED') {
    return (
      <li className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2">
        <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          Angenommen
          <span className="text-[11px] font-normal text-emerald-700/80 dark:text-emerald-300/70">
            · {event.authorName} · {when}
          </span>
        </div>
        {event.body && (
          <p className="mt-1 text-sm whitespace-pre-wrap">{event.body}</p>
        )}
      </li>
    )
  }

  return (
    <li className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <Send className={cn('size-3.5', resubmission && 'text-violet-600')} aria-hidden />
      <span className={cn(resubmission && 'font-medium text-violet-700 dark:text-violet-300')}>
        {resubmission ? 'Überarbeitet eingereicht' : JOURNAL_EVENT_LABEL[event.kind]}
      </span>
      <span>
        · {event.authorName} · {when}
      </span>
    </li>
  )
}
