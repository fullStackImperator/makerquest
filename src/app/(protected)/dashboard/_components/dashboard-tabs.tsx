'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CoursesList } from './courses-list'
import {
  Flame, Trophy, Route,
  MapPin, Sparkles, Clock, Zap,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { Category, Course, Fach } from '@/generated/client'
import type { DashboardLernpfad } from '../_actions/get-user-learning-paths'

type CourseWithProgress = Course & {
  categories: Category[] | null
  faecher: Fach[] | null
  chapters: { id: string }[]
  progress: number | null
}

type DashboardTabsProps = {
  coursesInProgress: CourseWithProgress[]
  completedCourses: CourseWithProgress[]
  learningPaths: DashboardLernpfad[]
  userSlug: string
}

function difficultyLabel(d: string) {
  if (d === 'ANFAENGER') return 'Anfänger'
  if (d === 'FORTGESCHRITTEN') return 'Fortgeschritten'
  if (d === 'PRO') return 'Pro'
  return d
}

function difficultyColor(d: string) {
  if (d === 'ANFAENGER') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
  if (d === 'FORTGESCHRITTEN') return 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
  if (d === 'PRO') return 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
  return ''
}

function CountPill({ n, color }: { n: number; color: string }) {
  if (n === 0) return null
  return (
    <span className={`ml-1.5 ${color} text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none shrink-0`}>
      {n}
    </span>
  )
}

function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-20 text-center gap-3">
      <Icon className="h-12 w-12 text-muted-foreground/30" />
      <p className="font-semibold text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/60 max-w-xs">{sub}</p>
    </div>
  )
}

export function DashboardTabs({
  coursesInProgress,
  completedCourses,
  learningPaths,
  userSlug,
}: DashboardTabsProps) {
  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className="flex h-auto flex-wrap gap-1 w-fit mb-5 p-1">
        <TabsTrigger value="active" className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Aktive Quests
          <CountPill n={coursesInProgress.length} color="bg-orange-500" />
        </TabsTrigger>
        <TabsTrigger value="completed" className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2">
          <Trophy className="h-4 w-4 text-green-500" />
          Abgeschlossen
          <CountPill n={completedCourses.length} color="bg-green-500" />
        </TabsTrigger>
        <TabsTrigger value="lernpfade" className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2">
          <Route className="h-4 w-4 text-blue-500" />
          Lernpfade
          <CountPill n={learningPaths.filter(p => p.isEnrolled && !p.isCompleted).length} color="bg-blue-500" />
        </TabsTrigger>
      </TabsList>

      {/* ── Active Quests ───────────────────────────────────────── */}
      <TabsContent value="active" className="w-full">
        {coursesInProgress.length === 0
          ? <EmptyState icon={MapPin} title="Keine aktiven Quests" sub="Starte ein neues Abenteuer und melde dich für eine Quest an!" />
          : <CoursesList items={coursesInProgress} />
        }
      </TabsContent>

      {/* ── Completed Quests ────────────────────────────────────── */}
      <TabsContent value="completed" className="w-full">
        {completedCourses.length === 0
          ? <EmptyState icon={Sparkles} title="Noch keine Quests abgeschlossen" sub="Schließe deine ersten Quests ab, um sie hier zu sehen!" />
          : <CoursesList items={completedCourses} />
        }
      </TabsContent>

      {/* ── Lernpfade ───────────────────────────────────────────── */}
      <TabsContent value="lernpfade" className="w-full">
        {learningPaths.length === 0 ? (
          <EmptyState icon={Route} title="Keine Lernpfade verfügbar" sub="Schau später wieder vorbei — neue Lernpfade erscheinen hier." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {learningPaths.map((path) => {
              const progress = path.totalSteps === 0 ? 0 : Math.round((path.completedSteps / path.totalSteps) * 100)
              return (
                <Link key={path.id} href={`/lernpfade/${userSlug}/${path.slug}`}>
                  <div className="group panel shadowhard rounded-xl border border-border/60 hover:border-border transition-all duration-200 hover:scale-[1.01] overflow-hidden h-full flex flex-col">
                    <div className={`h-1 w-full shrink-0 ${path.difficulty === 'ANFAENGER' ? 'bg-emerald-500' : path.difficulty === 'FORTGESCHRITTEN' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                    <div className="p-4 flex flex-col gap-3 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-sky-600 transition-colors flex-1">
                          {path.title}
                        </h3>
                        <Badge variant="outline" className={`${difficultyColor(path.difficulty)} shrink-0 text-[10px] font-semibold`}>
                          {difficultyLabel(path.difficulty)}
                        </Badge>
                      </div>

                      {path.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{path.description}</p>
                      )}

                      <div className="mt-auto space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{path.completedSteps}/{path.totalSteps} Quests</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="relative h-1.5 rounded-full bg-muted/60 overflow-hidden">
                          <div
                            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-sky-400'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {path.estimatedTime}
                        </span>
                        {path.badgeName && (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                            <Trophy className="h-3 w-3" />
                            {path.badgeName}
                          </span>
                        )}
                        {path.isCompleted ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            Fertig
                          </span>
                        ) : !path.isEnrolled ? (
                          <span className="flex items-center gap-1 text-blue-500 font-medium">
                            <Zap className="h-3 w-3" />
                            Starten
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-orange-500 font-medium">
                            <Flame className="h-3 w-3" />
                            Aktiv
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
