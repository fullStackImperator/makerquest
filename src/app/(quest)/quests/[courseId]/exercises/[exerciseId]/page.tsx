import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { redirect } from 'next/navigation'
import { ExerciseRunner } from './_components/exercise-runner'
import { startOrGetAttempt } from './_actions/start-attempt'
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
    },
    include: {
      questions: { orderBy: { position: 'asc' } },
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

  const startResult = await startOrGetAttempt(exerciseId)
  if (!startResult.success) {
    return (
      <div className="p-6">
        <Banner variant="warning" label={startResult.error} />
      </div>
    )
  }

  const attempt = await db.exerciseAttempt.findUnique({
    where: { id: startResult.attemptId },
    include: { responses: true },
  })

  if (!attempt) redirect(`/quests/${courseId}`)

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
        exercise={exercise}
        attempt={attempt}
        courseId={courseId}
      />
    </div>
  )
}
