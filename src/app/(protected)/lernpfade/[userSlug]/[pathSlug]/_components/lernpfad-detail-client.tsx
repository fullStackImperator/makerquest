'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  Lock,
  Route,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { enrollInLearningPath } from '@/actions/enroll-learning-path'
import type { LernpfadDifficulty } from '@/generated/enums'

type StepRow = {
  id: string
  position: number
  courseId: string
  title: string
  description: string | null
  bonusXp: number
  chapterCount: number
  status: 'done' | 'current' | 'locked'
}

type BadgeReward = { name: string; imageUrl: string }

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

export function LernpfadDetailClient({
  pathId,
  pathTitle,
  pathDescription,
  difficulty,
  userSlug,
  enrolled,
  pathCompleted,
  badge,
  estimatedTime,
  xpReward,
  completedQuests,
  totalQuests,
  steps,
}: {
  pathId: string
  pathTitle: string
  pathDescription: string | null
  difficulty: LernpfadDifficulty
  userSlug: string
  enrolled: boolean
  pathCompleted: boolean
  badge: BadgeReward | null
  estimatedTime: string
  xpReward: number
  completedQuests: number
  totalQuests: number
  steps: StepRow[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const progress =
    totalQuests === 0 ? 0 : Math.round((completedQuests / totalQuests) * 100)
  const diff = diffConfig[difficulty]

  const start = async () => {
    setLoading(true)
    try {
      const r = await enrollInLearningPath(pathId)
      if (!r.success) {
        toast.error(r.error)
        return
      }
      toast.success('Lernpfad gestartet')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 p-4 md:p-6">
      <Link
        href={`/lernpfade/${userSlug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Alle Lernpfade
      </Link>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <header className="space-y-4">
        <div className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <Route className="h-5 w-5" />
          <span>Lernpfad</span>
        </div>

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

          {pathCompleted ? (
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
            >
              <CheckCircle2 />
              Abgeschlossen
            </Badge>
          ) : enrolled ? (
            <Badge
              variant="outline"
              className="border-orange-500/30 bg-orange-500/10 text-[10px] text-orange-600 dark:text-orange-400"
            >
              <Flame />
              Aktiv
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-blue-500/30 bg-blue-500/10 text-[10px] text-blue-600 dark:text-blue-400"
            >
              <Zap />
              Verfügbar
            </Badge>
          )}
        </div>

        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {pathTitle}
        </h1>

        {pathDescription && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {pathDescription}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Route className="h-3.5 w-3.5" />
            {totalQuests} {totalQuests === 1 ? 'Quest' : 'Quests'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {estimatedTime}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
            <Zap className="h-3.5 w-3.5" />~{xpReward} XP
          </span>
          {badge && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-300">
              <Star className="h-3 w-3 fill-current" />
              {badge.name}
            </span>
          )}
        </div>

        {!enrolled && !pathCompleted && (
          <Button onClick={start} disabled={loading} size="lg" className="gap-2">
            <Route className="h-4 w-4" />
            {loading ? 'Wird gestartet…' : 'Lernpfad starten'}
          </Button>
        )}
      </header>

      {/* ── Status banner (path completed) ──────────────────────── */}
      {pathCompleted && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          <Trophy className="h-5 w-5 shrink-0" />
          <p>
            Du hast diesen Lernpfad abgeschlossen
            {badge ? ` und das Badge „${badge.name}“ verdient` : ''}.
          </p>
        </div>
      )}

      {/* ── Progress ─────────────────────────────────────────────── */}
      <Card className="gap-3 py-5">
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Fortschritt</span>
            <span className={cn(pathCompleted && 'text-emerald-500')}>
              {completedQuests} / {totalQuests} Quests
            </span>
          </div>
          <Progress
            value={progress}
            className={cn(
              'h-2',
              pathCompleted &&
                '[&>[data-slot=progress-indicator]]:bg-emerald-500',
            )}
          />
        </CardContent>
      </Card>

      {/* ── Reward preview ──────────────────────────────────────── */}
      {badge && (
        <Card className="border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent py-5">
          <CardContent className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-amber-400/40 bg-background">
              <Image
                src={badge.imageUrl}
                alt={badge.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div className="flex-1 space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <Sparkles className="mr-1 inline h-3 w-3" />
                Belohnung
              </p>
              <p className="font-semibold">{badge.name}</p>
              <p className="text-xs text-muted-foreground">
                Schließe alle Quests dieses Lernpfads ab, um dieses Badge zu
                verdienen.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Steps ───────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Quests im Lernpfad</h2>
        <ol className="space-y-3">
          {steps.map((s) => (
            <StepItem key={s.id} step={s} enrolled={enrolled} />
          ))}
        </ol>
      </section>
    </div>
  )
}

function StepItem({
  step,
  enrolled,
}: {
  step: StepRow
  enrolled: boolean
}) {
  const isDone = step.status === 'done'
  const isCurrent = step.status === 'current'
  const isLocked = step.status === 'locked'

  return (
    <li>
      <Card
        className={cn(
          'gap-0 py-4 transition-all',
          isCurrent &&
            'border-orange-500/40 bg-orange-500/5 ring-1 ring-orange-500/20',
          isDone && 'border-emerald-500/30 bg-emerald-500/5',
          isLocked && 'opacity-60',
        )}
      >
        <CardContent className="flex items-center gap-4">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold tabular-nums',
              isDone &&
                'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
              isCurrent &&
                'border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-300',
              isLocked && 'border-muted-foreground/20 text-muted-foreground',
            )}
          >
            {isDone ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : isLocked ? (
              <Lock className="h-4 w-4" />
            ) : (
              step.position + 1
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p
                className={cn(
                  'truncate font-medium',
                  isLocked && 'text-muted-foreground',
                )}
              >
                {step.title}
              </p>
              {isDone && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Abgeschlossen
                </span>
              )}
              {isCurrent && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  <Flame className="h-3 w-3" />
                  Aktuell
                </span>
              )}
              {isLocked && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Gesperrt
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Route className="h-3 w-3" />
                {step.chapterCount}{' '}
                {step.chapterCount === 1 ? 'Kapitel' : 'Kapitel'}
              </span>
              {step.bonusXp > 0 && (
                <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                  <Zap className="h-3 w-3" />+{step.bonusXp} Bonus-XP
                </span>
              )}
            </div>
          </div>

          {isCurrent && enrolled && (
            <Button size="sm" asChild className="gap-1">
              <Link href={`/quests/${step.courseId}`}>
                Zum Quest
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
          {isDone && (
            <Button size="sm" variant="outline" asChild className="gap-1">
              <Link href={`/quests/${step.courseId}`}>
                Ansehen
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </li>
  )
}
