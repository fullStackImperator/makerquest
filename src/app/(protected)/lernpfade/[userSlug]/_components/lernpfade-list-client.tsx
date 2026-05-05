'use client'

import {
  Search,
  BookOpen,
  Trophy,
  Lock,
  CheckCircle2,
  Clock,
  Sparkles,
  Route,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import type { LernpfadDifficulty } from '@/generated/enums'
import { cn } from '@/lib/utils'

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

function difficultyLabel(d: LernpfadDifficulty): string {
  switch (d) {
    case 'ANFAENGER':
      return 'Anfänger'
    case 'FORTGESCHRITTEN':
      return 'Fortgeschritten'
    case 'PRO':
      return 'Pro'
    default:
      return d
  }
}

function difficultyBadgeClass(difficulty: LernpfadDifficulty): string {
  switch (difficulty) {
    case 'ANFAENGER':
      return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    case 'FORTGESCHRITTEN':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300'
    case 'PRO':
      return 'border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-300'
    default:
      return ''
  }
}

export function LernpfadeListClient({
  userSlug,
  paths,
}: {
  userSlug: string
  paths: LernpfadListItem[]
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Alle')

  const difficulties = ['Alle', 'Anfänger', 'Fortgeschritten', 'Pro'] as const

  const filteredPaths = useMemo(() => {
    return paths.filter((path) => {
      const matchesSearch =
        path.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (path.description ?? '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      const d = difficultyLabel(path.difficulty)
      const matchesDifficulty =
        selectedDifficulty === 'Alle' || selectedDifficulty === d
      return matchesSearch && matchesDifficulty
    })
  }, [paths, searchQuery, selectedDifficulty])

  const getProgressPercentage = (completed: number, total: number) => {
    if (total === 0) return 0
    return Math.round((completed / total) * 100)
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-10 pt-2 md:px-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="bg-sidebar-accent text-sidebar-accent-foreground flex size-9 items-center justify-center rounded-lg border border-border/60">
            <Route className="size-4" aria-hidden />
          </div>
          <span className="text-sm font-medium tracking-wide uppercase">
            Lernen
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Lernpfade
        </h1>
        <p className="text-muted-foreground max-w-2xl text-pretty text-sm leading-relaxed md:text-base">
          Wähle einen veröffentlichten Lernpfad und arbeite die Quests der Reihe
          nach ab. Fortschritt und Belohnungen siehst du auf der Detailseite.
        </p>
      </header>

      <div className="space-y-4">
        <div className="relative max-w-xl">
          <Search
            className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Lernpfade durchsuchen…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-background/80 h-11 border-border/60 pl-10 shadow-xs backdrop-blur-sm"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Schwierigkeit
          </p>
          <div className="flex flex-wrap gap-2">
            {difficulties.map((difficulty) => (
              <Button
                key={difficulty}
                type="button"
                size="sm"
                variant={
                  selectedDifficulty === difficulty ? 'default' : 'outline'
                }
                className={cn(
                  'rounded-full',
                  selectedDifficulty === difficulty &&
                    'shadow-sm',
                )}
                onClick={() => setSelectedDifficulty(difficulty)}
              >
                {difficulty}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Separator className="bg-border/60" />

      <p className="text-muted-foreground text-sm">
        {filteredPaths.length}{' '}
        {filteredPaths.length === 1 ? 'Lernpfad' : 'Lernpfade'} gefunden
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredPaths.map((path) => {
          const progress = getProgressPercentage(
            path.completedQuests,
            path.totalQuests,
          )
          const isCompleted = progress === 100 && path.totalQuests > 0
          const diffLabel = difficultyLabel(path.difficulty)

          return (
            <Card
              key={path.id}
              className={cn(
                'border-border/60 overflow-hidden shadow-sm transition-shadow hover:shadow-md',
                path.isLocked && 'opacity-70',
              )}
            >
              <CardHeader className="relative space-y-3 pb-3">
                {path.isLocked && (
                  <div className="bg-background/85 absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                    <Lock className="text-muted-foreground size-10" />
                    <p className="text-muted-foreground text-sm font-medium">
                      Noch nicht verfügbar
                    </p>
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="bg-muted/50 flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/60">
                    <BookOpen className="text-foreground size-5" aria-hidden />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-medium',
                        difficultyBadgeClass(path.difficulty),
                      )}
                    >
                      {diffLabel}
                    </Badge>
                    {isCompleted && (
                      <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600/90 dark:bg-emerald-600">
                        <CheckCircle2 className="size-3.5" />
                        Abgeschlossen
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <CardTitle className="line-clamp-2 text-lg leading-snug">
                    {path.title}
                  </CardTitle>
                  <CardDescription className="mt-2 line-clamp-2 text-pretty">
                    {path.description ?? 'Keine Beschreibung hinterlegt.'}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">
                      Fortschritt
                    </span>
                    <span className="text-foreground tabular-nums">
                      {path.completedQuests}/{path.totalQuests} Quests ·{' '}
                      {progress}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="text-muted-foreground grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="bg-sidebar-accent text-sidebar-accent-foreground flex size-8 items-center justify-center rounded-md border border-border/60">
                      <Clock className="size-3.5" aria-hidden />
                    </div>
                    <span>{path.estimatedTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-sidebar-accent text-sidebar-accent-foreground flex size-8 items-center justify-center rounded-md border border-border/60">
                      <Sparkles className="size-3.5" aria-hidden />
                    </div>
                    <span className="tabular-nums">~{path.xpReward} XP</span>
                  </div>
                </div>

                {path.badgeName && (
                  <div className="bg-muted/40 flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs">
                    <Trophy className="text-amber-600 dark:text-amber-400 size-4 shrink-0" />
                    <span className="text-foreground/90 font-medium">
                      Abschluss-Badge: {path.badgeName}
                    </span>
                  </div>
                )}
              </CardContent>

              <CardFooter className="border-border/50 border-t pt-4">
                {!path.isLocked ? (
                  <Button className="w-full" asChild>
                    <Link href={`/lernpfade/${userSlug}/${path.slug}`}>
                      Details und starten
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full" variant="secondary" disabled>
                    Gesperrt
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {filteredPaths.length === 0 && (
        <Card className="border-border/60 border-dashed py-16 shadow-none">
          <CardContent className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="bg-muted/50 flex size-14 items-center justify-center rounded-full border border-border/60">
              <BookOpen className="text-muted-foreground size-7" />
            </div>
            <p className="text-foreground text-lg font-medium">
              Keine Lernpfade gefunden
            </p>
            <p className="text-muted-foreground max-w-sm text-sm">
              Passe die Suche oder den Schwierigkeitsfilter an, oder schau später
              wieder vorbei.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
