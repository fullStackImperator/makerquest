import { db } from '@/lib/db'
import Link from 'next/link'
import {
  Award,
  BookOpen,
  Users,
  PlusCircle,
  ArrowRight,
} from 'lucide-react'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

async function getAdminStats() {
  const [
    totalUsers,
    totalCourses,
    publishedCourses,
    totalBadges,
    totalEnrollments,
    completedChapters,
  ] = await Promise.all([
    db.user.count(),
    db.course.count(),
    db.course.count({ where: { isPublished: true } }),
    db.badge.count(),
    db.purchase.count(),
    db.userProgress.count({ where: { isCompleted: true } }),
  ])
  return {
    totalUsers,
    totalCourses,
    publishedCourses,
    totalBadges,
    totalEnrollments,
    completedChapters,
  }
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats()

  const quickLinks = [
    {
      title: 'Create Badges',
      description: 'Create and manage badges',
      href: '/admin/create-badges',
      icon: Award,
    },
    {
      title: 'Quests',
      description: 'View and edit all quests',
      href: '/admin/quests',
      icon: BookOpen,
    },
    {
      title: 'Create new quest',
      description: 'Add a new quest',
      href: '/admin/create',
      icon: PlusCircle,
    },
    {
      title: 'Users',
      description: 'Manage users and roles',
      href: '/admin/users',
      icon: Users,
    },
  ]

  const statCards = [
    { label: 'Users', value: stats.totalUsers },
    { label: 'Courses', value: stats.totalCourses },
    { label: 'Published quests', value: stats.publishedCourses },
    { label: 'Badges', value: stats.totalBadges },
    { label: 'Enrollments', value: stats.totalEnrollments },
    { label: 'Completed chapters', value: stats.completedChapters },
  ]

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage badges, quests, and users.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-medium">Quick links</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link key={link.href} href={link.href}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <CardTitle className="text-base">{link.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {link.description}
                      </CardDescription>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Analytics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {stat.value.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
