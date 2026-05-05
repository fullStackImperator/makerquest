import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, GraduationCap, SignalHigh } from 'lucide-react'
import { CourseProgress } from './course-progress'
import { Separator } from '@/components/ui/separator'
import { CourseEnrollButton } from './course-enroll-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type CourseCardProps = {
  id: string
  title: string
  description: string
  imageUrl: string
  chaptersLength: number
  schwierigkeit: string
  klassenstufe?: number | null
  isPublished?: boolean
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
  schwierigkeit,
  klassenstufe,
  isPublished,
  progress,
  categories,
  faecher,
}: CourseCardProps) => {
  return (
    <Card className="border-border/60 overflow-hidden shadow-sm transition hover:shadow-md">
      <CardContent className="flex h-full flex-col gap-4 p-3">
        <div className="space-y-3">
          <Link
            href={`/quests/${id}`}
            className="group relative block aspect-video overflow-hidden rounded-md border border-border/60 bg-muted/20"
          >
            <Image
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              alt={title}
              src={imageUrl}
            />
          </Link>

          <div className="space-y-2">
            <Link
              href={`/quests/${id}`}
              className="hover:text-foreground/90 block"
            >
              <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight">
                {title}
              </h3>
            </Link>

            <p className="text-muted-foreground line-clamp-2 text-sm">
              {description}
            </p>
          </div>
        </div>

        <div className="text-muted-foreground grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="bg-sidebar-accent text-sidebar-accent-foreground flex size-7 items-center justify-center rounded-md border border-border/60">
              <BookOpen className="size-3.5" aria-hidden />
            </div>
            <span className="tabular-nums">
              {chaptersLength} Kapitel
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-sidebar-accent text-sidebar-accent-foreground flex size-7 items-center justify-center rounded-md border border-border/60">
              <SignalHigh className="size-3.5" aria-hidden />
            </div>
            <span className="truncate">{schwierigkeit}</span>
          </div>
          {typeof klassenstufe === 'number' && (
            <div className="flex items-center gap-2">
              <div className="bg-sidebar-accent text-sidebar-accent-foreground flex size-7 items-center justify-center rounded-md border border-border/60">
                <GraduationCap className="size-3.5" aria-hidden />
              </div>
              <span className="tabular-nums">{klassenstufe}. Klasse</span>
            </div>
          )}
          {isPublished === false && (
            <div className="flex items-center justify-end">
              <span className="text-[11px] font-medium tracking-wide uppercase">
                Entwurf
              </span>
            </div>
          )}
        </div>

        {(faecher?.length || categories?.length) ? (
          <div className="flex flex-col gap-3">
            {!!faecher?.length && (
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                  Fächer
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {faecher.slice(0, 3).map((fach) => (
                    <Badge
                      key={fach}
                      variant="secondary"
                      className="bg-muted/40 text-[11px]"
                    >
                      {fach}
                    </Badge>
                  ))}
                  {faecher.length > 3 && (
                    <Badge variant="secondary" className="text-[11px]">
                      +{faecher.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            {!!categories?.length && (
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                  Themen
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.slice(0, 4).map((category) => (
                    <Badge
                      key={category}
                      variant="outline"
                      className="border-border/60 text-[11px]"
                    >
                      {category}
                    </Badge>
                  ))}
                  {categories.length > 4 && (
                    <Badge
                      variant="outline"
                      className="border-border/60 text-[11px]"
                    >
                      +{categories.length - 4}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-auto space-y-3">
          <Separator className="bg-border/50" />

          {progress !== null ? (
            <div className="space-y-3">
              <CourseProgress
                variant={progress === 100 ? 'success' : 'default'}
                size="sm"
                value={progress!}
              />
              <Link href={`/quests/${id}`} className="block">
                <Button className="w-full" size="sm">
                  {progress === 100 ? 'Quest ansehen' : 'Weiterlernen'}
                </Button>
              </Link>
            </div>
          ) : (
            <div className={cn(isPublished === false && 'opacity-60')}>
              <CourseEnrollButton courseId={id} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
