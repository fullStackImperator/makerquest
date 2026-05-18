'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CoursesList } from './courses-list'
import { Flame, Trophy, MapPin, Sparkles } from 'lucide-react'
import { Category, Course, Fach } from '@/generated/client'

type CourseWithProgress = Course & {
  categories: Category[] | null
  faecher: Fach[] | null
  chapters: { id: string }[]
  progress: number | null
}

type QuestTabsProps = {
  coursesInProgress: CourseWithProgress[]
  completedCourses: CourseWithProgress[]
}

export function QuestTabs({ coursesInProgress, completedCourses }: QuestTabsProps) {
  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 h-12">
        <TabsTrigger value="active" className="flex items-center gap-2 text-sm font-semibold">
          <Flame className="h-4 w-4" />
          Aktive Quests
          {coursesInProgress.length > 0 && (
            <span className="ml-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
              {coursesInProgress.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="completed" className="flex items-center gap-2 text-sm font-semibold">
          <Trophy className="h-4 w-4" />
          Abgeschlossen
          {completedCourses.length > 0 && (
            <span className="ml-1 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
              {completedCourses.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active">
        {coursesInProgress.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-xl font-semibold">Keine aktiven Quests</h3>
            <p className="text-muted-foreground">
              Starte ein neues Abenteuer und melde dich für eine Quest an!
            </p>
          </div>
        ) : (
          <CoursesList items={coursesInProgress} />
        )}
      </TabsContent>

      <TabsContent value="completed">
        {completedCourses.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-xl font-semibold">Noch keine Quests abgeschlossen</h3>
            <p className="text-muted-foreground">
              Schließe deine ersten Quests ab, um sie hier zu sehen!
            </p>
          </div>
        ) : (
          <CoursesList items={completedCourses} />
        )}
      </TabsContent>
    </Tabs>
  )
}
