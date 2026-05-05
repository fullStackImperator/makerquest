import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { LernpfadDetailClient } from './_components/lernpfad-detail-client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { headers } from 'next/headers'

interface Props {
  params: Promise<{ userSlug: string; pathSlug: string }>
}

export default async function LernpfadDetailPage({ params }: Props) {
  const { userSlug, pathSlug } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) redirect('/')

  const viewer = await db.user.findUnique({
    where: { slug: userSlug },
    select: { id: true },
  })
  if (!viewer || viewer.id !== session.user.id) {
    redirect('/')
  }

  const path = await db.learningPath.findFirst({
    where: { slug: pathSlug, isPublished: true },
    include: {
      badge: { select: { name: true, imageUrl: true } },
      steps: {
        orderBy: { position: 'asc' },
        include: {
          course: { select: { id: true, title: true } },
        },
      },
    },
  })

  if (!path || path.steps.length === 0) notFound()

  const enrollment = await db.learningPathEnrollment.findUnique({
    where: {
      userId_learningPathId: {
        userId: viewer.id,
        learningPathId: path.id,
      },
    },
  })

  const completions = await db.learningPathStepCompletion.findMany({
    where: {
      userId: viewer.id,
      learningPathStep: { learningPathId: path.id },
    },
    select: { learningPathStepId: true },
  })
  const doneIds = new Set(completions.map((c) => c.learningPathStepId))

  const pathCompletion = await db.learningPathCompletion.findUnique({
    where: {
      userId_learningPathId: {
        userId: viewer.id,
        learningPathId: path.id,
      },
    },
  })

  const steps = path.steps.map((s) => {
    let status: 'done' | 'current' | 'locked' = 'locked'
    if (!enrollment) {
      status = 'locked'
    } else if (doneIds.has(s.id)) {
      status = 'done'
    } else if (s.position === enrollment.currentStepIndex) {
      status = 'current'
    } else {
      status = 'locked'
    }
    return {
      id: s.id,
      position: s.position,
      courseId: s.courseId,
      title: s.course.title,
      status,
    }
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Link
        href={`/lernpfade/${userSlug}`}
        className="text-muted-foreground text-sm hover:underline"
      >
        ← Alle Lernpfade
      </Link>
      <h1 className="text-2xl font-semibold">{path.title}</h1>
      {path.description && (
        <p className="text-muted-foreground text-sm">{path.description}</p>
      )}

      <LernpfadDetailClient
        pathId={path.id}
        userSlug={userSlug}
        enrolled={!!enrollment}
        pathCompleted={!!pathCompletion}
        badgeName={path.badge?.name ?? null}
        steps={steps}
      />
    </div>
  )
}
