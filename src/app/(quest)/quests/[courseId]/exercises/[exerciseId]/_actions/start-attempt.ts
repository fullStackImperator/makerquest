'use server'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'

export async function startOrGetAttempt(
  exerciseId: string,
): Promise<
  | { success: true; attemptId: string }
  | { success: false; error: string }
> {
  try {
    const user = await getSessionUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const existing = await db.exerciseAttempt.findUnique({
      where: {
        userId_exerciseId: { userId: user.id, exerciseId },
      },
    })

    if (existing) {
      return { success: true, attemptId: existing.id }
    }

    const attempt = await db.exerciseAttempt.create({
      data: {
        userId: user.id,
        exerciseId,
      },
    })

    return { success: true, attemptId: attempt.id }
  } catch (error) {
    console.error('[START_ATTEMPT]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
