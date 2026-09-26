'use server'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'

export type EnrollResult =
  | { success: true }
  | { success: false; error: string }

export async function enrollInCourse(courseId: string): Promise<EnrollResult> {
  try {
    const user = await getSessionUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = user.id

    const course = await db.course.findUnique({
      where: {
        id: courseId,
        isPublished: true,
      },
    })

    const purchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    })

    if (purchase) {
      return { success: false, error: 'Du hast das Projekt bereits begonnen' }
    }

    if (!course) {
      return { success: false, error: 'Nicht gefunden' }
    }

    await db.purchase.create({
      data: {
        courseId,
        userId,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('[ENROLL_COURSE]', error)
    return { success: false, error: 'Internal Error' }
  }
}

export async function unenrollFromCourse(
  courseId: string
): Promise<EnrollResult> {
  try {
    const user = await getSessionUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = user.id

    await db.purchase.deleteMany({
      where: {
        userId,
        courseId,
      },
    })

    await db.grading.deleteMany({
      where: {
        userId,
        courseId,
      },
    })

    await db.userProgress.deleteMany({
      where: {
        userId,
        chapter: {
          courseId,
        },
      },
    })

    return { success: true }
  } catch (error) {
    console.error('[UNENROLL_COURSE]', error)
    return { success: false, error: 'Internal Error' }
  }
}
