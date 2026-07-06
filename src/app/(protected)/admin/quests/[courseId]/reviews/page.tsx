import { auth } from '@/lib/auth'
import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ReviewResponseForm } from './_components/review-response-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) redirect('/')

  const viewer = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isAdmin: true },
  })
  if (!viewer) redirect('/')

  const teachable = await getCourseIfTeachable(courseId, viewer)
  if (!teachable) redirect('/admin/quests')

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { title: true },
  })

  const pending = await db.exerciseResponse.findMany({
    where: {
      needsReview: true,
      attempt: {
        exercise: { courseId },
      },
    },
    include: {
      question: {
        select: { points: true, kind: true },
      },
      attempt: {
        include: {
          exercise: { select: { title: true } },
          user: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <section className="flex flex-1 flex-col gap-6 px-4 pb-8">
      <Link
        href={`/admin/quests/${courseId}`}
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" />
        Zurück zur Questgestaltung
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Aufgaben prüfen
        </h1>
        <p className="text-muted-foreground text-sm">
          {course?.title} — {pending.length} offene Antwort(en)
        </p>
      </div>

      {pending.length === 0 && (
        <p className="text-muted-foreground text-sm italic">
          Keine Antworten zur Prüfung.
        </p>
      )}

      <div className="mx-auto w-full max-w-3xl space-y-4">
        {pending.map((res) => {
          const answer = res.answer as { text?: string }
          const feedback =
            typeof res.feedback === 'string'
              ? res.feedback
              : res.feedback
                ? JSON.stringify(res.feedback)
                : null

          return (
            <Card key={res.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">
                    {res.attempt.exercise.title}
                  </CardTitle>
                  <Badge variant="secondary">{res.question.kind}</Badge>
                </div>
                <CardDescription>
                  {res.attempt.user.name} ({res.attempt.user.email})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReviewResponseForm
                  courseId={courseId}
                  responseId={res.id}
                  autoScore={res.autoScore}
                  maxPoints={res.question.points}
                  studentAnswer={answer?.text ?? JSON.stringify(res.answer)}
                  aiFeedback={feedback}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
