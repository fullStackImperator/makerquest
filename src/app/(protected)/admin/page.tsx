import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { ProfileChangesCard } from './_components/profile-changes-card'
import { redirect } from 'next/navigation'
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
  NotebookPen,
  BarChart3,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

async function getAdminStats(viewer: { id: string; isAdmin: boolean | null }) {
  // Teachers only count entries of quests they own or that are shared with them.
  const journalScope = viewer.isAdmin
    ? {}
    : { course: { OR: [{ userId: viewer.id }, { sharedWith: { some: { id: viewer.id } } }] } }

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
    pendingExerciseReviews,
    pendingJournalEntries,
    pendingTeacherRequests,
    blockedNameAttempts,
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
    db.exerciseResponse.count({
      where: {
        needsReview: true,
        question: { archivedAt: null },
        attempt: { exercise: journalScope },
      },
    }),
    db.journalEntry.count({ where: { status: 'READY', ...journalScope } }),
    db.user.count({
      where: { teacherRequestedAt: { not: null }, NOT: { isTeacher: true } },
    }),
    db.profileChange.count({
      where: { blocked: true, createdAt: { gte: sevenDaysAgo } },
    }),
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
    pendingExerciseReviews,
    pendingJournalEntries,
    pendingTeacherRequests,
    blockedNameAttempts,
  }
}

/** "3 Einträge · 5 Antworten warten" for the "Journale & Aufgaben" tile. */
function journalHighlight(entries: number, answers: number) {
  const parts = [
    entries > 0 && `${entries} ${entries === 1 ? 'Eintrag' : 'Einträge'}`,
    answers > 0 && `${answers} ${answers === 1 ? 'Antwort' : 'Antworten'}`,
  ].filter(Boolean)
  if (parts.length === 0) return 'Nichts offen'
  return `${parts.join(' · ')} ${entries + answers === 1 ? 'wartet' : 'warten'}`
}

type Accent = 'cyan' | 'fuchsia' | 'lime' | 'yellow' | 'orange'

// Neon palette: solid icon block, tinted surface, and a glow on hover.
const ACCENT: Record<Accent, { icon: string; surface: string; glow: string }> = {
  cyan: {
    icon: 'bg-cyan-400 text-cyan-950',
    surface: 'border-cyan-400/50 from-cyan-400/15',
    glow: 'hover:border-cyan-400 hover:shadow-[0_0_28px_rgba(34,211,238,0.45)]',
  },
  fuchsia: {
    icon: 'bg-fuchsia-400 text-fuchsia-950',
    surface: 'border-fuchsia-400/50 from-fuchsia-400/15',
    glow: 'hover:border-fuchsia-400 hover:shadow-[0_0_28px_rgba(232,121,249,0.45)]',
  },
  lime: {
    icon: 'bg-lime-400 text-lime-950',
    surface: 'border-lime-400/60 from-lime-400/20',
    glow: 'hover:border-lime-400 hover:shadow-[0_0_28px_rgba(163,230,53,0.5)]',
  },
  yellow: {
    icon: 'bg-yellow-300 text-yellow-950',
    surface: 'border-yellow-300/60 from-yellow-300/20',
    glow: 'hover:border-yellow-300 hover:shadow-[0_0_28px_rgba(253,224,71,0.5)]',
  },
  orange: {
    icon: 'bg-orange-400 text-orange-950',
    surface: 'border-orange-400/50 from-orange-400/15',
    glow: 'hover:border-orange-400 hover:shadow-[0_0_28px_rgba(251,146,60,0.45)]',
  },
}

