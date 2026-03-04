import { Category, Course, Fach } from '@prisma/client'
import { CourseCard } from '@/components/quests/course-card'

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
  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"> */}
        {items.map((item) => (
          <CourseCard
            key={item.id}
            id={item.id}
            title={item.title}
            description={item.description!}
            imageUrl={item.imageUrl!}
            chaptersLength={item.chapters.length}
            level={item.level!}
            schwierigkeit={item.schwierigkeit!}
            progress={item.progress}
            faecher={(item.faecher || []).map((fach) => fach.name)}
            categories={(item.categories || []).map(
              (category) => category.name
            )}
            prerequisites={item?.prerequisites!}
            vorkenntnisse={item?.vorkenntnisse!}
            kompetenzen={item?.kompetenzen!}
          />
        ))}
      </div>
      {items.length === 0 && (
        <div className="text-center text-sm text-muted-foreground mt-10">
          Kein Projekt gefunden
        </div>
      )}
    </div>
  )
}
