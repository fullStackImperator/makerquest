'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { headers } from 'next/headers'

export type EnrollResult =
  | { success: true }
  | { success: false; error: string }

export async function enrollInCourse(courseId: string): Promise<EnrollResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id

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
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id

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
