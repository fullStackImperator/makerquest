'use server'

import { revalidatePath } from 'next/cache'

import { getSessionUser } from '@/lib/get-session-user'
import { db } from '@/lib/db'

async function requireTeacherOrAdmin() {
  const user = await getSessionUser()
  if (!user) return null
  if (!user.isTeacher && !user.isAdmin) return null
  return user
}

export async function createFaqEntry(payload: {
  question: string
  answer: string
}) {
  const user = await requireTeacherOrAdmin()
  if (!user) return { success: false as const, error: 'Unauthorized' }

  const question = payload.question.trim()
  const answer = payload.answer.trim()
  if (!question || !answer) {
    return {
      success: false as const,
      error: 'Frage und Antwort sind erforderlich.',
    }
  }

  const last = await db.faqEntry.findFirst({
    orderBy: { position: 'desc' },
    select: { position: true },
  })
  const nextPosition = (last?.position ?? -1) + 1

  const entry = await db.faqEntry.create({
    data: { question, answer, position: nextPosition },
  })

  revalidatePath('/help')
  return { success: true as const, id: entry.id }
}

export async function updateFaqEntry(
  id: string,
  payload: { question: string; answer: string },
) {
  const user = await requireTeacherOrAdmin()
  if (!user) return { success: false as const, error: 'Unauthorized' }

  const question = payload.question.trim()
  const answer = payload.answer.trim()
  if (!question || !answer) {
    return {
      success: false as const,
      error: 'Frage und Antwort sind erforderlich.',
    }
  }

  await db.faqEntry.update({
    where: { id },
    data: { question, answer },
  })

  revalidatePath('/help')
  return { success: true as const }
}

export async function deleteFaqEntry(id: string) {
  const user = await requireTeacherOrAdmin()
  if (!user) return { success: false as const, error: 'Unauthorized' }

  await db.faqEntry.delete({ where: { id } })

  revalidatePath('/help')
  return { success: true as const }
}
