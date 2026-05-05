'use server'

import { auth } from '@/lib/auth'
import { getCourseIfTeachableBySession } from '@/lib/can-access-course-for-teaching'
import { headers } from 'next/headers'
import { db } from '@/lib/db'

export async function reorderChapters(
  courseId: string,
  list: { id: string; position: number }[],
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }

    const teachable = await getCourseIfTeachableBySession(courseId, session.user.id)
    if (!teachable) {
      return { success: false, error: 'Unauthorized' }
    }

    await Promise.all(
      list.map((item) =>
        db.chapter.update({
          where: { id: item.id },
          data: { position: item.position },
        }),
      ),
    )

    return { success: true }
  } catch (error) {
    console.error('[REORDER_CHAPTERS]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
