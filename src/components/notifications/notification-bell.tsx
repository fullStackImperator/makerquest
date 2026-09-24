'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCircle2, MessageSquare, RotateCcw, Award, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { NotificationItem } from '@/actions/notifications'
import { cn } from '@/lib/utils'
import { useNotifications } from './notifications-provider'

const KIND_ICON: Record<NotificationItem['kind'], { icon: typeof Bell; className: string }> = {
  JOURNAL_SUBMITTED: { icon: Send, className: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
  JOURNAL_RESUBMITTED: { icon: Send, className: 'bg-violet-500/15 text-violet-700 dark:text-violet-300' },
  JOURNAL_ACCEPTED: { icon: CheckCircle2, className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  JOURNAL_REVISION_REQUESTED: { icon: RotateCcw, className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  JOURNAL_COMMENT: { icon: MessageSquare, className: 'bg-muted text-muted-foreground' },
  JOURNAL_FINAL_GRADE: { icon: Award, className: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300' },
}

function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return 'gerade eben'
  if (minutes < 60) return `vor ${minutes} Min.`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `vor ${hours} Std.`
  const days = Math.round(hours / 24)
  if (days < 7) return `vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(iso))
}

export function NotificationBell() {
  const router = useRouter()
  const notifications = useNotifications()
  const [open, setOpen] = useState(false)
  if (!notifications) return null
  const { items, unread, markRead, markAllRead } = notifications

  const openItem = (item: NotificationItem) => {
    markRead(item.id)
    setOpen(false)
    router.push(item.href)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread > 0 ? `${unread} neue Benachrichtigungen` : 'Benachrichtigungen'}
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-4.5 text-white tabular-nums">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
          <p className="text-sm font-semibold">Benachrichtigungen</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Alle als gelesen markieren
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="text-muted-foreground px-4 py-8 text-center text-sm">
            Keine Benachrichtigungen
          </p>
        ) : (
          <ul className="max-h-[min(28rem,70vh)] overflow-y-auto">
            {items.map((item) => {
              const { icon: Icon, className } = KIND_ICON[item.kind]
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openItem(item)}
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
                        <span className="text-muted-foreground mt-0.5 line-clamp-2 block text-xs">
                          {item.body}
                        </span>
                      )}
                      <span className="text-muted-foreground mt-1 block text-[11px]">
                        {timeAgo(item.createdAt)}
                      </span>
                    </span>
                    {!item.read && (
                      <span className="mt-2 size-2 shrink-0 rounded-full bg-sky-500" aria-label="ungelesen" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
