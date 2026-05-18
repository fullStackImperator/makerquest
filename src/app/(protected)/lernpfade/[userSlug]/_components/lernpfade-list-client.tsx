'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Clock,
  Zap,
  CheckCircle2,
  Lock,
  Route,
  Star,
  ChevronRight,
  Flame,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import type { LernpfadDifficulty } from '@/generated/enums'

// ── Types ────────────────────────────────────────────────────────────────────

export type LernpfadListItem = {
  id: string
  slug: string
  title: string
  description: string | null
  difficulty: LernpfadDifficulty
  totalQuests: number
  completedQuests: number
  isLocked: boolean
  estimatedTime: string
  xpReward: number
  badgeName: string | null
}

type DifficultyFilter = 'Alle' | 'Anfänger' | 'Fortgeschritten' | 'Pro'

// ── Config ───────────────────────────────────────────────────────────────────

const diffConfig: Record<
  LernpfadDifficulty,
  {
    label: DifficultyFilter
    emoji: string
    badgeClass: string
  }
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
    badgeClass: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  },
}

// ── PathCard ─────────────────────────────────────────────────────────────────

function PathCard({
  path,
  userSlug,
}: {
  path: LernpfadListItem
  userSlug: string
}) {
  const cfg = diffConfig[path.difficulty]
  const progress =
    path.totalQuests === 0
      ? 0
      : Math.round((path.completedQuests / path.totalQuests) * 100)
  const isCompleted = progress === 100 && path.totalQuests > 0
  const isInProgress = path.completedQuests > 0 && !isCompleted

  const cardInner = (
    <Card
      className={cn(
        'h-full gap-4 py-5 transition-all duration-200',
        'hover:border-foreground/20 hover:shadow-md',
        isCompleted && 'ring-1 ring-emerald-500/30',
        path.isLocked && 'pointer-events-none opacity-60',
      )}
    >
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="outline"
            className={cn('text-[10px] uppercase tracking-wider', cfg.badgeClass)}
          >
            <span aria-hidden>{cfg.emoji}</span>
            {cfg.label}
          </Badge>

          {path.isLocked ? (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              <Lock />
              Gesperrt
            </Badge>
          ) : isCompleted ? (
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
            >
              <CheckCircle2 />
              Abgeschlossen
            </Badge>
          ) : isInProgress ? (
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

        <CardTitle className="line-clamp-2 text-base leading-snug transition-colors group-hover:text-sky-600 dark:group-hover:text-sky-400">
          {path.title}
        </CardTitle>

        {path.description && (
          <CardDescription className="line-clamp-2 text-xs leading-relaxed">
            {path.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Fortschritt</span>
            <span className={cn(isCompleted && 'text-emerald-500')}>
              {path.completedQuests} / {path.totalQuests} Quests
            </span>
          </div>
          <Progress
            value={progress}
            className={cn(
              'h-2',
              isCompleted && '[&>[data-slot=progress-indicator]]:bg-emerald-500',
            )}
          />
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0" />
            {path.estimatedTime}
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
            <Zap className="h-3 w-3 shrink-0" />~{path.xpReward} XP
          </span>
          {path.badgeName && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-300">
              <Star className="h-3 w-3 shrink-0 fill-current" />
              {path.badgeName}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          variant={isCompleted ? 'outline' : 'secondary'}
          className={cn(
            'w-full justify-center gap-2',
            isCompleted &&
              'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300',
          )}
          tabIndex={-1}
        >
          {isCompleted ? <CheckCircle2 /> : <Route />}
          {isCompleted
            ? 'Nochmal ansehen'
            : isInProgress
              ? 'Weitermachen'
              : 'Lernpfad starten'}
          <ChevronRight className="transition-transform group-hover:translate-x-0.5" />
        </Button>
      </CardFooter>
    </Card>
  )

  if (path.isLocked) {
    return <div className="group">{cardInner}</div>
  }

  return (
    <Link
      href={`/lernpfade/${userSlug}/${path.slug}`}
      className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {cardInner}
    </Link>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function LernpfadeListClient({
  userSlug,
  paths,
}: {
  userSlug: string
  paths: LernpfadListItem[]
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<DifficultyFilter>('Alle')

  const filteredPaths = useMemo(() => {
    return paths.filter((path) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        path.title.toLowerCase().includes(q) ||
        (path.description ?? '').toLowerCase().includes(q)
      const matchesDifficulty =
        selectedDifficulty === 'Alle' ||
        diffConfig[path.difficulty].label === selectedDifficulty
      return matchesSearch && matchesDifficulty
    })
  }, [paths, searchQuery, selectedDifficulty])

  const hasActiveFilters = searchQuery !== '' || selectedDifficulty !== 'Alle'

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-8 p-4 md:p-6">
      {/* ── Page header ──────────────────────────────────────────── */}
      <header className="space-y-2">
        <div className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <Route className="h-5 w-5" />
          <span>Lernen</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Lernpfade</h1>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
          Arbeite Quests der Reihe nach ab und schalte seltene Abzeichen frei.
          Jeder abgeschlossene Pfad bringt XP und Ruhm.
        </p>
      </header>

      {/* ── Toolbar: search │ difficulty tabs (vertical separator) ─ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Lernpfade durchsuchen…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9 pr-9"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Suche zurücksetzen"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Separator
          orientation="vertical"
          className="hidden sm:block sm:!h-8"
        />

        <Tabs
          value={selectedDifficulty}
          onValueChange={(v) => setSelectedDifficulty(v as DifficultyFilter)}
        >
          <TabsList>
            <TabsTrigger value="Alle">Alle</TabsTrigger>
            <TabsTrigger value="Anfänger" className="gap-1">
              <span aria-hidden>🌱</span>
              Anfänger
            </TabsTrigger>
            <TabsTrigger value="Fortgeschritten" className="gap-1">
              <span aria-hidden>⚔️</span>
              Fortgeschritten
            </TabsTrigger>
            <TabsTrigger value="Pro" className="gap-1">
              <span aria-hidden>👑</span>
              Pro
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <p className="-mt-4 text-xs text-muted-foreground">
        {filteredPaths.length}{' '}
        {filteredPaths.length === 1 ? 'Lernpfad' : 'Lernpfade'}
      </p>

      {/* ── Card grid / empty state ─────────────────────────────── */}
      {filteredPaths.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredPaths.map((path) => (
            <PathCard key={path.id} path={path} userSlug={userSlug} />
          ))}
        </div>
      ) : (
        <Card className="mx-auto max-w-sm border-dashed py-10 text-center shadow-none">
          <CardContent className="space-y-3">
            <Route className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="text-lg font-semibold">
              {searchQuery ? `Nichts für „${searchQuery}“` : 'Keine Lernpfade'}
            </p>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'Versuche einen anderen Suchbegriff oder setze die Filter zurück.'
                : 'Für diesen Schwierigkeitsgrad gibt es noch keine Lernpfade. Schau später wieder vorbei!'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedDifficulty('Alle')
                }}
              >
                Filter zurücksetzen
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
