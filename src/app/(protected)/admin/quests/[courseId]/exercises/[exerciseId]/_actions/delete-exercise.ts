'use server'

import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'

export async function deleteExercise(
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

    await db.exercise.delete({
      where: { id: exerciseId, courseId },
    })

    return { success: true }
  } catch (error) {
    console.error('[DELETE_EXERCISE]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
