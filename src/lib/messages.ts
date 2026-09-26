import 'server-only'

import { Prisma } from '@/generated/client'
import type { User } from '@/generated/client'
import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'

export const MESSAGE_MAX_LENGTH = 2000
/** Messages loaded when a thread opens; older ones aren't shown. */
const THREAD_LIMIT = 200

type Viewer = Pick<User, 'id' | 'isAdmin' | 'isTeacher'>

/** The viewer's side in a thread; null means no access. */
export type ThreadRole = 'student' | 'teacher'

/**
 * Identifies a thread: a student with the teachers of one quest, or a student
 * with one teacher directly. Plain data, so it can travel to the client.
 */
export type ThreadKey =
  | { studentId: string; courseId: string; teacherId?: undefined }
  | { studentId: string; teacherId: string; courseId?: undefined }

export function isDirect(key: ThreadKey): key is Extract<ThreadKey, { teacherId: string }> {
  return typeof key.teacherId === 'string'
}

function conversationUnique(key: ThreadKey): Prisma.ConversationWhereUniqueInput {
  return isDirect(key)
    ? { teacherId_studentId: { teacherId: key.teacherId, studentId: key.studentId } }
    : { courseId_studentId: { courseId: key.courseId, studentId: key.studentId } }
}

/** Role flags are NULL for students, so compare with `=== true`. */
const isTeacherUser = (u: Pick<User, 'isTeacher'> | null | undefined) => u?.isTeacher === true

/**
 * Who may take part in a thread.
 * - Quest thread: the enrolled student, and whoever may teach the quest (owner, shared, admin).
 * - Direct thread: the student and that one teacher. Only students start one, and only with
 *   a teacher; the teacher can answer once it exists. Nobody else can read it, admins included.
 */
export async function getThreadRole(viewer: Viewer, key: ThreadKey): Promise<ThreadRole | null> {
  if (isDirect(key)) {
    if (key.teacherId === key.studentId) return null
    if (viewer.id === key.studentId) {
      if (isTeacherUser(viewer)) return null
      const teacher = await db.user.findUnique({ where: { id: key.teacherId }, select: { isTeacher: true } })
      return isTeacherUser(teacher) ? 'student' : null
    }
    if (viewer.id === key.teacherId && isTeacherUser(viewer)) {
      const exists = await db.conversation.findUnique({ where: conversationUnique(key), select: { id: true } })
      return exists ? 'teacher' : null
    }
    return null
  }

  const enrolled = await db.purchase.findUnique({
    where: { userId_courseId: { userId: key.studentId, courseId: key.courseId } },
    select: { id: true },
  })
  if (!enrolled) return null
  if (viewer.id === key.studentId) return 'student'
  return (await getCourseIfTeachable(key.courseId, viewer)) ? 'teacher' : null
}

/** Quests whose threads appear in the viewer's inbox as teacher: owned or shared, also for admins. */
async function getTeachingCourseIds(viewerId: string) {
  const courses = await db.course.findMany({
    where: { OR: [{ userId: viewerId }, { sharedWith: { some: { id: viewerId } } }] },
    select: { id: true },
  })
  return courses.map((c) => c.id)
}

function inboxWhere(viewer: Viewer, teachingCourseIds: string[]): Prisma.ConversationWhereInput {
  return {
    messages: { some: {} },
    OR: [
      // Quest threads as the student (while enrolled) and as a teacher of the quest.
      { studentId: viewer.id, course: { purchases: { some: { userId: viewer.id } } } },
      { courseId: { in: teachingCourseIds }, studentId: { not: viewer.id } },
      // Direct threads on either side.
      { studentId: viewer.id, teacherId: { not: null } },
      { teacherId: viewer.id },
      // Admins may write in any quest from the workspace; quest threads they took part in stay in their inbox.
      ...(viewer.isAdmin ? [{ courseId: { not: null }, messages: { some: { authorId: viewer.id } } }] : []),
    ],
  }
}

