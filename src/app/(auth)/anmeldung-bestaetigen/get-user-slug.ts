'use server'

import { getSessionUser } from '@/lib/get-session-user'

/** Slug of the logged-in user (used right after the OTP login). */
export async function getUserSlug() {
  const user = await getSessionUser()
  return user?.slug || null
}
