import { getCourseProgression } from '@/lib/exercises/progression'

/**
 * Quest progress in percent: chapters marked as done plus passed Aufgaben,
 * out of all published chapters and Aufgaben.
 */
export const getProgress = async (userId: string, courseId: string): Promise<number> => {
  try {
    return (await getCourseProgression(userId, courseId)).progress
  } catch (error) {
    console.log('[Get Progress]', error)
    return 0
  }
}
