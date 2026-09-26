import Link from 'next/link'
import { ChevronRight, MessagesSquare } from 'lucide-react'

import { countUnreadInThread } from '@/lib/messages'

/** Opens the student's conversation with the quest's teachers. */
export async function MessagesSidebarLink({ courseId, userId }: { courseId: string; userId: string }) {
  // Messages must not break the quest page (e.g. before their migration is applied).
  const unread = await countUnreadInThread(userId, { courseId, studentId: userId }).catch(() => 0)

  return (
    <Link
      href={`/nachrichten?quest=${courseId}`}
      className="hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
    >
      <MessagesSquare className="text-muted-foreground size-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate">Nachricht an Lehrkraft</span>
      {unread > 0 && (
        <span
          className="bg-primary text-primary-foreground shrink-0 rounded-full px-1.5 text-[11px] font-semibold tabular-nums"
          title={`${unread} ungelesen`}
        >
          {unread}
        </span>
      )}
      <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
    </Link>
  )
}
