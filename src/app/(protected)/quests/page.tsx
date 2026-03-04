// pages/all-courses.tsx
// 'use client'
import { getCourses } from '@/actions/get-courses'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import SearchCoursesPage from './_components/search-quests'

type CourseLevelPageProps = {
  searchParams: {
    title: string
    categoryId?: string
    fachId?: string
  }
}

const AllCoursesPage = async ({ searchParams }: CourseLevelPageProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    redirect('/')
  }

  const userId = session.user.id

  const categories = await db.category.findMany({
    orderBy: {
      name: 'asc',
    },
  })

  const faecher = await db.fach.findMany({
    orderBy: {
      name: 'asc',
    },
  })

  const courses = await getCourses({
    userId,
    ...searchParams,
  })

  return (
    <SearchCoursesPage
      categories={categories}
      faecher={faecher}
      initialCourses={courses}
    />
  )
}

export default AllCoursesPage
