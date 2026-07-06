import type { Chapter, Exercise } from '@/generated/client'
import type { CourseItem } from './types'

/** Pure helper — safe to import from Client Components. */
export function mergeCourseItems(
  chapters: Chapter[],
  exercises: Exercise[],
): CourseItem[] {
  const items: CourseItem[] = [
    ...chapters.map((c) => ({
      kind: 'chapter' as const,
      id: c.id,
      title: c.title,
      position: c.position,
      isPublished: c.isPublished,
      isFree: c.isFree,
    })),
    ...exercises.map((e) => ({
      kind: 'exercise' as const,
      id: e.id,
      title: e.title,
      position: e.position,
      isPublished: e.isPublished,
      isFree: e.isFree,
    })),
  ]

  return items.sort((a, b) => a.position - b.position)
}
