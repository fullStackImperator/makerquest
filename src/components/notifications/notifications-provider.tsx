'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationSummary,
} from '@/actions/notifications'

type NotificationsContextValue = NotificationSummary & {
  refresh: () => void
  markRead: (id: string) => void
  markAllRead: () => void
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

const POLL_MS = 60_000

/** Holds the user's notifications for the bell and the menu badges. */
export function NotificationsProvider({
  initial,
  children,
}: {
  initial: NotificationSummary
  children: React.ReactNode
}) {
  const [summary, setSummary] = useState(initial)
  const pathname = usePathname()

  const refresh = useCallback(() => {
    getMyNotifications()
      .then(setSummary)
      .catch(() => {})
  }, [])

  // Refresh on navigation, periodically, and when the tab becomes visible again.
  useEffect(() => {
    refresh()
  }, [pathname, refresh])

  useEffect(() => {
    const interval = setInterval(refresh, POLL_MS)
    const onVisible = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  const markRead = useCallback(
    (id: string) => {
      setSummary((prev) => {
        const item = prev.items.find((n) => n.id === id)
        if (!item || item.read) return prev
        return {
          ...prev,
          items: prev.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
          unread: Math.max(0, prev.unread - 1),
        }
      })
      markNotificationRead(id).then(refresh).catch(() => {})
    },
    [refresh],
  )

  const markAllRead = useCallback(() => {
    setSummary((prev) => ({
      ...prev,
      items: prev.items.map((n) => ({ ...n, read: true })),
      unread: 0,
      unreadJournal: 0,
      unreadReview: 0,
    }))
    markAllNotificationsRead().then(refresh).catch(() => {})
  }, [refresh])

  return (
    <NotificationsContext.Provider value={{ ...summary, refresh, markRead, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationsContext)
}