/** Unread messages (written by others since the viewer last read) per conversation. */
async function countUnread(viewerId: string, conversationIds: string[]) {
  if (conversationIds.length === 0) return new Map<string, number>()
  const rows = await db.$queryRaw<{ id: string; n: number }[]>`
    SELECT m."conversationId" AS id, COUNT(*)::int AS n
    FROM "Message" m
    LEFT JOIN "ConversationRead" r
      ON r."conversationId" = m."conversationId" AND r."userId" = ${viewerId}
    WHERE m."conversationId" IN (${Prisma.join(conversationIds)})
      AND (m."authorId" IS NULL OR m."authorId" <> ${viewerId})
      AND m."createdAt" > COALESCE(r."lastReadAt", to_timestamp(0))
    GROUP BY m."conversationId"`
  return new Map(rows.map((r) => [r.id, r.n]))
}

/** Total unread messages across the viewer's inbox, for the menu badge. */
export async function countUnreadMessages(viewer: Viewer) {
  const teaching = await getTeachingCourseIds(viewer.id)
  const conversations = await db.conversation.findMany({
    where: inboxWhere(viewer, teaching),
    select: { id: true },
  })
  const unread = await countUnread(
    viewer.id,
    conversations.map((c) => c.id),
  )
  return [...unread.values()].reduce((sum, n) => sum + n, 0)
}

export type ConversationSummary = {
  /** Set for quest threads. */
  courseId: string | null
  courseTitle: string | null
  /** Set for direct threads. */
  teacherId: string | null
  teacherName: string | null
  studentId: string
  studentName: string
  role: ThreadRole
  lastMessageAt: string
  lastMessage: { body: string; mine: boolean }
  unread: number
  /**
   * Lowercase text the inbox search matches against. Teachers: student name, email,
   * Klasse and quest. Students: quest and teacher names (never teacher emails).
   */
  searchText: string
}

/** The viewer's conversations with at least one message, newest first. */
export async function listConversations(viewer: Viewer): Promise<ConversationSummary[]> {
  const viewerId = viewer.id
  const teaching = await getTeachingCourseIds(viewerId)
  const conversations = await db.conversation.findMany({
    where: inboxWhere(viewer, teaching),
    orderBy: { lastMessageAt: 'desc' },
    take: 100,
    select: {
      id: true,
      courseId: true,
      teacherId: true,
      studentId: true,
      lastMessageAt: true,
      course: { select: { title: true, userId: true, sharedWith: { select: { name: true } } } },
      teacher: { select: { name: true } },
      student: { select: { name: true, email: true, klasse: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, authorId: true } },
    },
  })
  const ownerIds = [...new Set(conversations.flatMap((c) => (c.course ? [c.course.userId] : [])))]
  const [unread, owners] = await Promise.all([
    countUnread(
      viewerId,
      conversations.map((c) => c.id),
    ),
    // Course owners are only stored as ids; their names are searchable for students.
    db.user.findMany({ where: { id: { in: ownerIds } }, select: { id: true, name: true } }),
  ])
  const ownerName = new Map(owners.map((o) => [o.id, o.name]))

  return conversations.map((c) => {
    const role: ThreadRole = c.studentId === viewerId ? 'student' : 'teacher'
    const teacherName = c.teacher ? c.teacher.name?.trim() || 'Lehrkraft' : null
    const questTeachers = c.course
      ? [ownerName.get(c.course.userId), ...c.course.sharedWith.map((t) => t.name)]
      : []
    const searchParts =
      role === 'teacher'
        ? [c.student.name, c.student.email, c.student.klasse, c.course?.title]
        : [c.course?.title, teacherName, ...questTeachers]
    return {
      courseId: c.courseId,
      courseTitle: c.course?.title ?? null,
      teacherId: c.teacherId,
      teacherName,
      studentId: c.studentId,
      studentName: c.student.name?.trim() || 'Schüler',
      role,
      lastMessageAt: c.lastMessageAt.toISOString(),
      lastMessage: {
        body: c.messages[0]?.body ?? '',
        mine: c.messages[0]?.authorId === viewerId,
      },
      unread: unread.get(c.id) ?? 0,
      searchText: searchParts.filter(Boolean).join(' ').toLowerCase(),
    }
  })
}

export type ChatMessageView = {
  id: string
  body: string
  createdAt: string
  authorId: string | null
  authorName: string
  authorImage: string | null
  /** Written by the student of the thread (not a teacher). */
  fromStudent: boolean
}

