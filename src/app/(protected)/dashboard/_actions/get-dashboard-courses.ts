'use server'

import { db } from '@/lib/db'
import { Category, Chapter, Course, Fach } from '@/generated/client'
import { getProgress } from '@/actions/get-progress'

type CourseWithProgressWithCategory = Course & {
  categories: Category[]
  chapters: Chapter[]
  faecher: Fach[]
  progress: number | null
}

type DashboardCourses = {
  completedCourses: CourseWithProgressWithCategory[]
  coursesInProgress: CourseWithProgressWithCategory[]
}

export const getDashboardCourses = async (
  userId: string,
): Promise<DashboardCourses> => {
  try {
    const purchasedCourses = await db.purchase.findMany({
      where: { userId },
      select: {
        course: {
          include: {
            faecher: true,
            categories: true,
            chapters: {
              where: { isPublished: true },
            },
          },
        },
      },
    })

    const courses = purchasedCourses.map(
      (p) => p.course,
    ) as CourseWithProgressWithCategory[]

    // Fetch all progress in parallel instead of sequentially
    const progressList = await Promise.all(
      courses.map((course) => getProgress(userId, course.id)),
    )

    courses.forEach((course, i) => {
      course.progress = progressList[i]
    })

    return {
      completedCourses: courses.filter((c) => c.progress === 100),
      coursesInProgress: courses.filter((c) => (c.progress ?? 0) < 100),
    }
  } catch (error) {
    console.error('[GET_DASHBOARD_COURSES]', error)
    return { completedCourses: [], coursesInProgress: [] }
  }
}
