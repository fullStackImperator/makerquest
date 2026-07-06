'use server'

import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'

export async function publishExercise(
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

    const exercise = await db.exercise.findUnique({
      where: { id: exerciseId, courseId },
      include: { questions: true },
    })

    if (!exercise?.title) {
      return { success: false, error: 'Titel fehlt' }
    }
    if (exercise.questions.length === 0) {
      return { success: false, error: 'Mindestens eine Frage erforderlich' }
    }

    await db.exercise.update({
      where: { id: exerciseId, courseId },
      data: { isPublished: true },
    })

    return { success: true }
  } catch (error) {
    console.error('[PUBLISH_EXERCISE]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
