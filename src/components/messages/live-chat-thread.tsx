'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'

import { ChatThread } from './chat-thread'
import { useNotifications } from '@/components/notifications/notifications-provider'
import type { ChatMessageView, ThreadKey } from '@/lib/messages'

/** A chat thread on a server-rendered page; keeps the page (inbox, tab badges) and the menu badge current. */
export function LiveChatThread(props: {
  thread: ThreadKey
  viewerId: string
  initialMessages: ChatMessageView[]
  emptyHint: string
}) {
  const router = useRouter()
  const notifications = useNotifications()

  const onActivity = useCallback(() => {
    router.refresh()
    notifications?.refresh()
  }, [router, notifications])

  return <ChatThread key={`${props.thread.courseId ?? props.thread.teacherId}-${props.thread.studentId}`} {...props} onActivity={onActivity} />
}
