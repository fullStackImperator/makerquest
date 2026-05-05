'use server'

import { auth } from '@/lib/auth'
import { getCourseIfTeachableBySession } from '@/lib/can-access-course-for-teaching'
import { headers } from 'next/headers'
import { db } from '@/lib/db'

export async function deleteCourse(
  courseId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isTeacher: true, isAdmin: true },
    })

    if (!user?.isTeacher && !user?.isAdmin) {
      return { success: false, error: 'Unauthorized' }
    }

    const teachable = await getCourseIfTeachableBySession(courseId, session.user.id)
    if (!teachable) {
      return { success: false, error: 'Unauthorized' }
    }

    const course = await db.course.findUnique({
      where: { id: courseId },
      include: { categories: true },
    })

    if (!course) {
      return { success: false, error: 'Nicht gefunden' }
    }

    await db.course.update({
      where: { id: courseId },
      data: {
        categories: {
          disconnect: course.categories.map(({ id }) => ({ id })),
        },
      },
    })

    await db.course.delete({
      where: { id: courseId },
    })

    return { success: true }
  } catch (error) {
    console.error('[COURSE_DELETE]', error)
    return { success: false, error: 'Etwas ist schief gelaufen' }
  }
}
