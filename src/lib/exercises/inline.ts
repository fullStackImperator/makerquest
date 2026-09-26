import 'server-only'

import { Prisma } from '@/generated/client'
import { db } from '@/lib/db'
import { suggestExerciseXp } from './xp'
import { toQuestionState } from './attempt'
import { toPublicQuestion } from './public-question'

/** Lexical node type of the "Aufgabe" block in chapter content. */
export const EXERCISE_QUESTION_NODE_TYPE = 'exercise-question'

type LexicalNodeJson = { type?: string; questionId?: string; children?: LexicalNodeJson[] }

/** Question ids referenced by "Aufgabe" blocks, in document order. */
export function extractQuestionIds(content: unknown): string[] {
  const ids: string[] = []
  const walk = (node: LexicalNodeJson | undefined) => {
    if (!node || typeof node !== 'object') return
    if (node.type === EXERCISE_QUESTION_NODE_TYPE && typeof node.questionId === 'string') {
      ids.push(node.questionId)
    }
    node.children?.forEach(walk)
  }
  walk((content as { root?: LexicalNodeJson } | null)?.root)
  return ids
}

function replaceQuestionIds(content: unknown, mapping: Map<string, string>) {
  const walk = (node: LexicalNodeJson | undefined) => {
    if (!node || typeof node !== 'object') return
    if (node.type === EXERCISE_QUESTION_NODE_TYPE && node.questionId && mapping.has(node.questionId)) {
      node.questionId = mapping.get(node.questionId)
    }
    node.children?.forEach(walk)
  }
  walk((content as { root?: LexicalNodeJson } | null)?.root)
}

/** The hidden Aufgabe that holds a chapter's inline questions; created on first use. */
export async function ensureChapterContainer(chapterId: string) {
  const existing = await db.exercise.findUnique({ where: { chapterId } })
  if (existing) return existing

  const chapter = await db.chapter.findUniqueOrThrow({
    where: { id: chapterId },
    select: {
      title: true,
      courseId: true,
      course: { select: { klassenstufe: true, schwierigkeit: true } },
    },
  })
  try {
    return await db.exercise.create({
      data: {
        chapterId,
        courseId: chapter.courseId,
        title: `Fragen im Kapitel „${chapter.title}“`,
        position: 0, // not a course item; never listed
        isPublished: true, // visibility follows the chapter
        xpReward: suggestExerciseXp(chapter.course),
      },
    })
  } catch (error) {
    // Created concurrently by another request.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return db.exercise.findUniqueOrThrow({ where: { chapterId } })
    }
    throw error
  }
}

/**
 * Brings the container in line with the saved chapter content:
 * - questions no longer in the text are archived (answers are kept),
 * - questions put back (undo, paste) are restored,
 * - blocks copied from another chapter get their own copy of the question,
 * - question order follows the text.
 * Returns the content with rewritten ids when copies were made.
 */
export async function syncInlineQuestions(chapterId: string, content: unknown) {
  const ids = extractQuestionIds(content)
  const container = await db.exercise.findUnique({
    where: { chapterId },
    select: { id: true, questions: { select: { id: true, archivedAt: true } } },
  })
  if (!container && ids.length === 0) return { content, rewritten: false }

  const target = container ?? (await ensureChapterContainer(chapterId))
  const own = new Set((container?.questions ?? []).map((q) => q.id))
  const foreignIds = ids.filter((id) => !own.has(id))

  const mapping = new Map<string, string>()
  if (foreignIds.length > 0) {
    const foreign = await db.exerciseQuestion.findMany({ where: { id: { in: foreignIds } } })
    for (const q of foreign) {
      const copy = await db.exerciseQuestion.create({
        data: {
          exerciseId: target.id,
          kind: q.kind,
          prompt: q.prompt as Prisma.InputJsonValue,
          spec: q.spec as Prisma.InputJsonValue,
          solution: q.solution as Prisma.InputJsonValue,
          explanation: (q.explanation ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          points: q.points,
          position: 0,
        },
        select: { id: true },
      })
      mapping.set(q.id, copy.id)
    }
    replaceQuestionIds(content, mapping)
  }

  const finalIds = ids.map((id) => mapping.get(id) ?? id)
  const referenced = new Set(finalIds)
  const now = new Date()

  await db.$transaction([
    db.exerciseQuestion.updateMany({
      where: { exerciseId: target.id, id: { notIn: finalIds }, archivedAt: null },
      data: { archivedAt: now },
    }),
    db.exerciseQuestion.updateMany({
      where: { exerciseId: target.id, id: { in: finalIds }, archivedAt: { not: null } },
      data: { archivedAt: null },
    }),
    ...finalIds
      .filter((id) => referenced.has(id))
      .map((id, position) =>
        db.exerciseQuestion.updateMany({ where: { id, exerciseId: target.id }, data: { position } }),
      ),
  ])

  return { content, rewritten: mapping.size > 0 }
}

/** Public questions of a chapter's "Aufgabe" blocks with the student's state. */
export async function getInlineQuestionsForStudent(userId: string, chapterId: string) {
  const container = await db.exercise.findUnique({
    where: { chapterId },
    select: {
      id: true,
      xpReward: true,
      questions: { where: { archivedAt: null }, orderBy: { position: 'asc' } },
      attempts: { where: { userId }, select: { responses: true } },
    },
  })
  if (!container) return []

  const responses = new Map((container.attempts[0]?.responses ?? []).map((r) => [r.questionId, r]))
  const maxPoints = container.questions.reduce((s, q) => s + q.points, 0)
  return container.questions.map((q) => ({
    question: toPublicQuestion(q, { xpReward: container.xpReward, maxPoints }),
    state: toQuestionState(q, responses.get(q.id)),
  }))
}

/** How many of a chapter's questions the student hasn't answered yet. */
export async function countOpenInlineQuestions(userId: string, chapterId: string) {
  const container = await db.exercise.findUnique({
    where: { chapterId },
    select: {
      questions: { where: { archivedAt: null }, select: { id: true } },
      attempts: {
        where: { userId },
        select: { responses: { where: { tries: { gt: 0 } }, select: { questionId: true } } },
      },
    },
  })
  if (!container) return 0
  const answered = new Set((container.attempts[0]?.responses ?? []).map((r) => r.questionId))
  return container.questions.filter((q) => !answered.has(q.id)).length
}