const messageSelect = {
  id: true,
  body: true,
  createdAt: true,
  authorId: true,
  author: { select: { name: true, image: true } },
} satisfies Prisma.MessageSelect

type MessageRow = Prisma.MessageGetPayload<{ select: typeof messageSelect }>

export function toChatMessageView(m: MessageRow, studentId: string): ChatMessageView {
  return {
    id: m.id,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    authorId: m.authorId,
    authorName: m.author?.name?.trim() || (m.authorId ? 'Unbekannt' : 'Gelöschtes Konto'),
    authorImage: m.author?.image ?? null,
    fromStudent: m.authorId === studentId,
  }
}

/** Messages of a thread, oldest first; with `after`, only newer ones (for polling). */
export async function getThreadMessages(key: ThreadKey, after?: Date) {
  const conversation = await db.conversation.findUnique({
    where: conversationUnique(key),
    select: { id: true },
  })
  if (!conversation) return { conversationId: null, messages: [] as ChatMessageView[] }

  const rows = await db.message.findMany({
    where: { conversationId: conversation.id, ...(after ? { createdAt: { gt: after } } : {}) },
    orderBy: { createdAt: 'desc' },
    take: THREAD_LIMIT,
    select: messageSelect,
  })
  return {
    conversationId: conversation.id,
    messages: rows.reverse().map((m) => toChatMessageView(m, key.studentId)),
  }
}

export async function conversationExists(key: ThreadKey) {
  return !!(await db.conversation.findUnique({ where: conversationUnique(key), select: { id: true } }))
}

export async function markConversationRead(conversationId: string, userId: string) {
  const now = new Date()
  await db.conversationRead.upsert({
    where: { conversationId_userId: { conversationId, userId } },
    create: { conversationId, userId, lastReadAt: now },
    update: { lastReadAt: now },
  })
}

/** Posts a message; creates the conversation on the first one. */
export async function createMessage(key: ThreadKey, authorId: string, body: string) {
  const now = new Date()
  const conversation = await db.conversation.upsert({
    where: conversationUnique(key),
    create: isDirect(key)
      ? { teacherId: key.teacherId, studentId: key.studentId, lastMessageAt: now }
      : { courseId: key.courseId, studentId: key.studentId, lastMessageAt: now },
    update: { lastMessageAt: now },
    select: { id: true },
  })
  const message = await db.message.create({
    data: { conversationId: conversation.id, authorId, body, createdAt: now },
    select: messageSelect,
  })
  await markConversationRead(conversation.id, authorId)
  return toChatMessageView(message, key.studentId)
}

/** Header info: the student, and the quest with its teachers or the one teacher. */
export async function getThreadInfo(key: ThreadKey) {
  const student = await db.user.findUnique({ where: { id: key.studentId }, select: { name: true, klasse: true } })
  if (!student) return null
  const base = { studentName: student.name?.trim() || 'Schüler', studentKlasse: student.klasse }

  if (isDirect(key)) {
    const teacher = await db.user.findUnique({ where: { id: key.teacherId }, select: { name: true } })
    if (!teacher) return null
    return { ...base, courseTitle: null, teacherNames: [teacher.name?.trim() || 'Lehrkraft'] }
  }

  const course = await db.course.findUnique({
    where: { id: key.courseId },
    select: { title: true, userId: true, sharedWith: { select: { name: true } } },
  })
  if (!course) return null
  // The owner is only stored as an id on Course.
  const owner = await db.user.findUnique({ where: { id: course.userId }, select: { name: true } })
  const teachers = [...(owner ? [owner] : []), ...course.sharedWith]
    .map((t) => t.name?.trim())
    .filter((n): n is string => !!n)
  return { ...base, courseTitle: course.title as string | null, teacherNames: [...new Set(teachers)] }
}

export type ThreadInfo = NonNullable<Awaited<ReturnType<typeof getThreadInfo>>>

/** Unread messages in one thread for the viewer (e.g. the workspace tab badge). */
export async function countUnreadInThread(viewerId: string, key: ThreadKey) {
  const conversation = await db.conversation.findUnique({
    where: conversationUnique(key),
    select: { id: true },
  })
  if (!conversation) return 0
  return (await countUnread(viewerId, [conversation.id])).get(conversation.id) ?? 0
}

