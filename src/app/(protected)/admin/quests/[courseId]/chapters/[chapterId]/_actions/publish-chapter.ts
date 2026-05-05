'use server'

import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'

export async function publishChapter(
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

    const chapter = await db.chapter.findUnique({
      where: { id: chapterId, courseId },
    })
    if (!chapter?.title || !chapter?.mathEditor) {
      return { success: false, error: 'Pflichtfelder fehlen' }
    }

    await db.chapter.update({
      where: { id: chapterId, courseId },
      data: { isPublished: true },
    })

    return { success: true }
  } catch (error) {
    console.error('[PUBLISH_CHAPTER]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
