import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/get-session-user'
import { getDashboardCourses } from '../_actions/get-dashboard-courses'
import { getUserBadges } from '../_actions/get-userBadges'
import { getUserFachExperience } from '../_actions/get-fachxp'
import { getAllFaecher } from '@/actions/get-faecher'
import { getUserLearningPaths } from '../_actions/get-user-learning-paths'
import { PlayerProfile, AchievementsShowcase, FachPanel } from '../_components/banner-score'
import { DashboardTabs } from '../_components/dashboard-tabs'
import { Zap, Flame, Trophy, Shield } from 'lucide-react'

const buildStats = (
  totalXP: number,
  activeCount: number,
  completedCount: number,
  playerLevel: number,
) => [
  {
    icon: Zap,
    label: 'Gesamt XP',
    value: totalXP.toLocaleString('de-DE'),
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  {
    icon: Shield,
    label: 'Level',
    value: playerLevel,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  {
    icon: Flame,
    label: 'Aktive Quests',
    value: activeCount,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
  },
  {
    icon: Trophy,
    label: 'Abgeschlossen',
    value: completedCount,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
]

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
  const statItems = buildStats(totalXP, coursesInProgress.length, completedCourses.length, playerLevel)
  const userSlug = user.slug ?? user.id

  return (
    // w-full + overflow-hidden prevent tab-content from ever widening the page
    <div className="w-full max-w-[1400px] mx-auto p-4 md:p-6 space-y-5 overflow-x-hidden">

      {/* ── Stats HUD ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statItems.map(({ icon: Icon, label, value, color, bgColor, borderColor }) => (
          <div
            key={label}
            className={`panel border ${borderColor} rounded-xl p-4 flex items-center gap-3 shadowhard`}
          >
            <div className={`${bgColor} ${color} p-2.5 rounded-lg shrink-0`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{label}</p>
              <p className={`text-2xl font-bold ${color} leading-tight`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Profile + Achievements ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-[240px_1fr] gap-4 items-stretch">
        <PlayerProfile usr={user} totalXP={totalXP} />
        <AchievementsShowcase userBadges={userBadges} />
      </div>

      {/* ── Fächer (left) + Quest/Lernpfad Tabs (right) ──────────── */}
      {/* min-w-0 on each child prevents grid blowout from tab content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="min-w-0">
          <FachPanel allFaecher={allFaecher} userFachExperience={userFachExperience} />
        </div>
        <div className="min-w-0">
          <DashboardTabs
            coursesInProgress={coursesInProgress}
            completedCourses={completedCourses}
            learningPaths={learningPaths}
            userSlug={userSlug}
          />
        </div>
      </div>

    </div>
  )
}