export type TeacherOption = { teacherId: string; name: string }

/** Teachers a student can write to directly. Only names, never emails. */
export async function listTeachersForStudent(studentId: string): Promise<TeacherOption[]> {
  const teachers = await db.user.findMany({
    where: { isTeacher: true, id: { not: studentId }, name: { not: '' } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  return teachers
    .filter((t) => t.name?.trim())
    .map((t) => ({ teacherId: t.id, name: t.name!.trim() }))
}

export type RecipientSuggestion = {
  courseId: string
  courseTitle: string
  studentId: string
  studentName: string
  studentEmail: string
  studentKlasse: string | null
}

/**
 * Enrolled students a teacher can start a thread with: students of their own and
 * shared quests, of every quest for admins. Every word must match the name, email,
 * Klasse or quest title. Teachers and admins enrolled for testing are left out.
 */
export async function searchRecipients(viewer: Viewer, query: string): Promise<RecipientSuggestion[]> {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean).slice(0, 5)
  if (terms.length === 0 || query.trim().length < 2) return []

  const courses = await db.course.findMany({
    where: viewer.isAdmin ? {} : { OR: [{ userId: viewer.id }, { sharedWith: { some: { id: viewer.id } } }] },
    select: { id: true, title: true },
  })
  if (courses.length === 0) return []

  // Purchase has no relation to User, so enrollments and students are loaded separately and
  // matched in memory (a school has hundreds of enrollments, not millions).
  const enrollments = await db.purchase.findMany({
    where: { courseId: { in: courses.map((c) => c.id) }, userId: { not: viewer.id } },
    select: { userId: true, courseId: true },
  })
  if (enrollments.length === 0) return []
  const students = await db.user.findMany({
    where: {
      id: { in: [...new Set(enrollments.map((e) => e.userId))] },
      // Role flags are NULL for students; `{ not: true }` would drop them.
      AND: [
        { OR: [{ isTeacher: null }, { isTeacher: false }] },
        { OR: [{ isAdmin: null }, { isAdmin: false }] },
      ],
    },
    select: { id: true, name: true, email: true, klasse: true },
  })
  const studentById = new Map(students.map((s) => [s.id, s]))
  const courseById = new Map(courses.map((c) => [c.id, c]))

  return enrollments
    .filter((e) => studentById.has(e.userId))
    .map((e) => {
      const s = studentById.get(e.userId)!
      const c = courseById.get(e.courseId)!
      return {
        courseId: c.id,
        courseTitle: c.title,
        studentId: s.id,
        studentName: s.name?.trim() || 'Schüler',
        studentEmail: s.email,
        studentKlasse: s.klasse,
      }
    })
    .filter((r) => {
      const text = [r.studentName, r.studentEmail, r.studentKlasse, r.courseTitle].join(' ').toLowerCase()
      return terms.every((t) => text.includes(t))
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName, 'de') || a.courseTitle.localeCompare(b.courseTitle, 'de'))
    .slice(0, 20)
}

export type QuestOption = { courseId: string; courseTitle: string; teacherNames: string[] }

/** The student's enrolled quests with their teachers, for starting a conversation. */
export async function listQuestsForStudent(studentId: string): Promise<QuestOption[]> {
  const enrollments = await db.purchase.findMany({ where: { userId: studentId }, select: { courseId: true } })
  const courses = await db.course.findMany({
    where: { id: { in: enrollments.map((e) => e.courseId) } },
    select: { id: true, title: true, userId: true, sharedWith: { select: { name: true } } },
    orderBy: { title: 'asc' },
  })
  // Course owners are only stored as ids.
  const owners = await db.user.findMany({
    where: { id: { in: [...new Set(courses.map((c) => c.userId))] } },
    select: { id: true, name: true },
  })
  const ownerName = new Map(owners.map((o) => [o.id, o.name]))
  return courses.map((c) => ({
    courseId: c.id,
    courseTitle: c.title,
    teacherNames: [
      ...new Set(
        [ownerName.get(c.userId), ...c.sharedWith.map((t) => t.name)]
          .map((n) => n?.trim())
          .filter((n): n is string => !!n),
      ),
    ],
  }))
}
