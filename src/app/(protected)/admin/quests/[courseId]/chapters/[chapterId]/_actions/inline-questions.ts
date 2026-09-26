'use server'

import { revalidatePath } from 'next/cache'

import type { ExerciseQuestion, QuestionKind } from '@/generated/client'
import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { ensureChapterContainer } from '@/lib/exercises/inline'
import { defaultSpecAndSolution } from '@/lib/exercises/question-defaults'
import { getSessionUser } from '@/lib/get-session-user'
import { EMPTY_LEXICAL_STATE } from '@/lib/lexical/defaults'

async function teacherForChapter(courseId: string, chapterId: string) {
  const user = await getSessionUser()
  if (!user || (!user.isTeacher && !user.isAdmin)) return null
  if (!(await getCourseIfTeachable(courseId, user))) return null
  const chapter = await db.chapter.findFirst({ where: { id: chapterId, courseId }, select: { id: true } })
  return chapter ? user : null
}

/**
 * Creates a question for an "Aufgabe" block. It stays archived (invisible to
 * students) until the chapter is saved with the block in it.
 */
export async function createInlineQuestion(
  courseId: string,
  chapterId: string,
  kind: QuestionKind,
): Promise<{ success: true; question: ExerciseQuestion } | { success: false; error: string }> {
  if (!(await teacherForChapter(courseId, chapterId))) return { success: false, error: 'Keine Berechtigung' }

  const container = await ensureChapterContainer(chapterId)
  const { spec, solution } = defaultSpecAndSolution(kind)
  const question = await db.exerciseQuestion.create({
    data: {
      exerciseId: container.id,
      kind,
      prompt: EMPTY_LEXICAL_STATE as object,
      spec,
      solution,
      position: 0,
      archivedAt: new Date(),
    },
  })
  return { success: true, question }
}

/** Full question data (incl. solutions) for the teacher's editor. */
export async function getInlineQuestionsForEditor(
  courseId: string,
  chapterId: string,
): Promise<{ success: true; exerciseId: string | null; questions: ExerciseQuestion[] } | { success: false; error: string }> {
  if (!(await teacherForChapter(courseId, chapterId))) return { success: false, error: 'Keine Berechtigung' }
  const container = await db.exercise.findUnique({
    where: { chapterId },
    select: { id: true, questions: true },
  })
  return { success: true, exerciseId: container?.id ?? null, questions: container?.questions ?? [] }
}

/** Sets the XP a chapter's questions pay together (per Fach, scaled by first-try points). */
export async function setChapterQuestionXp(
  courseId: string,
  chapterId: string,
  xpReward: number,
): Promise<{ success: true } | { success: false; error: string }> {
  if (!(await teacherForChapter(courseId, chapterId))) return { success: false, error: 'Keine Berechtigung' }
  if (!Number.isFinite(xpReward)) return { success: false, error: 'Ungültiger Wert' }

  const container = await ensureChapterContainer(chapterId)
  await db.exercise.update({
    where: { id: container.id },
    data: { xpReward: Math.max(0, Math.min(10_000, Math.round(xpReward))) },
  })
  revalidatePath(`/admin/quests/${courseId}/chapters/${chapterId}`)
  revalidatePath(`/quests/${courseId}`, 'layout')
  return { success: true }
}
