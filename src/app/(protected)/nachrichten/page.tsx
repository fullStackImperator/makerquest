import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, MessagesSquare, NotebookPen } from 'lucide-react'

import { getSessionUser } from '@/lib/get-session-user'
import {
  getThreadInfo,
  getThreadMessages,
  getThreadRole,
  isDirect,
  listConversations,
  markConversationRead,
  type ThreadKey,
} from '@/lib/messages'
import { cn } from '@/lib/utils'
import { LiveChatThread } from '@/components/messages/live-chat-thread'
import { ConversationList } from './_components/conversation-list'
import { NewConversationDialog } from './_components/new-conversation-dialog'

/**
 * ?quest=Q (&student=S for teachers): quest thread.
 * ?teacher=T: the viewer's direct thread with a teacher (as student).
 * ?student=S without quest: the viewer's direct thread with a student (as teacher).
 */
function threadKeyFromParams(
  params: { quest?: string; student?: string; teacher?: string },
  viewerId: string,
): ThreadKey | null {
  if (params.quest) return { courseId: params.quest, studentId: params.student ?? viewerId }
  if (params.teacher) return { teacherId: params.teacher, studentId: viewerId }
  if (params.student) return { teacherId: viewerId, studentId: params.student }
  return null
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ quest?: string; student?: string; teacher?: string }>
}) {
  const viewer = await getSessionUser()
  if (!viewer) redirect('/')

  const params = await searchParams
  const conversations = await listConversations(viewer)

  const key = threadKeyFromParams(params, viewer.id)
  const role = key ? await getThreadRole(viewer, key) : null

  const [info, thread] =
    key && role ? await Promise.all([getThreadInfo(key), getThreadMessages(key)]) : [null, null]
  if (thread?.conversationId) await markConversationRead(thread.conversationId, viewer.id)

  const selected = key && info && thread && role
  const direct = !!key && isDirect(key)

  return (
    <div className="grid min-h-0 flex-1 gap-4 px-4 pb-4 lg:h-[calc(100svh-7.5rem)] lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <section
        className={cn(
          'bg-card border-border/60 min-h-0 flex-col overflow-hidden rounded-xl border shadow-sm',
          selected ? 'hidden lg:flex' : 'flex',
        )}
      >
        <header className="flex items-center gap-2 border-b px-4 py-3">
          <MessagesSquare className="text-muted-foreground size-5" aria-hidden />
          <h1 className="text-lg font-semibold">Nachrichten</h1>
          <NewConversationDialog isTeacher={viewer.isTeacher === true || viewer.isAdmin === true} />
        </header>
        <ConversationList
          conversations={conversations}
          selected={role ? key : null}
          isTeacher={!!(viewer.isTeacher || viewer.isAdmin)}
          emptyText={
            viewer.isTeacher || viewer.isAdmin
              ? 'Noch keine Nachrichten. Suche oben nach einem Schüler, um eine Unterhaltung zu beginnen.'
              : 'Noch keine Nachrichten. Tippe auf +, um einer Lehrkraft zu schreiben.'
          }
        />
      </section>

      {selected ? (
        <section className="bg-card border-border/60 flex max-h-[80svh] min-h-0 flex-col self-start overflow-hidden rounded-xl border shadow-sm lg:max-h-full">
          <header className="flex items-center gap-3 border-b px-4 py-3">
            <Link
              href="/nachrichten"
              className="text-muted-foreground hover:text-foreground lg:hidden"
              aria-label="Zurück zur Übersicht"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-semibold">
                {role === 'student' ? (direct ? info.teacherNames[0] : info.courseTitle) : info.studentName}
                {role === 'teacher' && info.studentKlasse && (
                  <span className="text-muted-foreground ml-2 text-sm font-normal">{info.studentKlasse}</span>
                )}
              </h2>
              <p className="text-muted-foreground truncate text-xs">
                {direct
                  ? 'Direktnachricht'
                  : role === 'student'
                    ? info.teacherNames.length > 0
                      ? `mit ${info.teacherNames.join(', ')}`
                      : 'mit deiner Lehrkraft'
                    : info.courseTitle}
              </p>
            </div>
            {role === 'teacher' && !direct && (
              <Link
                href={`/admin/journal?course=${key.courseId}&student=${key.studentId}`}
                className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1 text-xs"
              >
                <NotebookPen className="size-3.5" aria-hidden />
                Journal
              </Link>
            )}
          </header>
          <LiveChatThread
            thread={key}
            viewerId={viewer.id}
            initialMessages={thread.messages}
            emptyHint={
              role === 'student'
                ? direct
                  ? `Schreib ${info.teacherNames[0]} eine Nachricht.`
                  : 'Hast du eine Frage zu dieser Quest? Schreib deiner Lehrkraft.'
                : `Schreib ${info.studentName} eine Nachricht zu dieser Quest.`
            }
          />
        </section>
      ) : (
        <section className="bg-card border-border/60 hidden flex-col items-center justify-center gap-2 rounded-xl border p-10 text-center text-sm shadow-sm lg:flex">
          <MessagesSquare className="text-muted-foreground size-8" aria-hidden />
          <p className="text-muted-foreground">
            {key ? 'Diese Unterhaltung ist für dich nicht verfügbar.' : 'Wähle links eine Unterhaltung aus.'}
          </p>
        </section>
      )}
    </div>
  )
}

