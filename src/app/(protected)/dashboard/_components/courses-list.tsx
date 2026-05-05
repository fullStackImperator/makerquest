import { Category, Course, Fach } from '@/generated/client'
import { CourseCard } from './course-card'

type CourseWithProgressWithCategory = Course & {
  categories: Category[] | null
  faecher: Fach[] | null
  chapters: { id: string }[]
  progress: number | null
}

type CoursesListProps = {
  items: CourseWithProgressWithCategory[]
}

export const CoursesList = ({ items }: CoursesListProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground mt-10">
        Kein Projekt gefunden
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
      {items.map((item) => (
        <CourseCard
          key={item.id}
          id={item.id}
          title={item.title}
          description={item.description ?? ''}
          imageUrl={item.imageUrl ?? ''}
          chaptersLength={item.chapters.length}
        //   level={item.level ?? 0}
          schwierigkeit={item.schwierigkeit ?? ''}
          progress={item.progress}
          faecher={(item.faecher ?? []).map((f) => f.name)}
          categories={(item.categories ?? []).map((c) => c.name)}
          prerequisites={item.prerequisites ?? ''}
          vorkenntnisse={item.vorkenntnisse ?? ''}
          kompetenzen={item.kompetenzen ?? ''}
        />
      ))}
    </div>
  )
}
