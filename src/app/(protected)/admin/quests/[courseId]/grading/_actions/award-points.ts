'use server'

import { awardCourseExperiencePoints } from '@/lib/award-course-xp'
import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { getSessionUser } from '@/lib/get-session-user'
import { logSecurityEvent } from '@/lib/security-log'

export const awardExperiencePoints = async ({
  userId,
  courseId,
}: {
  userId: string
  courseId: string
}): Promise<{ success: boolean }> => {
  const viewer = await getSessionUser()
  if (!viewer || !(await getCourseIfTeachable(courseId, viewer))) {
    await logSecurityEvent('unauthorized-action', {
      action: 'award-course-xp',
      userId: viewer?.id ?? null,
      courseId,
      targetUserId: userId,
    })
    return { success: false }
  }
  try {
    const result = await awardCourseExperiencePoints(userId, courseId)
    if (!result.success) {
      throw new Error('Invalid course data')
    }
    return { success: true }
  } catch (error) {
    console.error('Error awarding experience points:', error)
    return { success: false }
  }
}
