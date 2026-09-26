import 'server-only'

import { env } from './env'

/** The site owner ranks above admins (set via OWNER_EMAIL). */
export function isOwner(user: { email: string } | null | undefined) {
  return !!user && !!env.OWNER_EMAIL && user.email.toLowerCase() === env.OWNER_EMAIL.toLowerCase()
}
