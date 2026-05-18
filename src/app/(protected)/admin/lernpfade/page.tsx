import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Map as MapIcon,
  Pencil,
  Plus,
  Route,
  Trophy,
  Users as UsersIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import type { LernpfadDifficulty } from '@/generated/enums'
import { DeletePathButton } from './_components/delete-path-button'

const diffConfig: Record<
  LernpfadDifficulty,
  { label: string; emoji: string; badgeClass: string }
> = {
  ANFAENGER: {
    label: 'Anfänger',
    emoji: '🌱',
    badgeClass:
      'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  FORTGESCHRITTEN: {
    label: 'Fortgeschritten',
    emoji: '⚔️',
    badgeClass:
      'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  PRO: {
    label: 'Pro',
    emoji: '👑',
    badgeClass:
      'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  },
}

export default async function AdminLernpfadePage() {
  const user = await getSessionUser()
  if (!user) redirect('/')
  if (!user.isTeacher && !user.isAdmin) redirect('/')

  const isAdmin = user.isAdmin === true
  const where = isAdmin ? {} : { ownerId: user.id }

  const paths = await db.learningPath.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      badge: { select: { name: true, imageUrl: true } },
      _count: {
        select: {
          steps: true,
          enrollments: true,
          completions: true,
        },
      },
    },
  })

  const ownerIds = isAdmin
    ? [...new Set(paths.map((p) => p.ownerId))]
    : []
  const owners =
    ownerIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: ownerIds } },
          select: { id: true, name: true, email: true },
        })
      : []
  const ownerLabelById = new Map(
    owners.map((o) => [o.id, o.name?.trim() || o.email || '—'] as const),
  )

  const totalPaths = paths.length
  const publishedPaths = paths.filter((p) => p.isPublished).length
  const draftPaths = totalPaths - publishedPaths
  const totalEnrollments = paths.reduce(
    (sum, p) => sum + p._count.enrollments,
    0,
  )

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-4 md:p-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zum Admin-Dashboard
      </Link>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="space-y-3">
        <div className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <Route className="h-5 w-5" />
          <span>Admin</span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Lernpfade verwalten
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {isAdmin
                ? 'Alle Lernpfade in der Plattform. Bearbeite oder veröffentliche bestehende Pfade oder lege einen neuen an.'
                : 'Deine Lernpfade. Bearbeite oder veröffentliche bestehende Pfade oder lege einen neuen an.'}
            </p>
          </div>
          <Button asChild size="lg" className="gap-2">
            <Link href="/admin/lernpfade/new">
              <Plus className="h-4 w-4" />
              Neuer Lernpfad
            </Link>
          </Button>
        </div>
      </header>

      {/* ── KPI tiles ──────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Lernpfade gesamt" value={totalPaths} icon={MapIcon} />
        <StatCard
          label="Veröffentlicht"
          value={publishedPaths}
          icon={CheckCircle2}
        />
        <StatCard label="Entwürfe" value={draftPaths} icon={Pencil} />
        <StatCard
          label="Einschreibungen"
          value={totalEnrollments}
          icon={UsersIcon}
        />
      </section>

      {/* ── List ────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {totalPaths > 0 ? 'Alle Lernpfade' : 'Keine Lernpfade'}
        </h2>

        {totalPaths === 0 ? (
          <Card className="border-dashed py-10 text-center shadow-none">
            <CardContent className="space-y-3">
              <MapIcon className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="text-lg font-semibold">Noch keine Lernpfade</p>
              <p className="text-sm text-muted-foreground">
                Lege deinen ersten Lernpfad an, um Quests zu bündeln und
                Belohnungen zu vergeben.
              </p>
              <Button asChild className="gap-2">
                <Link href="/admin/lernpfade/new">
                  <Plus className="h-4 w-4" />
                  Neuer Lernpfad
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {paths.map((p) => {
              const diff = diffConfig[p.difficulty]
              const ownerLabel = isAdmin
                ? ownerLabelById.get(p.ownerId) ?? '—'
                : null

              return (
                <li key={p.id}>
                  <Card className="gap-0 py-4 transition-colors hover:bg-muted/40">
                    <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] uppercase tracking-wider',
                              diff.badgeClass,
                            )}
                          >
                            <span aria-hidden>{diff.emoji}</span>
                            {diff.label}
                          </Badge>

                          {p.isPublished ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
                            >
                              <CheckCircle2 />
                              Veröffentlicht
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-muted-foreground/30 bg-muted/40 text-[10px] text-muted-foreground"
                            >
                              <Pencil />
                              Entwurf
                            </Badge>
                          )}

                          {ownerLabel && (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-muted-foreground"
                            >
                              <GraduationCap />
                              {ownerLabel}
                            </Badge>
                          )}
                        </div>

                        <p className="truncate text-base font-semibold">
                          {p.title}
                        </p>

                        {p.description && (
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {p.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Route className="h-3 w-3" />
                            {p._count.steps}{' '}
                            {p._count.steps === 1 ? 'Schritt' : 'Schritte'}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <UsersIcon className="h-3 w-3" />
                            {p._count.enrollments} eingeschrieben
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            {p._count.completions} abgeschlossen
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        {p.badge ? (
                          <figure className="flex w-28 flex-col items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-500/5 p-2">
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                              <Award className="h-3 w-3" />
                              Badge
                            </span>
                            <div className="relative h-12 w-12 overflow-hidden rounded-md border border-amber-400/40 bg-background">
                              <Image
                                src={p.badge.imageUrl}
                                alt={`Badge: ${p.badge.name}`}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                            <figcaption className="line-clamp-1 max-w-full text-center text-[10px] font-medium text-amber-700 dark:text-amber-300">
                              {p.badge.name}
                            </figcaption>
                          </figure>
                        ) : (
                          <div className="flex w-28 flex-col items-center gap-1 rounded-lg border border-dashed border-muted-foreground/20 p-2 text-center">
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                              <Award className="h-3 w-3" />
                              Badge
                            </span>
                            <p className="text-[10px] leading-tight text-muted-foreground">
                              Kein Badge zugewiesen
                            </p>
                          </div>
                        )}

                        <div className="flex flex-col gap-2">
                          {p.isPublished && user.slug && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="gap-1"
                            >
                              <Link
                                href={`/lernpfade/${user.slug}/${p.slug}`}
                                target="_blank"
                              >
                                Vorschau
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          )}
                          <Button asChild size="sm" className="gap-1">
                            <Link href={`/admin/lernpfade/${p.id}/edit`}>
                              Bearbeiten
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <DeletePathButton
                            pathId={p.id}
                            pathTitle={p.title}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardHeader className="gap-1 pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardDescription>{label}</CardDescription>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardTitle className="text-2xl tabular-nums">
          {value.toLocaleString()}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}
