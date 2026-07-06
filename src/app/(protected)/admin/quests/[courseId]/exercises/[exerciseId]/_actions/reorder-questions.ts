'use server'

import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'

export async function reorderQuestions(
  courseId: string,
  exerciseId: string,
  list: { id: string; position: number }[],
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getSessionUser()
    if (!user?.isTeacher && !user?.isAdmin) {
      return { success: false, error: 'Unauthorized' }
    }

    const teachable = await getCourseIfTeachable(courseId, {
      id: user.id,
      isAdmin: user.isAdmin ?? false,
    })
    if (!teachable) return { success: false, error: 'Unauthorized' }

    await Promise.all(
      list.map((item) =>
        db.exerciseQuestion.update({
          where: { id: item.id, exerciseId },
          data: { position: item.position },
        }),
      ),
    )

    return { success: true }
  } catch (error) {
    console.error('[REORDER_QUESTIONS]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
