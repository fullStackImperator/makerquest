import type { User } from '@/generated/client'
import { isNameBlocked } from '@/lib/name-policy'

export const KLASSENSTUFEN = [5, 6, 7, 8, 9, 10, 11, 12, 13] as const

/** From this Klassenstufe on (Oberstufe), the letter is optional. */
export const KLASSE_LETTER_OPTIONAL_FROM = 11

type ProfileFields = Pick<User, 'name' | 'klasse' | 'isTeacher' | 'isAdmin' | 'teacherRequestedAt'>

/**
 * Everyone needs a name; students additionally need a Klasse. Teachers,
 * admins and users waiting for teacher approval don't.
 */
export function needsProfileCompletion(user: ProfileFields) {
  if (!user.name?.trim() || isNameBlocked(user.name)) return true
  const exemptFromKlasse = user.isTeacher || user.isAdmin || !!user.teacherRequestedAt
  return !exemptFromKlasse && !user.klasse?.trim()
}

/** "8b" from Klassenstufe 8 and letter "B"; letter may be empty in the Oberstufe. */
export function formatKlasse(stufe: number, letter: string) {
  return `${stufe}${letter.trim().toLowerCase()}`
}

/** Splits a stored Klasse like "8b" back into its parts for the form. */
export function parseKlasse(klasse: string | null | undefined) {
  const match = klasse?.match(/^(\d{1,2})([a-z]?)$/)
  if (!match) return { stufe: null, letter: '' }
  const stufe = Number(match[1])
  return {
    stufe: (KLASSENSTUFEN as readonly number[]).includes(stufe) ? stufe : null,
    letter: match[2],
  }
}
