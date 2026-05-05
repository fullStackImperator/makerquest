'use server'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'

export async function enrollCourse(
  courseId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getSessionUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const course = await db.course.findUnique({
      where: { id: courseId, isPublished: true },
    })

    if (!course) {
      return { success: false, error: 'Nicht gefunden' }
    }

    const existing = await db.purchase.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    })

    if (existing) {
      return { success: false, error: 'Du hast das Projekt bereits begonnen' }
    }

    await db.purchase.create({
      data: { courseId, userId: user.id },
    })

    return { success: true }
  } catch (error) {
    console.error('[ENROLL_COURSE]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
