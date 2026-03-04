import { Category, Course, Fach } from '@/generated/client'
import { db } from '@/lib/db'
import { getProgress } from './get-progress'

type CourseWithProgressWithCategory = Course & {
  categories: Category[] | null
  faecher: Fach[] | null
  chapters: { id: string }[]
  progress: number | null
}

type GetCoursesParams = {
  userId: string
  level?: string
  title?: string
  categoryId?: string
  fachId?: string
}

export const getCourses = async ({
  userId,
  level,
  title,
  categoryId,
  fachId,
}: GetCoursesParams): Promise<CourseWithProgressWithCategory[]> => {
  try {
    const courses = await db.course.findMany({
      where: {
        isPublished: true,
        ...(level && { level: parseInt(level) }),
        ...(title && { title: { contains: title } }),
        // Chained filtering for both categories and faecher
        ...(categoryId && { categories: { some: { id: categoryId } } }),
        ...(fachId && { faecher: { some: { id: fachId } } }),
      },
      include: {
        categories: true,
        faecher: true, // Include faecher relation
        chapters: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
          },
        },
        purchases: {
          where: {
            userId,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })





    const coursesWithProgress: CourseWithProgressWithCategory[] =
      await Promise.all(
        courses.map(async (course) => {
          if (course.purchases.length === 0) {
            return {
              ...course,
              progress: null,
            }
          }

          const progressPercentage = await getProgress(userId, course.id)


          return {
            ...course,
            progress: progressPercentage,
          }
        })
      )

    return coursesWithProgress
  } catch (error) {
    console.log('[GET_COURSES]', error)
    return []
  }
}