/** A large navigation tile; the whole tile links to `href`, the create button sits above that link. */
function NavTile({
  title,
  description,
  href,
  icon: Icon,
  accent,
  meta,
  highlight,
  createHref,
}: {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  accent: Accent
  meta?: string
  /** Emphasized status line, e.g. items waiting for the teacher. */
  highlight?: string
  createHref?: string
}) {
  const a = ACCENT[accent]
  return (
    <div
      className={`group bg-card relative flex flex-col rounded-2xl border bg-linear-to-br to-transparent to-60% shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${a.surface} ${a.glow}`}
    >
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className={`flex size-12 items-center justify-center rounded-xl shadow-sm ${a.icon}`}>
          <Icon className="size-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold tracking-tight">
            <Link href={href} className="after:absolute after:inset-0 after:rounded-2xl">
              {title}
            </Link>
          </h3>
          <p className="text-muted-foreground text-sm leading-snug">{description}</p>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="space-y-0.5">
            {highlight ? <p className="text-sm font-semibold tabular-nums">{highlight}</p> : null}
            {meta ? <p className="text-muted-foreground text-xs tabular-nums">{meta}</p> : null}
          </div>
          {createHref ? (
            <Button asChild variant="outline" size="sm" className="relative z-10 h-7 gap-1 px-2">
              <Link href={createHref}>
                <Plus className="size-3.5" />
                Neu
              </Link>
            </Button>
          ) : (
            <ArrowRight className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          )}
        </div>
      </div>
    </div>
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
    <div className="bg-card rounded-xl border px-4 py-3">
      <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
        <span>{label}</span>
        {Icon ? <Icon className="size-3.5" /> : null}
      </div>
      <p className="mt-1 text-xl font-semibold tabular-nums">
        {typeof value === 'number' ? value.toLocaleString('de-DE') : value}
      </p>
      {hint ? <p className="text-muted-foreground text-[11px]">{hint}</p> : null}
    </div>
  )
}

function StatGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">{children}</div>
    </div>
  )
}

function AttentionChip({
  href,
  count,
  label,
  icon: Icon,
}: {
  href: string
  count: number
  label: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-sm transition-colors hover:bg-sky-500/20"
    >
      <Icon className="size-4 text-sky-700 dark:text-sky-300" />
      <span className="font-semibold tabular-nums">{count}</span>
      {label}
      <ArrowRight className="size-3.5 opacity-60" />
    </Link>
  )
}

