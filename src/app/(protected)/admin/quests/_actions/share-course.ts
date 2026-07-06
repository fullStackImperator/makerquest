'use server'

import { revalidatePath } from 'next/cache'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'

export type ShareableTeacher = {
  id: string
  name: string
  email: string
}

export type CourseShareState = {
  teachers: ShareableTeacher[]
  selectedIds: string[]
}

/**
 * Only the course owner or a platform admin may view/manage who a course is
 * shared with.
 */
async function requireShareManager(courseId: string) {
  const user = await getSessionUser()
  if (!user || (!user.isTeacher && !user.isAdmin)) {
    return { error: 'Unauthorized' as const }
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, userId: true },
  })
  if (!course) return { error: 'Nicht gefunden' as const }

  if (course.userId !== user.id && !user.isAdmin) {
    return { error: 'Unauthorized' as const }
  }

  return { user, course }
}

/** Teachers a course can be shared with plus who it is currently shared with. */
export async function getCourseShareState(
  courseId: string,
): Promise<
  { success: true; data: CourseShareState } | { success: false; error: string }
> {
  const ctx = await requireShareManager(courseId)
  if ('error' in ctx) return { success: false, error: ctx.error }

  const [teachers, shares] = await Promise.all([
    db.user.findMany({
      where: {
        isTeacher: true,
        id: { not: ctx.course.userId },
      },
      select: { id: true, name: true, email: true },
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
    }),
    db.course.findUnique({
      where: { id: courseId },
      select: { sharedWith: { select: { id: true } } },
    }),
  ])

  return {
    success: true,
    data: {
      teachers: teachers.map((t) => ({
        id: t.id,
        name: t.name?.trim() || '',
        email: t.email,
      })),
      selectedIds: shares?.sharedWith.map((s) => s.id) ?? [],
    },
  }
}

/** Replaces the set of teachers a course is shared with. */
export async function updateCourseShares(
  courseId: string,
  teacherIds: string[],
): Promise<{ success: true } | { success: false; error: string }> {
  const ctx = await requireShareManager(courseId)
  if ('error' in ctx) return { success: false, error: ctx.error }

  const validTeachers = await db.user.findMany({
    where: {
      id: { in: teacherIds, not: ctx.course.userId },
      isTeacher: true,
    },
    select: { id: true },
  })

  await db.course.update({
    where: { id: courseId },
    data: {
      sharedWith: {
        set: validTeachers.map((t) => ({ id: t.id })),
      },
    },
  })

  revalidatePath('/admin/quests')
  return { success: true }
}
