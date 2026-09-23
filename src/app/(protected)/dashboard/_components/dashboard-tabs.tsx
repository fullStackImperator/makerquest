'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CoursesList } from './courses-list'
import {
  Flame, Trophy, Route,
  MapPin, Sparkles, Clock, Zap,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { Category, Course, Fach } from '@/generated/client'
import type { DashboardLernpfad } from '../_actions/get-user-learning-paths'
import { CARD, CARD_INNER, FONT, TEXT } from './glass-styles'

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

function dColor(d: string): { text: string; bg: string; border: string; bar: string } {
  if (d === 'ANFAENGER')       return { text: '#047857', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.25)', bar: '#34d399' }
  if (d === 'FORTGESCHRITTEN') return { text: '#b45309', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.25)', bar: '#fbbf24' }
  return                               { text: '#b91c1c', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)', bar: '#f87171' }
}

function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="w-full flex flex-col items-center justify-center text-center gap-3">
      <div className="p-4 rounded-2xl" style={{ background: 'rgba(69,158,161,0.06)', border: '1px solid rgba(69,158,161,0.12)' }}>
        <Icon className="h-9 w-9" style={{ color: 'rgba(69,158,161,0.25)' }} />
      </div>
      <p className="font-semibold text-sm" style={{ color: TEXT.muted, fontFamily: FONT }}>{title}</p>
      <p className="text-xs max-w-xs" style={{ color: TEXT.faint }}>{sub}</p>
    </div>
  )
}

export function DashboardTabs({
  coursesInProgress,
  completedCourses,
  learningPaths,
  userSlug,
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState('active')

  useEffect(() => {
    const handler = (e: Event) => setActiveTab((e as CustomEvent<string>).detail)
    window.addEventListener('dash-tab', handler)
    return () => window.removeEventListener('dash-tab', handler)
  }, [])

  return (
    <div id="quests-section" style={CARD} className="overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

        {/* Tab bar */}
        <div style={{ borderBottom: '1px solid rgba(180,210,225,0.35)' }}>
          <TabsList className="flex h-auto p-0 bg-transparent rounded-none gap-0 w-full">
            {[
              { value: 'active',    icon: Flame,  label: 'Aktiv',     count: coursesInProgress.length,  activeColor: '#c97c18' },
              { value: 'completed', icon: Trophy, label: 'Fertig',    count: completedCourses.length,   activeColor: '#1a9060' },
              { value: 'lernpfade', icon: Route,  label: 'Lernpfade', count: learningPaths.filter(p => p.isEnrolled && !p.isCompleted).length, activeColor: '#5c5cc0' },
            ].map(({ value, icon: Icon, label, count, activeColor }) => (
              <TabsTrigger
                key={value}
                value={value}
                className={`
                  flex items-center gap-1.5 px-5 py-3.5 rounded-none -mb-px
                  text-[10px] font-semibold uppercase tracking-[0.15em] bg-transparent
                  border-b-2 border-transparent shadow-none
                  transition-colors duration-150
                  hover:bg-[rgba(69,158,161,0.04)]
                  data-[state=active]:shadow-none data-[state=active]:bg-transparent
                `}
                style={{ color: TEXT.muted, fontFamily: FONT }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: 'currentColor' }} />
                {label}
                {count > 0 && (
                  <span
                    className="rounded-full px-1.5 py-px text-[9px] font-bold ml-0.5"
                    style={{ background: `${activeColor}14`, color: activeColor, border: `1px solid ${activeColor}28`, fontFamily: FONT }}
                  >
                    {count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="p-4">
          <TabsContent value="active" className="w-full mt-0">
            {coursesInProgress.length === 0
              ? <EmptyState icon={MapPin} title="Keine aktiven Quests" sub="Starte ein neues Abenteuer und melde dich für eine Quest an!" />
              : <CoursesList items={coursesInProgress} />
            }
          </TabsContent>

          <TabsContent value="completed" className="w-full mt-0">
            {completedCourses.length === 0
              ? <EmptyState icon={Sparkles} title="Noch keine Quests abgeschlossen" sub="Schließe deine ersten Quests ab, um sie hier zu sehen!" />
              : <CoursesList items={completedCourses} />
            }
          </TabsContent>

          <TabsContent value="lernpfade" className="w-full mt-0">
            {learningPaths.length === 0 ? (
              <EmptyState icon={Route} title="Keine Lernpfade verfügbar" sub="Schau später wieder vorbei — neue Lernpfade erscheinen hier." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {learningPaths.map((path) => {
                  const progress = path.totalSteps === 0 ? 0 : Math.round((path.completedSteps / path.totalSteps) * 100)
                  const dc = dColor(path.difficulty)
                  return (
                    <Link key={path.id} href={`/lernpfade/${userSlug}/${path.slug}`}>
                      <div
                        className="group h-full flex flex-col transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
                        style={{ ...CARD_INNER, padding: '1rem', borderTop: `2px solid ${dc.border}` }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3
                            className="font-semibold text-sm leading-snug line-clamp-2 flex-1 group-hover:text-[#459ea1] transition-colors"
                            style={{ color: TEXT.primary, fontFamily: FONT }}
                          >
                            {path.title}
                          </h3>
                          <span
                            className="text-[9px] font-semibold uppercase tracking-wider rounded-full border px-2 py-0.5 shrink-0"
                            style={{ color: dc.text, background: dc.bg, border: `1px solid ${dc.border}`, fontFamily: FONT }}
                          >
                            {difficultyLabel(path.difficulty)}
                          </span>
                        </div>

                        {path.description && (
                          <p className="text-xs line-clamp-2 mb-3" style={{ color: TEXT.muted }}>{path.description}</p>
                        )}

                        <div className="mt-auto space-y-1.5">
                          <div className="flex justify-between text-[10px]" style={{ color: TEXT.faint, fontFamily: FONT }}>
                            <span>{path.completedSteps}/{path.totalSteps} Quests</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: `${dc.bar}18` }}>
                            <div
                              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                              style={{ width: `${progress}%`, background: progress === 100 ? '#34d399' : dc.bar }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] mt-2.5" style={{ color: TEXT.faint }}>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {path.estimatedTime}
                          </span>
                          {path.badgeName && (
                            <span className="flex items-center gap-1 font-medium" style={{ color: '#c97c18' }}>
                              <Trophy className="h-3 w-3" />{path.badgeName}
                            </span>
                          )}
                          {path.isCompleted ? (
                            <span className="flex items-center gap-1 font-semibold" style={{ color: '#1a9060', fontFamily: FONT }}>
                              <CheckCircle2 className="h-3 w-3" />Fertig
                            </span>
                          ) : !path.isEnrolled ? (
                            <span className="flex items-center gap-1 font-semibold" style={{ color: '#459ea1', fontFamily: FONT }}>
                              <Zap className="h-3 w-3" />Starten
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 font-semibold" style={{ color: '#c97c18', fontFamily: FONT }}>
                              <Flame className="h-3 w-3" />Aktiv
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
