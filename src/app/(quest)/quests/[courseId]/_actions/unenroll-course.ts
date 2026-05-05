'use server'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'

export async function unenrollCourse(
  courseId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getSessionUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    await db.purchase.deleteMany({
      where: { userId: user.id, courseId },
    })

    await db.grading.deleteMany({
      where: { userId: user.id, courseId },
    })

    await db.userProgress.deleteMany({
      where: { userId: user.id, chapter: { courseId } },
    })

    return { success: true }
  } catch (error) {
    console.error('[UNENROLL_COURSE]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
