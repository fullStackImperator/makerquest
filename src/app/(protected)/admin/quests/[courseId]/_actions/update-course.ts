'use server'

import { auth } from '@/lib/auth'
import { getCourseIfTeachableBySession } from '@/lib/can-access-course-for-teaching'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { Course } from '@/generated/client'

type UpdateCourseData = Partial<
  Pick<
    Course,
    | 'title'
    | 'description'
    | 'imageUrl'
    | 'isPublished'
    | 'klassenstufe'
    | 'schwierigkeit'
    | 'vorkenntnisse'
    | 'kompetenzen'
    | 'longDescription'
    | 'prerequisites'
  >
>

export async function updateCourse(
  courseId: string,
  data: UpdateCourseData,
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

    await db.course.update({
      where: { id: courseId },
      data,
    })

    return { success: true }
  } catch (error) {
    console.error('[UPDATE_COURSE]', error)
    return { success: false, error: 'Etwas ist schief gelaufen' }
  }
}
