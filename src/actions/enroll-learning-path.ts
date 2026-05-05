'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { headers } from 'next/headers'

export type EnrollPathResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Start a learning path: enrollment + Purchase for first quest.
 */
export async function enrollInLearningPath(
  learningPathId: string,
): Promise<EnrollPathResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }
    const userId = session.user.id

    const path = await db.learningPath.findFirst({
      where: { id: learningPathId, isPublished: true },
      include: {
        steps: { orderBy: { position: 'asc' }, take: 1 },
      },
    })

    if (!path || path.steps.length === 0) {
      return { success: false, error: 'Lernpfad nicht verfügbar' }
    }

    const existing = await db.learningPathEnrollment.findUnique({
      where: {
        userId_learningPathId: { userId, learningPathId },
      },
    })
    if (existing) {
      return { success: false, error: 'Bereits gestartet' }
    }

    const firstCourseId = path.steps[0].courseId

    await db.$transaction(async (tx) => {
      await tx.learningPathEnrollment.create({
        data: {
          userId,
          learningPathId,
          currentStepIndex: 0,
        },
      })

      await tx.purchase.upsert({
        where: {
          userId_courseId: { userId, courseId: firstCourseId },
        },
        create: { userId, courseId: firstCourseId },
        update: {},
      })
    })

    return { success: true }
  } catch (e) {
    console.error('[enrollInLearningPath]', e)
    return { success: false, error: 'Fehler beim Starten' }
  }
}
