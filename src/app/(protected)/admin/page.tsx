import { db } from '@/lib/db'
import Link from 'next/link'
import {
  Award,
  BookOpen,
  Users,
  Plus,
  ArrowRight,
  Map as MapIcon,
  ClipboardCheck,
  GraduationCap,
  UserPlus,
  Sparkles,
  Layers,
  Trophy,
  CheckCircle2,
} from 'lucide-react'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

async function getAdminStats() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [
    totalUsers,
    totalTeachers,
    newUsers7d,
    totalCourses,
    publishedCourses,
    totalChapters,
    publishedChapters,
    totalLearningPaths,
    publishedLearningPaths,
    totalBadges,
    awardedBadges,
    courseEnrollments,
    learningPathEnrollments,
    completedChapters,
    learningPathCompletions,
    pendingGradings,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { isTeacher: true } }),
    db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.course.count(),
    db.course.count({ where: { isPublished: true } }),
    db.chapter.count(),
    db.chapter.count({ where: { isPublished: true } }),
    db.learningPath.count(),
    db.learningPath.count({ where: { isPublished: true } }),
    db.badge.count(),
    db.userBadge.count(),
    db.purchase.count(),
    db.learningPathEnrollment.count(),
    db.userProgress.count({ where: { isCompleted: true } }),
    db.learningPathCompletion.count(),
    db.grading.count({ where: { points_awarded: false } }),
  ])

  return {
    totalUsers,
    totalTeachers,
    newUsers7d,
    totalCourses,
    publishedCourses,
    totalChapters,
    publishedChapters,
    totalLearningPaths,
    publishedLearningPaths,
    totalBadges,
    awardedBadges,
    courseEnrollments,
    learningPathEnrollments,
    completedChapters,
    learningPathCompletions,
    pendingGradings,
  }
}

function ManagementCard({
  title,
  description,
  href,
  icon: Icon,
  meta,
  createHref,
  createLabel = 'Neu',
}: {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  meta?: string
  createHref?: string
  createLabel?: string
}) {
  return (
    <Card className="h-full transition-colors hover:bg-muted/40">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-sm">
              {description}
            </CardDescription>
            {meta ? (
              <p className="pt-1 text-xs text-muted-foreground tabular-nums">
                {meta}
              </p>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardFooter className="mt-auto justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="px-2">
          <Link href={href}>
            Verwalten
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
        {createHref ? (
          <Button asChild variant="outline" size="sm">
            <Link href={createHref}>
              <Plus className="h-4 w-4" />
              {createLabel}
            </Link>
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  )
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: number | string
  hint?: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardHeader className="gap-1 pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardDescription>{label}</CardDescription>
          {Icon ? (
            <Icon className="h-4 w-4 text-muted-foreground" />
          ) : null}
        </div>
        <CardTitle className="text-2xl tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </CardTitle>
        {hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardHeader>
    </Card>
  )
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats()

  return (
    <div className="flex flex-1 flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Verwalte Quests, Lernpfade, Badges und Nutzer.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-medium">Verwaltung</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ManagementCard
            title="Quests"
            description="Alle Quests bearbeiten und veröffentlichen"
            href="/admin/quests"
            createHref="/admin/create"
            icon={BookOpen}
            meta={`${stats.publishedCourses} veröffentlicht · ${stats.totalCourses} gesamt`}
          />
          <ManagementCard
            title="Lernpfade"
            description="Lernpfade erstellen und verwalten"
            href="/admin/lernpfade"
            createHref="/admin/lernpfade/new"
            icon={MapIcon}
            meta={`${stats.publishedLearningPaths} veröffentlicht · ${stats.totalLearningPaths} gesamt`}
          />
          <ManagementCard
            title="Badges"
            description="Badges anlegen und vergeben"
            href="/admin/create-badges"
            icon={Award}
            meta={`${stats.totalBadges} Badges · ${stats.awardedBadges} vergeben`}
          />
          <ManagementCard
            title="Nutzer"
            description="Rollen und Konten verwalten"
            href="/admin/users"
            icon={Users}
            meta={`${stats.totalUsers} Nutzer · ${stats.totalTeachers} Lehrer`}
          />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Aktivität</h2>
          {stats.pendingGradings > 0 ? (
            <span className="text-xs text-muted-foreground">
              {stats.pendingGradings} offene Bewertungen
            </span>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            label="Offene Bewertungen"
            value={stats.pendingGradings}
            hint="Punkte noch nicht vergeben"
            icon={ClipboardCheck}
          />
          <StatCard
            label="Quest-Einschreibungen"
            value={stats.courseEnrollments}
            icon={GraduationCap}
          />
          <StatCard
            label="Lernpfad-Einschreibungen"
            value={stats.learningPathEnrollments}
            icon={MapIcon}
          />
          <StatCard
            label="Abgeschlossene Kapitel"
            value={stats.completedChapters}
            icon={CheckCircle2}
          />
          <StatCard
            label="Abgeschlossene Lernpfade"
            value={stats.learningPathCompletions}
            icon={Trophy}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Inhalte</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Quests"
            value={stats.totalCourses}
            hint={`${stats.publishedCourses} veröffentlicht`}
            icon={BookOpen}
          />
          <StatCard
            label="Kapitel"
            value={stats.totalChapters}
            hint={`${stats.publishedChapters} veröffentlicht`}
            icon={Layers}
          />
          <StatCard
            label="Lernpfade"
            value={stats.totalLearningPaths}
            hint={`${stats.publishedLearningPaths} veröffentlicht`}
            icon={MapIcon}
          />
          <StatCard
            label="Badges"
            value={stats.totalBadges}
            hint={`${stats.awardedBadges} vergeben`}
            icon={Award}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Community</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Nutzer gesamt"
            value={stats.totalUsers}
            icon={Users}
          />
          <StatCard
            label="Lehrer"
            value={stats.totalTeachers}
            icon={GraduationCap}
          />
          <StatCard
            label="Neu in 7 Tagen"
            value={stats.newUsers7d}
            hint="Neuregistrierungen"
            icon={UserPlus}
          />
          <StatCard
            label="Vergebene Badges"
            value={stats.awardedBadges}
            icon={Sparkles}
          />
        </div>
      </section>
    </div>
  )
}
