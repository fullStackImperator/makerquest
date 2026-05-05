'use server'

import { auth } from '@/lib/auth'
import { getCourseIfTeachableBySession } from '@/lib/can-access-course-for-teaching'
import { headers } from 'next/headers'
import { db } from '@/lib/db'

export async function giveBadges(
  courseId: string,
  updateData: { userId: string; badgeId: string | null }[],
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

    for (const { userId, badgeId } of updateData) {
      if (!badgeId) continue

      const existing = await db.userBadge.findFirst({
        where: { userId, badgeId },
      })

      if (!existing) {
        await db.userBadge.create({
          data: { userId, badgeId },
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[BADGES_GIVE_USERS]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
