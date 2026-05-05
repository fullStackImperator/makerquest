'use server'

import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { getCourseIfTeachableBySession } from '@/lib/can-access-course-for-teaching'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

interface Category {
  id: string
  name: string
}

export async function updateCourseCategories(
  courseId: string,
  categories: Category[],
) {
  try {
    // Get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return { error: 'Unauthorized' }
    }

    const teachable = await getCourseIfTeachableBySession(courseId, session.user.id)
    if (!teachable) {
      return { error: 'Course not found' }
    }

    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        categories: true,
      },
    })

    if (!course) {
      return { error: 'Course not found' }
    }

    // Extract the IDs of the selected categories
    const selectedCategoryIds = categories.map((category) => category.id)

    // Disconnect the categories that are no longer selected
    const categoriesToDisconnect = course.categories.filter(
      (category) => !selectedCategoryIds.includes(category.id),
    )

    // Connect the newly selected categories
    const categoriesToConnect = categories.filter((category) =>
      selectedCategoryIds.includes(category.id),
    )

    // Update the course with both disconnect and connect operations
    await db.course.update({
      where: { id: courseId },
      data: {
        categories: {
          disconnect: categoriesToDisconnect.map((category) => ({
            id: category.id,
          })),
          connect: categoriesToConnect.map((category) => ({
            id: category.id,
          })),
        },
      },
    })

    // Revalidate the course page to reflect changes
    revalidatePath(`/dashboard/[userSlug]/courses/${courseId}`)

    return { success: true, message: 'Categories updated successfully' }
  } catch (error) {
    console.error('[Update Course Categories]', error)
    return { error: 'Internal Error' }
  }
}
