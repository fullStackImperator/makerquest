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
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              klassenstufe: true,
              chapters: {
                where: { isPublished: true },
                select: { id: true },
              },
            },
          },
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

  // Estimated time + XP reward (same formula as the list page)
  let minutes = 0
  let xpReward = 0
  for (const s of path.steps) {
    const n = s.course.chapters.length
    minutes += Math.max(15, n * 20)
    const k = s.course.klassenstufe ?? 5
    xpReward += 10 * k * 3
  }
  const estimatedTime =
    minutes < 60
      ? `${Math.max(1, minutes)} Min`
      : `${Math.round(minutes / 60)} Std`

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
      description: s.course.description ?? null,
      bonusXp: s.bonusXp,
      chapterCount: s.course.chapters.length,
      status,
    }
  })

  const completedQuests = doneIds.size
  const totalQuests = path.steps.length

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <LernpfadDetailClient
        pathId={path.id}
        pathTitle={path.title}
        pathDescription={path.description}
        difficulty={path.difficulty}
        userSlug={userSlug}
        enrolled={!!enrollment}
        pathCompleted={!!pathCompletion}
        badge={
          path.badge
            ? { name: path.badge.name, imageUrl: path.badge.imageUrl }
            : null
        }
        estimatedTime={estimatedTime}
        xpReward={xpReward}
        completedQuests={completedQuests}
        totalQuests={totalQuests}
        steps={steps}
      />
    </div>
  )
}
