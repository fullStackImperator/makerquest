import { getDifficultyMultiplier } from '@/lib/award-course-xp'

/** Share of the quest XP suggested as the XP reward for one Aufgabe. */
export const EXERCISE_XP_SHARE = 0.15

/** XP per Fach for completing the quest (same formula as "Punkte vergeben"). */
export function questXp(course: { klassenstufe: number | null; schwierigkeit: string | null }) {
  if (!course.klassenstufe || !course.schwierigkeit) return 0
  return 10 * course.klassenstufe * getDifficultyMultiplier(course.schwierigkeit)
}

/** Suggested XP reward for a new Aufgabe (or a chapter's questions). */
export function suggestExerciseXp(course: { klassenstufe: number | null; schwierigkeit: string | null }) {
  return Math.round(questXp(course) * EXERCISE_XP_SHARE)
}
