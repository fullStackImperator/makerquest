'use server'

import { auth } from '@/lib/auth'
import { getCourseIfTeachableBySession } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import type { CourseItemKind } from '@/lib/exercises/types'
import { headers } from 'next/headers'

export async function reorderCourseItems(
  courseId: string,
  list: { kind: CourseItemKind; id: string; position: number }[],
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }

    const teachable = await getCourseIfTeachableBySession(
      courseId,
      session.user.id,
    )
    if (!teachable) {
      return { success: false, error: 'Unauthorized' }
    }

    await db.$transaction(
      list.map((item) => {
        if (item.kind === 'chapter') {
          return db.chapter.update({
            where: { id: item.id, courseId },
            data: { position: item.position },
          })
        }
        return db.exercise.update({
          where: { id: item.id, courseId },
          data: { position: item.position },
        })
      }),
    )

    return { success: true }
  } catch (error) {
    console.error('[REORDER_COURSE_ITEMS]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
