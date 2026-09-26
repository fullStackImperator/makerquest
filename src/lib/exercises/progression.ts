import 'server-only'

import { cache } from 'react'
import { db } from '@/lib/db'

export type ProgressionItem = {
  kind: 'chapter' | 'exercise'
  id: string
  title: string
  position: number
  isFree: boolean
  /** Chapter marked as done / Aufgabe passed. */
  done: boolean
  /** Aufgabe passed but a short answer is still waiting for the teacher. */
  pendingReview: boolean
  /** Behind an Aufgabe that isn't passed yet. */
  lockedBy: { id: string; title: string } | null
}

/**
 * Passed = every active question answered correctly at least once (retries
 * allowed) and every short answer submitted. First-try points only affect XP,
 * so a student can never get stuck behind an Aufgabe.
 */
export async function getExercisePassState(userId: string, exerciseIds: string[]) {
  const [exercises, attempts] = await Promise.all([
    db.exercise.findMany({
      where: { id: { in: exerciseIds } },
      select: { id: true, questions: { where: { archivedAt: null }, select: { id: true, kind: true } } },
    }),
    db.exerciseAttempt.findMany({
      where: { userId, exerciseId: { in: exerciseIds } },
      select: {
        exerciseId: true,
        responses: { select: { questionId: true, tries: true, correct: true, needsReview: true } },
      },
    }),
  ])

  const responsesByExercise = new Map(
    attempts.map((a) => [a.exerciseId, new Map(a.responses.map((r) => [r.questionId, r]))]),
  )

  const result = new Map<string, { passed: boolean; pendingReview: boolean }>()
  for (const exercise of exercises) {
    const responses = responsesByExercise.get(exercise.id) ?? new Map()
    const passed = exercise.questions.every((q) => {
      const r = responses.get(q.id)
      if (!r || r.tries === 0) return false
      return q.kind === 'SHORT_TEXT' ? true : r.correct === true
    })
    const pendingReview = exercise.questions.some((q) => responses.get(q.id)?.needsReview)
    result.set(exercise.id, { passed, pendingReview })
  }
  return result
}

/** Published chapters and Aufgaben of a quest in order, with done/locked state for one student. */
export async function getCourseProgression(userId: string, courseId: string) {
  const [chapters, exercises] = await Promise.all([
    db.chapter.findMany({
      where: { courseId, isPublished: true },
      select: {
        id: true,
        title: true,
        position: true,
        isFree: true,
        userProgress: { where: { userId }, select: { isCompleted: true } },
      },
    }),
    db.exercise.findMany({
      where: { courseId, isPublished: true, chapterId: null },
      select: { id: true, title: true, position: true, isFree: true },
    }),
  ])

  const passState = await getExercisePassState(userId, exercises.map((e) => e.id))

  const ordered = [
    ...chapters.map((c) => ({
      kind: 'chapter' as const,
      id: c.id,
      title: c.title,
      position: c.position,
      isFree: c.isFree,
      done: !!c.userProgress[0]?.isCompleted,
      pendingReview: false,
    })),
    ...exercises.map((e) => ({
      kind: 'exercise' as const,
      id: e.id,
      title: e.title,
      position: e.position,
      isFree: e.isFree,
      done: passState.get(e.id)?.passed ?? false,
      pendingReview: passState.get(e.id)?.pendingReview ?? false,
    })),
  ].sort((a, b) => a.position - b.position)

  let blocker: { id: string; title: string } | null = null
  const items: ProgressionItem[] = ordered.map((item) => {
    const lockedBy = blocker
    if (!blocker && item.kind === 'exercise' && !item.done) {
      blocker = { id: item.id, title: item.title }
    }
    return { ...item, lockedBy }
  })

  const doneCount = items.filter((i) => i.done).length
  const progress = items.length > 0 ? (doneCount / items.length) * 100 : 0
  return { items, progress }
}

/**
 * Per-request cached variant for rendering (layout, sidebar and page ask for
 * the same data). Server actions use getCourseProgression, which is always fresh.
 */
export const getCourseProgressionForPage = cache(getCourseProgression)
