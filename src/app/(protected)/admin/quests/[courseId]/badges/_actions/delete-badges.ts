'use server'

import { auth } from '@/lib/auth'
import { getCourseIfTeachableBySession } from '@/lib/can-access-course-for-teaching'
import { headers } from 'next/headers'
import { db } from '@/lib/db'

export async function deleteUserBadge(
  courseId: string,
  userId: string,
  badgeId: string,
  userBadgeId: string,
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

    if (!userId || !badgeId) {
      return { success: false, error: 'Ungültige Daten' }
    }

    await db.userBadge.delete({
      where: { id: userBadgeId, userId, badgeId },
    })

    return { success: true }
  } catch (error) {
    console.error('[BADGES_DELETE_USER]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
