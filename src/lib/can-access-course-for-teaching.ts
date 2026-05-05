import { db } from '@/lib/db'
import type { User } from '@/generated/client'

export type CourseForTeaching = {
  id: string
  userId: string
  title: string
  faecher: { id: string; name: string }[]
}

/**
 * Course owner (teacher) or platform admin may access teaching views
 * (grading, attachments, etc.) for a course.
 */
export async function getCourseIfTeachable(
  courseId: string,
  viewer: Pick<User, 'id' | 'isAdmin'>,
): Promise<{ course: CourseForTeaching } | null> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      userId: true,
      title: true,
      faecher: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!course) return null

  const isOwner = course.userId === viewer.id
  const isAdmin = viewer.isAdmin === true

  if (!isOwner && !isAdmin) return null

  return { course }
}

/** Loads viewer by session id and applies {@link getCourseIfTeachable}. */
export async function getCourseIfTeachableBySession(
  courseId: string,
  sessionUserId: string,
): Promise<{ course: CourseForTeaching } | null> {
  const viewer = await db.user.findUnique({
    where: { id: sessionUserId },
    select: { id: true, isAdmin: true },
  })
  if (!viewer) return null
  return getCourseIfTeachable(courseId, viewer)
}
