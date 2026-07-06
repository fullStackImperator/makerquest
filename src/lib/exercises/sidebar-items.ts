import type { AttemptStatus } from '@/generated/client'
import type { CourseItem } from './types'

export type SidebarCourseItem = CourseItem & {
  attemptStatus?: AttemptStatus | null
}

export function attemptStatusLabel(
  status: AttemptStatus | null | undefined,
): string | null {
  if (!status || status === 'IN_PROGRESS') return null
  switch (status) {
    case 'GRADED':
      return 'Bewertet'
    case 'NEEDS_REVIEW':
      return 'Wird geprüft'
    case 'SUBMITTED':
      return 'Eingereicht'
    default:
      return null
  }
}
