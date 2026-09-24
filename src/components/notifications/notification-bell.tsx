'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { NotificationItem } from '@/actions/notifications'
import { NotificationRow } from './notification-list'
import { useNotifications } from './notifications-provider'

export function NotificationBell() {
  const router = useRouter()
  const notifications = useNotifications()
  const [open, setOpen] = useState(false)
  if (!notifications) return null
  const { items, unread, markRead, markAllRead } = notifications

  const openItem = (item: NotificationItem) => {
    markRead(item.id)
    setOpen(false)
    if (item.href) router.push(item.href)
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
            {items.map((item) => (
              <NotificationRow key={item.id} item={item} onOpen={openItem} />
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
