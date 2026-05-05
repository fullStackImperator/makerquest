import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { LernpfadeListClient } from './_components/lernpfade-list-client'

interface PageProps {
  params: Promise<{ userSlug: string }>
}

export default async function LernpfadePage({ params }: PageProps) {
  const { userSlug } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) redirect('/')

  const user = await db.user.findUnique({
    where: { slug: userSlug },
    select: { id: true },
  })
  if (!user) redirect('/')

  const pathsRaw = await db.learningPath.findMany({
    where: { isPublished: true },
    orderBy: { updatedAt: 'desc' },
    include: {
      badge: { select: { name: true } },
      steps: {
        orderBy: { position: 'asc' },
        include: {
          course: {
            select: {
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

  const paths = await Promise.all(
    pathsRaw.map(async (p) => {
      const totalQuests = p.steps.length
      const completedQuests = await db.learningPathStepCompletion.count({
        where: {
          userId: user.id,
          learningPathStep: { learningPathId: p.id },
        },
      })

      let minutes = 0
      for (const s of p.steps) {
        const n = s.course.chapters.length
        minutes += Math.max(15, n * 20)
      }
      const estimatedTime =
        minutes < 60
          ? `${Math.max(1, minutes)} Min`
          : `${Math.round(minutes / 60)} Std`

      let xpReward = 0
      for (const s of p.steps) {
        const k = s.course.klassenstufe ?? 5
        xpReward += 10 * k * 3
      }

      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        difficulty: p.difficulty,
        totalQuests,
        completedQuests,
        isLocked: false,
        estimatedTime,
        xpReward,
        badgeName: p.badge?.name ?? null,
      }
    }),
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <LernpfadeListClient userSlug={userSlug} paths={paths} />
    </div>
  )
}
