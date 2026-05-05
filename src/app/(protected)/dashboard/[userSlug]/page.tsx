import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/get-session-user'
import { getDashboardCourses } from '../_actions/get-dashboard-courses'
import { getUserBadges } from '@/app/(protected)/dashboard/_actions/get-userBadges'
import { getUserFachExperience } from '../_actions/get-fachxp'
import { getAllFaecher } from '@/actions/get-faecher'
import { CoursesList } from '../_components/courses-list'
import { UserScoreBanner } from '../_components/banner-score'

export default async function Dashboard() {
  const user = await getSessionUser()

  if (!user) {
    return redirect('/')
  }

  // Fetch all data in parallel
  const [
    { completedCourses, coursesInProgress },
    userBadges,
    allFaecher,
    userFachExperience,
  ] = await Promise.all([
    getDashboardCourses(user.id),
    getUserBadges(),
    getAllFaecher(),
    getUserFachExperience(),
  ])

  const totalXP = userFachExperience.reduce(
    (total, curr) => total + curr.experience,
    0,
  )

  return (
    <div className="p-6 space-y-4">
      <UserScoreBanner
        usr={user}
        userBadges={userBadges}
        allFaecher={allFaecher}
        userFachExperience={userFachExperience}
        totalXP={totalXP}
      />
      <div id="finishedquests" className="max-w-6xl mx-auto">
        <h2 className="text-center text-4xl mt-20 mb-10">
          Abgeschlossene Quests
        </h2>
        <CoursesList items={completedCourses} />
      </div>
    </div>
  )
}
