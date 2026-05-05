'use server'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'

export const getUserBadges = async () => {
  try {
    const user = await getSessionUser()
    if (!user) return []

    const userBadges = await db.userBadge.findMany({
      where: { userId: user.id },
      include: { badge: true },
    })

    return userBadges.map(({ badge }) => ({ badge }))
  } catch (error) {
    console.error('[GET_USER_BADGES]', error)
    return []
  }
}
