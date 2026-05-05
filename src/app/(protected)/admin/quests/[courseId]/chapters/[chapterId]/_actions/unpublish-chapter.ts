'use server'

import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'

export async function unpublishChapter(
  courseId: string,
  chapterId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getSessionUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (!user.isTeacher && !user.isAdmin) {
      return { success: false, error: 'Unauthorized' }
    }

    const teachable = await getCourseIfTeachable(courseId, {
      id: user.id,
      isAdmin: user.isAdmin ?? false,
    })
    if (!teachable) return { success: false, error: 'Unauthorized' }

    await db.chapter.update({
      where: { id: chapterId, courseId },
      data: { isPublished: false },
    })

    // Unpublish course if no published chapters remain
    const remainingPublished = await db.chapter.count({
      where: { courseId, isPublished: true },
    })
    if (remainingPublished === 0) {
      await db.course.update({
        where: { id: courseId },
        data: { isPublished: false },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('[UNPUBLISH_CHAPTER]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
