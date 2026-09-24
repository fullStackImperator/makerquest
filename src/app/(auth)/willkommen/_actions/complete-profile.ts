'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import {
  formatKlasse,
  KLASSE_LETTER_OPTIONAL_FROM,
  KLASSENSTUFEN,
} from '@/lib/profile'

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Bitte gib deinen Namen ein')
    .max(80, 'Der Name ist zu lang')
    .regex(/\p{L}/u, 'Bitte gib deinen Namen ein'),
  requestTeacher: z.boolean(),
  stufe: z.number().int().nullable(),
  letter: z.string().trim().max(1),
})

/** Saves the profile and redirects to the dashboard; returns only on validation errors. */
export async function completeProfile(
  input: z.input<typeof schema>,
): Promise<{ success: false; error: string }> {
  const user = await getSessionUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe' }
  }
  const { name, requestTeacher, stufe, letter } = parsed.data

  const isStaff = user.isTeacher === true || user.isAdmin === true
  const data: { name: string; klasse?: string | null; teacherRequestedAt?: Date | null } = { name }

  if (!isStaff) {
    if (requestTeacher) {
      data.teacherRequestedAt = user.teacherRequestedAt ?? new Date()
      data.klasse = null
    } else {
      if (!stufe || !(KLASSENSTUFEN as readonly number[]).includes(stufe)) {
        return { success: false, error: 'Bitte wähle deine Klassenstufe' }
      }
      if (letter && !/^[a-z]$/i.test(letter)) {
        return { success: false, error: 'Der Klassenbuchstabe muss ein Buchstabe sein' }
      }
      if (!letter && stufe < KLASSE_LETTER_OPTIONAL_FROM) {
        return { success: false, error: 'Bitte gib den Buchstaben deiner Klasse an (z. B. b)' }
      }
      data.klasse = formatKlasse(stufe, letter)
      data.teacherRequestedAt = null
    }
  }

  await db.user.update({ where: { id: user.id }, data })
  redirect(user.slug ? `/dashboard/${user.slug}` : '/')
}
