import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { redirect } from 'next/navigation'
import { ExerciseRunner } from './_components/exercise-runner'
import { toQuestionState } from '@/lib/exercises/attempt'
import { toPublicQuestion } from '@/lib/exercises/public-question'
import { getCourseProgressionForPage } from '@/lib/exercises/progression'
import { LockedByExercise } from '@/components/exercises/locked-by-exercise'
import { Banner } from '@/components/banner'

interface ExercisePageProps {
  params: Promise<{ courseId: string; exerciseId: string }>
}

export default async function StudentExercisePage({
  params,
}: ExercisePageProps) {
  const { courseId, exerciseId } = await params
  const user = await getSessionUser()
  if (!user) redirect('/')

  const exercise = await db.exercise.findFirst({
    where: {
      id: exerciseId,
      courseId,
      isPublished: true,
      chapterId: null, // a chapter's inline questions are answered in the chapter
    },
    include: {
      questions: { where: { archivedAt: null }, orderBy: { position: 'asc' } },
    },
  })

  if (!exercise) redirect(`/quests/${courseId}`)

  const purchase = await db.purchase.findUnique({
    where: {
      userId_courseId: { userId: user.id, courseId },
    },
  })

  if (!exercise.isFree && !purchase) {
    return (
      <div className="p-6">
        <Banner
          variant="warning"
          label="Diese Aufgabe ist gesperrt. Melde dich für den Quest an."
        />
      </div>
    )
  }

  const { items } = await getCourseProgressionForPage(user.id, courseId)
  const lockedBy = items.find((i) => i.id === exerciseId)?.lockedBy
  const next = items[items.findIndex((i) => i.id === exerciseId) + 1]
  const nextHref = next
    ? `/quests/${courseId}/${next.kind === 'chapter' ? 'chapters' : 'exercises'}/${next.id}`
    : undefined
  if (lockedBy) {
    return (
      <div className="px-4 py-10">
        <LockedByExercise courseId={courseId} exercise={lockedBy} />
      </div>
    )
  }

  // The attempt is created with the first "Prüfen".
  const attempt = await db.exerciseAttempt.findUnique({
    where: { userId_exerciseId: { userId: user.id, exerciseId } },
    include: { responses: true },
  })
  const responses = new Map(attempt?.responses.map((r) => [r.questionId, r]) ?? [])

  // Only public data goes to the browser: no solutions, accepted answers or model answers.
  const maxPoints = exercise.questions.reduce((s, q) => s + q.points, 0)
  const questions = exercise.questions.map((q) => ({
    question: toPublicQuestion(q, { xpReward: exercise.xpReward, maxPoints }),
    state: toQuestionState(q, responses.get(q.id)),
  }))

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {exercise.title}
        </h1>
        {exercise.description && (
          <p className="text-muted-foreground mt-1 text-sm">
            {exercise.description}
          </p>
        )}
      </div>
      <ExerciseRunner
        intro={exercise.intro}
        xpReward={exercise.xpReward}
        questions={questions}
        initialProgress={
          attempt
            ? {
                checked: questions.filter((q) => q.state.tries > 0).length,
                total: questions.length,
                totalScore: attempt.totalScore,
                maxScore: questions.reduce((s, q) => s + q.question.points, 0),
                status: attempt.status,
              }
            : null
        }
        xpAwarded={attempt?.xpAwardedAt ? attempt.xpAwarded : null}
        nextHref={nextHref}
      />
    </div>
  )
}
