'use server'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { maybeCompleteLearningPathForCourse } from '@/lib/learning-path-complete-step'

export async function updateChapterProgress(
  courseId: string,
  chapterId: string,
  isCompleted: boolean,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getSessionUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    await db.userProgress.upsert({
      where: { userId_chapterId: { userId: user.id, chapterId } },
      update: { isCompleted },
      create: { userId: user.id, chapterId, isCompleted },
    })

    if (isCompleted) {
      await maybeCompleteLearningPathForCourse(user.id, courseId)
    }

    return { success: true }
  } catch (error) {
    console.error('[UPDATE_CHAPTER_PROGRESS]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
