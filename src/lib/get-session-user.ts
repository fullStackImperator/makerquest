import { headers } from "next/headers"
import { auth } from "./auth"
import { db } from "./db"

// lib/get-session-user.ts
export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null
  return db.user.findUnique({ where: { id: session.user.id } })
}
