'use server'

import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'

export async function unpublishExercise(
  courseId: string,
  exerciseId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getSessionUser()
    if (!user?.isTeacher && !user?.isAdmin) {
      return { success: false, error: 'Unauthorized' }
    }

    const teachable = await getCourseIfTeachable(courseId, {
      id: user!.id,
      isAdmin: user!.isAdmin ?? false,
    })
    if (!teachable) return { success: false, error: 'Unauthorized' }

    await db.exercise.update({
      where: { id: exerciseId, courseId },
      data: { isPublished: false },
    })

    return { success: true }
  } catch (error) {
    console.error('[UNPUBLISH_EXERCISE]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
