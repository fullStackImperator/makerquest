'use client'

import { Bell, CheckCircle2, MessageSquare, RotateCcw, Award, Send, ShieldAlert } from 'lucide-react'

import type { NotificationItem } from '@/actions/notifications'
import { cn } from '@/lib/utils'

export const KIND_ICON: Record<NotificationItem['kind'], { icon: typeof Bell; className: string }> = {
  JOURNAL_SUBMITTED: { icon: Send, className: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
  JOURNAL_RESUBMITTED: { icon: Send, className: 'bg-violet-500/15 text-violet-700 dark:text-violet-300' },
  JOURNAL_ACCEPTED: { icon: CheckCircle2, className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  JOURNAL_REVISION_REQUESTED: { icon: RotateCcw, className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  JOURNAL_COMMENT: { icon: MessageSquare, className: 'bg-muted text-muted-foreground' },
  JOURNAL_FINAL_GRADE: { icon: Award, className: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300' },
  ACCOUNT_NOTICE: { icon: ShieldAlert, className: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
}

export function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return 'gerade eben'
  if (minutes < 60) return `vor ${minutes} Min.`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `vor ${hours} Std.`
  const days = Math.round(hours / 24)
  if (days < 7) return `vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(iso))
}

/** One notification in the bell dropdown or on the notifications page. */
export function NotificationRow({
  item,
  onOpen,
}: {
  item: NotificationItem
  onOpen: (item: NotificationItem) => void
}) {
  const { icon: Icon, className } = KIND_ICON[item.kind]
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(item)}
        className={cn(
          'hover:bg-muted/60 flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0',
          !item.read && 'bg-sky-500/5',
        )}
      >
        <span className={cn('mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full', className)}>
          <Icon className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('block text-sm leading-snug', !item.read && 'font-semibold')}>
            {item.title}
          </span>
          {item.body && (
            <span className="text-muted-foreground mt-0.5 line-clamp-2 block text-xs">{item.body}</span>
          )}
          <span className="text-muted-foreground mt-1 block text-[11px]">{timeAgo(item.createdAt)}</span>
        </span>
        {!item.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-sky-500" aria-label="ungelesen" />}
      </button>
    </li>
  )
}
