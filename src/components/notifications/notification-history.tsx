'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import type { NotificationItem } from '@/actions/notifications'
import { Button } from '@/components/ui/button'
import { NotificationRow } from './notification-list'
import { useNotifications } from './notifications-provider'

export function NotificationHistory({ initial }: { initial: NotificationItem[] }) {
  const router = useRouter()
  const notifications = useNotifications()
  const [items, setItems] = useState(initial)
  const unread = items.filter((n) => !n.read).length

  const open = (item: NotificationItem) => {
    notifications?.markRead(item.id)
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)))
    if (item.href) router.push(item.href)
  }

  const markAll = () => {
    notifications?.markAllRead()
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <p className="text-muted-foreground text-sm">
          {unread === 0 ? 'Alles gelesen' : `${unread} ungelesen`}
        </p>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={markAll}>
            Alle als gelesen markieren
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground px-4 py-10 text-center text-sm">Keine Benachrichtigungen</p>
      ) : (
        <ul>
          {items.map((item) => (
            <NotificationRow key={item.id} item={item} onOpen={open} />
          ))}
        </ul>
      )}
    </div>
  )
}
