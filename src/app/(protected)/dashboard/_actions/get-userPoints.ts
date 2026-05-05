'use server'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'

export const getUserPoints = async (): Promise<number> => {
  try {
    const user = await getSessionUser()
    if (!user) return 0

    const gradings = await db.grading.findMany({
      where: { userId: user.id },
      select: { points: true },
    })

    return gradings.reduce((total, g) => total + g.points, 0)
  } catch (error) {
    console.error('[GET_USER_POINTS]', error)
    return 0
  }
}
