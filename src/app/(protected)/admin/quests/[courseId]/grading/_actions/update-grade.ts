'use server'

import { auth } from '@/lib/auth'
import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { headers } from 'next/headers'
import { db } from '@/lib/db'

export async function updateGrade(
  courseId: string,
  updateData: { userId: string; points: number }[],
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isAdmin: true, isTeacher: true },
    })

    if (!user?.isTeacher && !user?.isAdmin) {
      return { success: false, error: 'Unauthorized' }
    }

    const teachable = await getCourseIfTeachable(courseId, user)
    if (!teachable) {
      return { success: false, error: 'Unauthorized' }
    }

    for (const { userId, points } of updateData) {
      const existing = await db.grading.findFirst({
        where: { userId, courseId },
      })

      if (existing) {
        await db.grading.update({
          where: { userId_courseId: { userId, courseId } },
          data: { points },
        })
      } else {
        await db.grading.create({
          data: { userId, courseId, points },
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[UPDATE_GRADE]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
