// components/search-component.tsx
'use client'

import { useEffect, useState } from 'react'
import { DifficultyLevel } from '@/generated/enums'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Categories } from './categories-filter'
import { Faecher } from './faecher-filter'
import { useProjectStore } from '@/atoms/filter-state'
import { KlassenstufeFilter } from './klassenstufe-filter'
import { SchwierigkeitFilter } from './schwierigkeit-filter'
import { Separator } from '@/components/ui/separator'
import { RotateCcw, Search, X } from 'lucide-react'
import { CoursesList } from '@/components/quests/courses-list'
import { Category, Course, Fach } from '@/generated/client'

type CourseWithProgressWithCategory = Course & {
  categories: Category[] | null
  faecher: Fach[] | null
  chapters: { id: string }[]
  progress: number | null
}

type SearchCoursesPageProps = {
  categories: Category[]
  faecher: Fach[]
  initialCourses: CourseWithProgressWithCategory[]
}

const SearchCoursesPage = ({
  categories,
  faecher,
  initialCourses,
}: SearchCoursesPageProps) => {
  const {
    currentCategoryId,
    currentFachId,
    currentKlassenstufe,
    currentSchwierigkeit,
    setCategoryId,
    setFachId,
    setKlassenstufe,
    setSchwierigkeit,
  } = useProjectStore()
  const [filteredCourses, setFilteredCourses] =
    useState<CourseWithProgressWithCategory[]>(initialCourses)
  const [resetFiltersState, setResetFiltersState] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const filterCourses = () => {
      let courses = initialCourses

      if (currentCategoryId) {
        courses = courses.filter((course) =>
          course.categories?.some(
            (category) => category.id === currentCategoryId,
          ),
        )
      }
      if (currentFachId) {
        courses = courses.filter((course) =>
          course.faecher?.some((fach) => fach.id === currentFachId),
        )
      }
      if (currentKlassenstufe) {
        courses = courses.filter(
          (course) => course.klassenstufe === currentKlassenstufe,
        )
      }
      if (currentSchwierigkeit) {
        courses = courses.filter(
          (course) => course.schwierigkeit === currentSchwierigkeit,
        )
      }

      const q = searchQuery.toLowerCase().trim()
      if (q) {
        courses = courses.filter(
          (course) =>
            course.title.toLowerCase().includes(q) ||
            (course.description ?? '').toLowerCase().includes(q),
        )
      }

      setFilteredCourses(courses)
    }

    filterCourses()
  }, [
    currentCategoryId,
    currentFachId,
    currentKlassenstufe,
    currentSchwierigkeit,
    searchQuery,
    initialCourses,
  ])

  const resetFilters = () => {
    setCategoryId(null)
    setFachId(null)
    setKlassenstufe(null)
    setSchwierigkeit(null)
    setSearchQuery('')
    setResetFiltersState((prev) => !prev)
  }

  return (
    <>
      {/* <div className="px-6 pt-6 md:mb-0 block">
        <SearchInput />
      </div> */}
      <div className="p-6 space-y-8">
        <h1 className="text-center text-3xl my-4">Quests suchen </h1>

        <div className="relative mx-auto w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Quests durchsuchen…"
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

        <div className="flex justify-center text-center items-center">
          <Faecher
            faecher={faecher}
            currentFachId={currentFachId ?? ''}
            onFachChange={(id) => setFachId(id)}
            reset={resetFiltersState}
          />
          <Categories
            categories={categories}
            currentCategoryId={currentCategoryId ?? ''}
            onCategoryChange={(id) => setCategoryId(id)}
            reset={resetFiltersState}
          />
          <KlassenstufeFilter
            klassenstufen={[5, 6, 7, 8, 9, 10, 11, 12, 13]} // Adjust as needed
            currentKlassenstufe={currentKlassenstufe ?? null}
            onKlassenstufeChange={(id) => setKlassenstufe(id)}
            reset={resetFiltersState}
          />
          <SchwierigkeitFilter
            schwierigkeiten={Object.values(DifficultyLevel)}
            currentSchwierigkeit={currentSchwierigkeit ?? null}
            onSchwierigkeitChange={(id) => setSchwierigkeit(id)}
            reset={resetFiltersState}
          />
          <Button
            variant="default"
            className="justify-between mr-4"
            onClick={resetFilters}
          >
            <RotateCcw />
          </Button>
        </div>
        <Separator />
        <CoursesList items={filteredCourses} />
      </div>
    </>
  )
}

export default SearchCoursesPage
