'use server'

import { getSessionUser } from '@/lib/get-session-user'
import { db } from '@/lib/db'

/**
 * Returns segment index -> label overrides for dynamic breadcrumb segments
 * (e.g. course title at index 2, chapter title at index 4 on admin quest/chapter routes).
 */
export async function getBreadcrumbLabels(
  pathname: string
): Promise<Record<number, string>> {
  const user = await getSessionUser()
  if (!user) return {}

  const segments = pathname.split('/').filter(Boolean)
  const overrides: Record<number, string> = {}

  // /admin/quests/:courseId or /admin/quests/:courseId/chapters/:chapterId or .../badges, .../grading
  if (
    segments[0] === 'admin' &&
    segments[1] === 'quests' &&
    segments.length >= 3
  ) {
    const courseId = segments[2]
    const course = await db.course.findFirst({
      where: { id: courseId, userId: user.id },
      select: { title: true },
    })
    if (course) {
      overrides[2] = course.title
    }
  }

  // /quests/:courseId (learner quest view)
  if (segments[0] === 'quests' && segments.length >= 2) {
    const courseId = segments[1]
    const course = await db.course.findFirst({
      where: { id: courseId },
      select: { title: true },
    })
    if (course) {
      overrides[1] = course.title
    }
  }

  // /quests/:courseId/chapters/:chapterId
  if (
    segments.length >= 4 &&
    segments[0] === 'quests' &&
    segments[2] === 'chapters'
  ) {
    const chapterId = segments[3]
    const chapter = await db.chapter.findFirst({
      where: { id: chapterId },
      select: { title: true },
    })
    if (chapter) {
      overrides[3] = chapter.title
    }
  }

  // /admin/quests/:courseId/chapters/:chapterId
  if (
    segments.length >= 5 &&
    segments[0] === 'admin' &&
    segments[1] === 'quests' &&
    segments[3] === 'chapters'
  ) {
    const chapterId = segments[4]
    const chapter = await db.chapter.findFirst({
      where: {
        id: chapterId,
        course: { userId: user.id },
      },
      select: { title: true },
    })
    if (chapter) {
      overrides[4] = chapter.title
    }
    // overrides[2] already set above if course was found
  }

  return overrides
}
