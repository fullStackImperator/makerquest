'use server'

import { z } from 'zod'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import {
  conversationExists,
  createMessage,
  getThreadMessages,
  getThreadRole,
  isDirect,
  listQuestsForStudent,
  listTeachersForStudent,
  markConversationRead,
  MESSAGE_MAX_LENGTH,
  searchRecipients,
  type ChatMessageView,
  type QuestOption,
  type RecipientSuggestion,
  type TeacherOption,
  type ThreadKey,
} from '@/lib/messages'
import { logSecurityEvent } from '@/lib/security-log'

const id = z.string().min(1).max(100)
const threadSchema = z.union([
  z.object({ studentId: id, courseId: id, teacherId: z.undefined() }),
  z.object({ studentId: id, teacherId: id, courseId: z.undefined() }),
])

const PER_MINUTE = 10
const PER_DAY = 300
/** New direct conversations a student may start per day, so teachers can't be spammed. */
const NEW_DIRECT_PER_DAY = 5

async function authorize(thread: unknown) {
  const parsed = threadSchema.safeParse(thread)
  if (!parsed.success) return null
  const user = await getSessionUser()
  if (!user) return null
  const key = parsed.data as ThreadKey
  const role = await getThreadRole(user, key)
  if (!role) {
    await logSecurityEvent('unauthorized-action', {
      action: 'messages',
      userId: user.id,
      courseId: key.courseId ?? null,
    })
    return null
  }
  return { user, key, role }
}

/** New messages of a thread since `after` (all recent ones without it); marks the thread read. */
export async function fetchThread(input: {
  thread: ThreadKey
  after?: string
}): Promise<{ success: true; messages: ChatMessageView[] } | { success: false; error: string }> {
  const access = await authorize(input.thread)
  if (!access) return { success: false, error: 'Keine Berechtigung' }

  const after = input.after ? new Date(input.after) : undefined
  const { conversationId, messages } = await getThreadMessages(
    access.key,
    after && !Number.isNaN(after.getTime()) ? after : undefined,
  )
  if (conversationId && (messages.length > 0 || !after)) {
    await markConversationRead(conversationId, access.user.id)
  }
  return { success: true, messages }
}

export async function sendMessage(input: {
  thread: ThreadKey
  body: string
}): Promise<{ success: true; message: ChatMessageView } | { success: false; error: string }> {
  const access = await authorize(input.thread)
  if (!access) return { success: false, error: 'Keine Berechtigung' }

  const body = typeof input.body === 'string' ? input.body.trim() : ''
  if (!body) return { success: false, error: 'Die Nachricht ist leer' }
  if (body.length > MESSAGE_MAX_LENGTH) {
    return { success: false, error: `Höchstens ${MESSAGE_MAX_LENGTH} Zeichen` }
  }

  const now = Date.now()
  const dayAgo = new Date(now - 86_400_000)
  const [lastMinute, lastDay] = await Promise.all([
    db.message.count({ where: { authorId: access.user.id, createdAt: { gt: new Date(now - 60_000) } } }),
    db.message.count({ where: { authorId: access.user.id, createdAt: { gt: dayAgo } } }),
  ])
  if (lastMinute >= PER_MINUTE || lastDay >= PER_DAY) {
    return { success: false, error: 'Zu viele Nachrichten. Bitte warte kurz.' }
  }

  if (isDirect(access.key) && !(await conversationExists(access.key))) {
    const started = await db.conversation.count({
      where: { studentId: access.user.id, teacherId: { not: null }, createdAt: { gt: dayAgo } },
    })
    if (started >= NEW_DIRECT_PER_DAY) {
      return { success: false, error: 'Du kannst heute keine weiteren Lehrkräfte neu anschreiben.' }
    }
  }

  const message = await createMessage(access.key, access.user.id, body)
  return { success: true, message }
}

/** Students a teacher may start a conversation with (inbox search). */
export async function searchMessageRecipients(query: string): Promise<RecipientSuggestion[]> {
  const user = await getSessionUser()
  if (!user || !(user.isTeacher === true || user.isAdmin === true)) return []
  if (typeof query !== 'string' || query.length > 100) return []
  return searchRecipients(user, query)
}

/** What a student can start a conversation with ("+" in the inbox): any teacher, or a quest's teachers. */
export async function getStudentMessageOptions(): Promise<{ teachers: TeacherOption[]; quests: QuestOption[] }> {
  const user = await getSessionUser()
  // Teachers write to students through quest threads; this list is for students only.
  if (!user || user.isTeacher === true) return { teachers: [], quests: [] }
  const [teachers, quests] = await Promise.all([listTeachersForStudent(user.id), listQuestsForStudent(user.id)])
  return { teachers, quests }
}
