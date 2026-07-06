'use server'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import type { Prisma } from '@/generated/client'

export async function saveResponse(
  attemptId: string,
  questionId: string,
  answerJson: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getSessionUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const attempt = await db.exerciseAttempt.findFirst({
      where: { id: attemptId, userId: user.id },
    })

    if (!attempt || attempt.status !== 'IN_PROGRESS') {
      return { success: false, error: 'Versuch nicht bearbeitbar' }
    }

    const answer = JSON.parse(answerJson) as Prisma.InputJsonValue

    await db.exerciseResponse.upsert({
      where: {
        attemptId_questionId: { attemptId, questionId },
      },
      create: {
        attemptId,
        questionId,
        answer,
      },
      update: { answer },
    })

    return { success: true }
  } catch (error) {
    console.error('[SAVE_RESPONSE]', error)
    return { success: false, error: 'Etwas ist schiefgelaufen' }
  }
}