export default async function AdminDashboardPage() {
  const viewer = await getSessionUser()
  if (!viewer) redirect('/')
  const stats = await getAdminStats(viewer)

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Verwalte Quests, Lernpfade, Journale & Aufgaben, Badges und Nutzer.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {stats.blockedNameAttempts > 0 && (
            <Link
              href="#profilaenderungen"
              className="inline-flex items-center gap-2 rounded-full border border-destructive/50 bg-destructive/10 px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/20"
            >
              <ShieldAlert className="size-4" />
              <span className="font-semibold tabular-nums">{stats.blockedNameAttempts}</span>
              gesperrte Namensversuche (7 Tage)
            </Link>
          )}
          {stats.pendingTeacherRequests > 0 && (
            <AttentionChip
              href="/admin/users"
              count={stats.pendingTeacherRequests}
              label={stats.pendingTeacherRequests === 1 ? 'Lehrkraft-Anfrage prüfen' : 'Lehrkraft-Anfragen prüfen'}
              icon={UserPlus}
            />
          )}
          {stats.pendingJournalEntries > 0 && (
            <AttentionChip
              href="/admin/journal"
              count={stats.pendingJournalEntries}
              label="Journal-Einträge warten"
              icon={NotebookPen}
            />
          )}
          {stats.pendingExerciseReviews > 0 && (
            <AttentionChip
              href="/admin/journal"
              count={stats.pendingExerciseReviews}
              label={stats.pendingExerciseReviews === 1 ? 'Antwort zu prüfen' : 'Antworten zu prüfen'}
              icon={ClipboardCheck}
            />
          )}
        </div>
      </div>

      <nav aria-label="Verwaltung" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <NavTile
          title="Quests"
          description="Quests erstellen, bearbeiten und veröffentlichen"
          href="/admin/quests"
          createHref="/admin/quests/create"
          icon={BookOpen}
          accent="cyan"
          meta={`${stats.publishedCourses} veröffentlicht · ${stats.totalCourses} gesamt`}
        />
        <NavTile
          title="Lernpfade"
          description="Quests zu Lernpfaden verbinden"
          href="/admin/lernpfade"
          createHref="/admin/lernpfade/new"
          icon={MapIcon}
          accent="fuchsia"
          meta={`${stats.publishedLearningPaths} veröffentlicht · ${stats.totalLearningPaths} gesamt`}
        />
        <NavTile
          title="Journale & Aufgaben"
          description="Einträge und Aufgaben ansehen, Feedback geben, abschließend bewerten"
          href="/admin/journal"
          icon={NotebookPen}
          accent="lime"
          highlight={
            journalHighlight(stats.pendingJournalEntries, stats.pendingExerciseReviews)
          }
        />
        <NavTile
          title="Badges"
          description="Badges anlegen und vergeben"
          href="/admin/create-badges"
          icon={Award}
          accent="yellow"
          meta={`${stats.totalBadges} Badges · ${stats.awardedBadges} vergeben`}
        />
        <NavTile
          title="Nutzer"
          description="Rollen und Konten verwalten"
          href="/admin/users"
          icon={Users}
          accent="orange"
          highlight={
            stats.pendingTeacherRequests > 0
              ? `${stats.pendingTeacherRequests} ${stats.pendingTeacherRequests === 1 ? 'Lehrkraft-Anfrage' : 'Lehrkraft-Anfragen'} offen`
              : undefined
          }
          meta={`${stats.totalUsers} Nutzer · ${stats.totalTeachers} Lehrer`}
        />
      </nav>

      <div id="profilaenderungen" className="scroll-mt-4">
        <ProfileChangesCard />
      </div>

      <details className="group bg-card/60 rounded-2xl border">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2 font-medium">
            <BarChart3 className="text-muted-foreground size-4" />
            Statistiken
          </span>
          <span className="text-muted-foreground flex items-center gap-1 text-sm">
            <span className="group-open:hidden">anzeigen</span>
            <span className="hidden group-open:inline">ausblenden</span>
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
          </span>
        </summary>
        <div className="space-y-6 border-t px-5 pt-4 pb-5">
          <StatGroup title="Aktivität">
            <StatCard label="Offene Journal-Einträge" value={stats.pendingJournalEntries} icon={NotebookPen} />
            <StatCard
              label="Aufgaben-Reviews"
              value={stats.pendingExerciseReviews}
              hint="KI/Kurzantwort prüfen"
              icon={ClipboardCheck}
            />
            <StatCard label="Quest-Einschreibungen" value={stats.courseEnrollments} icon={GraduationCap} />
            <StatCard label="Lernpfad-Einschreibungen" value={stats.learningPathEnrollments} icon={MapIcon} />
            <StatCard label="Abgeschlossene Kapitel" value={stats.completedChapters} icon={CheckCircle2} />
            <StatCard label="Abgeschlossene Lernpfade" value={stats.learningPathCompletions} icon={Trophy} />
          </StatGroup>
          <StatGroup title="Inhalte">
            <StatCard label="Quests" value={stats.totalCourses} hint={`${stats.publishedCourses} veröffentlicht`} icon={BookOpen} />
            <StatCard label="Kapitel" value={stats.totalChapters} hint={`${stats.publishedChapters} veröffentlicht`} icon={Layers} />
            <StatCard label="Lernpfade" value={stats.totalLearningPaths} hint={`${stats.publishedLearningPaths} veröffentlicht`} icon={MapIcon} />
            <StatCard label="Badges" value={stats.totalBadges} hint={`${stats.awardedBadges} vergeben`} icon={Award} />
          </StatGroup>
          <StatGroup title="Community">
            <StatCard label="Nutzer gesamt" value={stats.totalUsers} icon={Users} />
            <StatCard label="Lehrer" value={stats.totalTeachers} icon={GraduationCap} />
            <StatCard label="Neu in 7 Tagen" value={stats.newUsers7d} hint="Neuregistrierungen" icon={UserPlus} />
            <StatCard label="Vergebene Badges" value={stats.awardedBadges} icon={Sparkles} />
          </StatGroup>
        </div>
      </details>
    </div>
  )
}
