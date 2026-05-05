'use server'

import { auth } from '@/lib/auth'
import { getCourseIfTeachableBySession } from '@/lib/can-access-course-for-teaching'
import { headers } from 'next/headers'
import { db } from '@/lib/db'

export async function updateCourseFaecher(
  courseId: string,
  faecher: { id: string; name: string }[],
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
      include: { faecher: true },
    })

    if (!course) {
      return { success: false, error: 'Projekt nicht gefunden' }
    }

    const selectedIds = faecher.map((f) => f.id)

    const toDisconnect = course.faecher.filter(
      (f) => !selectedIds.includes(f.id),
    )
    const toConnect = faecher.filter((f) => selectedIds.includes(f.id))

    await db.course.update({
      where: { id: courseId },
      data: {
        faecher: {
          disconnect: toDisconnect.map(({ id }) => ({ id })),
          connect: toConnect.map(({ id }) => ({ id })),
        },
      },
    })

    return { success: true }
  } catch (error) {
    console.error('[UPDATE_FAECHER]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
