'use server'

import { db } from '@/lib/db'

export interface UserBadge {
  id: string
  name: string
  imageUrl: string
}

export interface LeaderboardUser {
  userId: string
  userName: string | null | undefined
  userImageUrl: string | null | undefined
  userKlasse: string | null | undefined
  totalXP: number
  fachXP: number
  badges: UserBadge[]
}

export const getLeaderboard = async (
  fachId?: string
): Promise<LeaderboardUser[]> => {
  try {
    const userExperiences = await db.userFachExperience.groupBy({
      by: ['userId'],
      where: fachId ? { fachId } : {},
      _sum: {
        experience: true,
      },
    })

    if (userExperiences.length === 0) {
      return []
    }

    const userIds = userExperiences.map((u) => u.userId)

    const [users, userBadgesList] = await Promise.all([
      db.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          image: true,
          klasse: true,
        },
      }),
      db.userBadge.findMany({
        where: { userId: { in: userIds } },
        select: {
          userId: true,
          badge: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
      }),
    ])

    const userMap = new Map(users.map((u) => [u.id, u]))
    const badgesByUser = new Map<string, UserBadge[]>()
    for (const ub of userBadgesList) {
      const list = badgesByUser.get(ub.userId) ?? []
      list.push({
        id: ub.badge.id,
        name: ub.badge.name,
        imageUrl: ub.badge.imageUrl,
      })
      badgesByUser.set(ub.userId, list)
    }

    const leaderboard: LeaderboardUser[] = userExperiences.map((ux) => {
      const user = userMap.get(ux.userId)
      const totalXP = fachId ? 0 : ux._sum.experience ?? 0
      const fachXP = fachId ? ux._sum.experience ?? 0 : 0
      return {
        userId: ux.userId,
        userName: user?.name,
        userImageUrl: user?.image,
        userKlasse: user?.klasse,
        totalXP,
        fachXP,
        badges: badgesByUser.get(ux.userId) ?? [],
      }
    })

    leaderboard.sort((a, b) =>
      fachId ? b.fachXP - a.fachXP : b.totalXP - a.totalXP
    )

    return leaderboard
  } catch (error) {
    console.error('[GET_LEADERBOARD]', error)
    return []
  }
}
