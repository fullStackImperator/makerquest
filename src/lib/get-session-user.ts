import { cache } from "react"
import { headers } from "next/headers"
import { auth } from "./auth"
import { db } from "./db"
import { isApproved } from "./approval"

// lib/get-session-user.ts
/**
 * Logged-in user, including accounts still waiting for approval. Only for
 * onboarding (/willkommen, /freischaltung); everything else uses getSessionUser.
 */
export const getSessionUserIncludingUnapproved = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null
  return db.user.findUnique({ where: { id: session.user.id } })
})

/** Logged-in, approved user; cached per request (layouts, sidebar and page share one lookup). */
export const getSessionUser = cache(async () => {
  const user = await getSessionUserIncludingUnapproved()
  return user && isApproved(user) ? user : null
})
