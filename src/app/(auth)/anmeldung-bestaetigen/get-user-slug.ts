'use server'

import { db } from '@/lib/db'

export async function getUserSlug(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { slug: true },
  })

  return user?.slug || null
}
