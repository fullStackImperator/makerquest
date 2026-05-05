'use server'

import { auth } from '@/lib/auth'
import { getCourseIfTeachableBySession } from '@/lib/can-access-course-for-teaching'
import { headers } from 'next/headers'
import { db } from '@/lib/db'

export async function publishCourse(
  courseId: string,
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

    const ownCourse = await db.course.findUnique({
      where: { id: courseId },
    })

    if (!ownCourse) {
      return { success: false, error: 'Unauthorized' }
    }

    if (!ownCourse.title || !ownCourse.description) {
      return { success: false, error: 'Fehlende Pflichtfelder' }
    }

    await db.course.update({
      where: { id: courseId },
      data: { isPublished: true },
    })

    return { success: true }
  } catch (error) {
    console.error('[COURSE_PUBLISH]', error)
    return { success: false, error: 'Etwas ist schief gelaufen' }
  }
}
