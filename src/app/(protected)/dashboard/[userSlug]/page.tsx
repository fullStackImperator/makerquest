import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/get-session-user'
import { getDashboardCourses } from '../_actions/get-dashboard-courses'
import { getUserBadges } from '../_actions/get-userBadges'
import { getUserFachExperience } from '../_actions/get-fachxp'
import { getAllFaecher } from '@/actions/get-faecher'
import { getUserLearningPaths } from '../_actions/get-user-learning-paths'
import { PlayerProfile, AchievementsShowcase, FachPanel } from '../_components/banner-score'
import { DashboardTabs } from '../_components/dashboard-tabs'
import { ProgressCard } from '../_components/progress-card'
import { FONT, TEXT } from '../_components/glass-styles'
import { getLevelName } from '@/lib/levelNames'

function getGreeting(hour: number) {
  if (hour < 12) return 'Guten Morgen'
  if (hour < 17) return 'Guten Tag'
  return 'Guten Abend'
}

export default async function Dashboard() {
  const user = await getSessionUser()
  if (!user) return redirect('/')

  const [
    { completedCourses, coursesInProgress },
    userBadges,
    allFaecher,
    userFachExperience,
    learningPaths,
  ] = await Promise.all([
    getDashboardCourses(user.id),
    getUserBadges(),
    getAllFaecher(),
    getUserFachExperience(),
    getUserLearningPaths(),
  ])

  const totalXP = userFachExperience.reduce((total, curr) => total + curr.experience, 0)
  const playerLevel = Math.floor(Math.sqrt(totalXP / 120))
  const playerLevelName = getLevelName(playerLevel)
  const currentLevelXP = 120 * playerLevel * playerLevel
  const nextLevelXP = 120 * (playerLevel + 1) * (playerLevel + 1)
  const progressToNextLevel = Math.max(2, Math.min(100, ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100))
  const xpToNextLevel = nextLevelXP - totalXP
  const userSlug = user.slug ?? user.id
  const firstName = (user.name ?? 'Lernender').split(' ')[0]

  const greeting = getGreeting(new Date().getHours())

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">

      {/* ── Greeting ─────────────────────────────────────────────── */}
      <div className="pt-1 pb-2">
        <h1
          className="text-3xl font-extrabold leading-tight"
          style={{ color: TEXT.primary, fontFamily: FONT }}
        >
          {greeting}, {firstName} 👋
        </h1>
      </div>

      {/* ── Progress (left) + Player Profile (right) ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 items-stretch">
        <ProgressCard
          playerLevel={playerLevel}
          playerLevelName={playerLevelName}
          totalXP={totalXP}
          progressToNextLevel={progressToNextLevel}
          xpToNextLevel={xpToNextLevel}
          coursesInProgressCount={coursesInProgress.length}
        />
        <PlayerProfile usr={user} totalXP={totalXP} activeCount={coursesInProgress.length} completedCount={completedCourses.length} />
      </div>

      {/* ── Achievements ─────────────────────────────────────────── */}
      <AchievementsShowcase userBadges={userBadges} />

      {/* ── Fächer ───────────────────────────────────────────────── */}
      <FachPanel allFaecher={allFaecher} userFachExperience={userFachExperience} />

      {/* ── Quests / Lernpfade Tabs ──────────────────────────────── */}
      <DashboardTabs
        coursesInProgress={coursesInProgress}
        completedCourses={completedCourses}
        learningPaths={learningPaths}
        userSlug={userSlug}
      />

    </div>
  )
}
