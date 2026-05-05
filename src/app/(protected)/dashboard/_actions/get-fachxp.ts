'use server'

import { cache } from 'react'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'

export const getUserFachExperience = cache(async () => {
  const user = await getSessionUser()

  if (!user) return []

  return db.userFachExperience.findMany({
    where: { userId: user.id },
    include: { fach: true },
  })
})
