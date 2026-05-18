'use server'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'

export type DashboardLernpfad = {
  id: string
  slug: string
  title: string
  description: string | null
  difficulty: 'ANFAENGER' | 'FORTGESCHRITTEN' | 'PRO'
  totalSteps: number
  completedSteps: number
  isEnrolled: boolean
  isCompleted: boolean
  badgeName: string | null
  badgeImageUrl: string | null
  estimatedTime: string
}

export async function getUserLearningPaths(): Promise<DashboardLernpfad[]> {
  const user = await getSessionUser()
  if (!user) return []

  const paths = await db.learningPath.findMany({
    where: { isPublished: true },
    orderBy: { updatedAt: 'desc' },
    include: {
      badge: { select: { name: true, imageUrl: true } },
      steps: {
        include: {
          stepCompletions: { where: { userId: user.id }, select: { id: true } },
          course: {
            select: {
              chapters: { where: { isPublished: true }, select: { id: true } },
            },
          },
        },
      },
      enrollments: { where: { userId: user.id }, select: { id: true } },
      completions: { where: { userId: user.id }, select: { id: true } },
    },
  })

  return paths.map((p) => {
    const totalSteps = p.steps.length
    const completedSteps = p.steps.filter((s) => s.stepCompletions.length > 0).length
    const isEnrolled = p.enrollments.length > 0
    const isCompleted = p.completions.length > 0

    let minutes = 0
    for (const s of p.steps) {
      minutes += Math.max(15, s.course.chapters.length * 20)
    }
    const estimatedTime =
      minutes < 60 ? `${Math.max(1, minutes)} Min` : `${Math.round(minutes / 60)} Std`

    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      difficulty: p.difficulty,
      totalSteps,
      completedSteps,
      isEnrolled,
      isCompleted,
      badgeName: p.badge?.name ?? null,
      badgeImageUrl: p.badge?.imageUrl ?? null,
      estimatedTime,
    }
  })
}
