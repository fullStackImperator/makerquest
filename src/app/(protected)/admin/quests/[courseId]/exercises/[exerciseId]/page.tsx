import { ExerciseTitleForm } from './_components/exercise-title-form'
import { ExerciseIntroForm } from './_components/exercise-intro-form'
import { ExerciseActions } from './_components/exercise-actions'
import { AddQuestionMenu } from './_components/add-question-menu'
import { ExerciseSettingsForm } from './_components/exercise-settings-form'
import { QuestionEditor } from './_components/question-editor'
import { Banner } from '@/components/banner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { auth } from '@/lib/auth'
import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { headers } from 'next/headers'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

interface ExercisePageProps {
  params: Promise<{ courseId: string; exerciseId: string }>
}

export default async function ExerciseEditorPage({ params }: ExercisePageProps) {
  const { courseId, exerciseId } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) redirect('/')

  const viewer = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isAdmin: true },
  })
  if (!viewer) redirect('/')

  const teachable = await getCourseIfTeachable(courseId, viewer)
  if (!teachable) redirect('/admin/quests')

  const exercise = await db.exercise.findFirst({
    where: { id: exerciseId, courseId },
    include: {
      questions: { orderBy: { position: 'asc' } },
    },
  })

  if (!exercise) redirect('/')

  const isComplete = !!exercise.title && exercise.questions.length > 0

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 px-4">
      {!exercise.isPublished && (
        <Banner
          variant="warning"
          label="Diese Aufgabe ist nicht veröffentlicht."
        />
      )}

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-6">
        <Link
          href={`/admin/quests/${courseId}`}
          className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="size-4 shrink-0" />
          Zurück zur Kursgestaltung
        </Link>

        <div className="border-border/60 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Aufgabe bearbeiten
            </h1>
            {!isComplete && (
              <p className="text-muted-foreground text-sm">
                Titel und mindestens eine Frage zum Veröffentlichen.
              </p>
            )}
          </div>
          <ExerciseActions
            disabled={!isComplete}
            courseId={courseId}
            exerciseId={exerciseId}
            isPublished={exercise.isPublished}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Titel</CardTitle>
          </CardHeader>
          <CardContent>
            <ExerciseTitleForm
              initialData={exercise}
              courseId={courseId}
              exerciseId={exerciseId}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Einleitung</CardTitle>
            <CardDescription>
              Optionaler Text vor den Fragen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExerciseIntroForm
              initialData={exercise}
              courseId={courseId}
              exerciseId={exerciseId}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Einstellungen</CardTitle>
          </CardHeader>
          <CardContent>
            <ExerciseSettingsForm
              initialData={exercise}
              courseId={courseId}
              exerciseId={exerciseId}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Fragen</CardTitle>
              <CardDescription>
                {exercise.questions.length} Frage(n)
              </CardDescription>
            </div>
            <AddQuestionMenu courseId={courseId} exerciseId={exerciseId} />
          </CardHeader>
          <CardContent className="space-y-6">
            {exercise.questions.length === 0 && (
              <p className="text-muted-foreground text-sm italic">
                Noch keine Fragen — füge eine hinzu.
              </p>
            )}
            {exercise.questions.map((q) => (
              <QuestionEditor
                key={q.id}
                question={q}
                courseId={courseId}
                exerciseId={exerciseId}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
