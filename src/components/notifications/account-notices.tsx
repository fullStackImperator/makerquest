'use client'

import { ShieldAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useNotifications } from './notifications-provider'

/** Unread notices from teachers, shown above every page until acknowledged. */
export function AccountNotices() {
  const notifications = useNotifications()
  const notices = notifications?.items.filter((n) => n.kind === 'ACCOUNT_NOTICE' && !n.read) ?? []
  if (notices.length === 0) return null

  return (
    <div className="space-y-3">
      {notices.map((notice) => (
        <div
          key={notice.id}
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-rose-500/50 bg-rose-50 p-4 text-rose-950 shadow-sm sm:flex-row sm:items-start dark:bg-rose-950/40 dark:text-rose-50"
        >
          <ShieldAlert className="size-6 shrink-0 text-rose-600" aria-hidden />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-semibold">{notice.title}</p>
            {notice.body && <p className="text-sm whitespace-pre-wrap">{notice.body}</p>}
          </div>
          <Button
            size="sm"
            className="shrink-0 bg-rose-600 text-white hover:bg-rose-700"
            onClick={() => notifications?.markRead(notice.id)}
          >
            Verstanden
          </Button>
        </div>
      ))}
    </div>
  )
}
