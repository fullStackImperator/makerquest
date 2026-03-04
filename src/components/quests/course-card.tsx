import Image from 'next/image'
import Link from 'next/link'
// import { IconBadge } from '@/components/icon-badge'
import { BookOpen, Wrench, LayoutList, Tag } from 'lucide-react'
import { CourseProgress } from './course-progress'
import { Separator } from '@/components/ui/separator'
import { CourseEnrollButton } from './course-enroll-button'

type CourseCardProps = {
  id: string
  title: string
  description: string
  imageUrl: string
  chaptersLength: number
  level: number
  schwierigkeit: string
  progress?: number | null
  categories: string[] | undefined
  faecher: string[] | undefined
  prerequisites: string
  vorkenntnisse: string
  kompetenzen: string
}

export const CourseCard = ({
  id,
  title,
  description,
  imageUrl,
  chaptersLength,
  level,
  schwierigkeit,
  progress,
  categories,
  faecher,
  prerequisites,
  vorkenntnisse,
  kompetenzen,
}: CourseCardProps) => {
  return (
    <Link href={`/courses/${id}`}>
      <div className="group panel shadow-lg hover:scale-[1.02] border transition overflow-hidden rounded-lg p-3 h-full flex flex-col">
        <div className="flex-1 flex flex-col">
          <div
            className="relative w-full aspect-video rounded-md overflow-hidden
          duration-700 ease-in-out scale-100 blur-0 grayscale-0 object-cover"
          >
            <Image fill className="object-cover" alt={title} src={imageUrl} />
          </div>
          <div className="flex-1 flex flex-col pt-2">
            <div className="text-lg md:text-lg font-bold group-hover:text-sky-700 transition line-clamp-2">
              {title}
            </div>
            <div
              className='text-md mt-2 mb-4 font-light group-hover:text-sky-700 transition line-clamp-2'
            >
              {description}
            </div>

            {/* Title for Faecher */}
            {faecher && faecher.length > 0 && (
              <>
                <div className="flex items-center mb-2">
                  {/* <IconBadge size="sm" icon={LayoutList} /> */}
                  <h4 className="text-sm font-semibold ml-2">Fächer:</h4>
                </div>
                {/* <h4 className="text-sm font-semibold mb-2">Fächer:</h4> */}
                <div className="flex flex-wrap rounded-xl gap-2 mb-6">
                  {faecher.map((fach, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded"
                    >
                      {fach}
                    </span>
                  ))}
                </div>
              </>
            )}

            {/* Title for Categories */}
            {categories && categories.length > 0 && (
              <>
                <div className="flex items-center mb-2">
                  {/* <IconBadge size="sm" icon={Tag} /> */}
                  <h4 className="text-sm font-semibold ml-2">Themen:</h4>
                </div>{' '}
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((category, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        {/* Progress or Enroll button at the bottom */}
        <div className="mt-auto">
          <div className="my-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-x-2 text-black">
              {/* <IconBadge size="sm" icon={BookOpen} /> */}
              <span>
                {chaptersLength} {chaptersLength === 1 ? 'Kapitel' : 'Kapitel'}
              </span>
            </div>
            <div className="flex items-center gap-x-2 text-slate-500">
              {/* <IconBadge size="sm" icon={Wrench} /> */}
              <p className="text-md md:text-sm text-black font-medium">
                {schwierigkeit}
              </p>
            </div>
          </div>

          <Separator className="my-4" />
          {progress !== null ? (
            <div className="space-y-2">
              <CourseProgress
                variant={progress === 100 ? 'success' : 'default'}
                size="sm"
                value={progress!}
              />
            </div>
          ) : (
            <CourseEnrollButton courseId={id} level={level} />
          )}
        </div>
      </div>
    </Link>
  )
}
