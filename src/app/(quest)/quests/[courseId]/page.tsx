import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/get-session-user'
import { getProgress } from '@/actions/get-progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CourseEnrollRedirectButton } from './_components/course-enroll-redirect-button'
import Link from 'next/link'
import { CourseProgress } from '@/components/quests/course-progress'
import { Preview } from '@/components/quillEditor/previewQuill'
import Image from 'next/image'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CourseMobileSidebar } from './_components/course-mobile-sidebar'

const CourseIdPage = async ({
  params,
}: {
  params: Promise<{ courseId: string }>
}) => {
  const { courseId } = await params
  const user = await getSessionUser()

  if (!user) {
    return redirect('/')
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      categories: true,
      chapters: {
        where: { isPublished: true },
        include: {
          userProgress: { where: { userId: user.id } },
        },
        orderBy: { position: 'asc' },
      },
      faecher: true,
      attachments: true,
      purchases: {
        where: { userId: user.id, courseId },
      },
    },
  })

  if (!course) {
    return redirect('/')
  }

  const userProgress = await getProgress(user.id, courseId)
  const isEnrolled = course.purchases.length > 0
  const firstChapter = course.chapters[0]

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="bg-muted/30 border-border/60 flex items-center gap-3 border-b px-3 py-2.5 lg:hidden">
        <CourseMobileSidebar
          course={course}
          progressCount={userProgress ?? 0}
          chapterPanel={null}
        />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {course.title}
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
        <div className="min-w-0 space-y-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {course.title}
            </h1>
            {course.description && (
              <p className="text-muted-foreground mt-3 text-lg leading-relaxed">
                {course.description.length > 200
                  ? `${course.description.slice(0, 199)}…`
                  : course.description}
              </p>
            )}
          </div>

          {course.imageUrl && (
            <div className="border-border/60 relative aspect-video overflow-hidden rounded-xl border bg-muted/20">
              <Image
                src={course.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, min(896px, 66vw)"
                priority
              />
            </div>
          )}

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Inhalt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {course.chapters.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Noch keine Kapitel verfügbar.
                </p>
              ) : (
                course.chapters.map((chapter, index) => (
                  <div
                    key={chapter.id}
                    className="flex items-start gap-3 text-sm leading-snug"
                  >
                    <Badge
                      variant="secondary"
                      className="mt-0.5 size-7 shrink-0 rounded-full p-0 text-xs"
                    >
                      {index + 1}
                    </Badge>
                    <span>{chapter.title}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {course.prerequisites && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Material</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Preview value={course.prerequisites} />
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="border-border/60 bg-card space-y-6 rounded-xl border p-6 shadow-sm">
            {isEnrolled && firstChapter ? (
              <div className="space-y-4">
                <Link
                  href={`/quests/${course.id}/chapters/${firstChapter.id}`}
                  className="block"
                >
                  <Button
                    variant="secondary"
                    className="w-full py-6 text-base"
                  >
                    Zum Projekt
                  </Button>
                </Link>
                <CourseProgress
                  variant={userProgress === 100 ? 'success' : 'default'}
                  size="sm"
                  value={userProgress ?? 0}
                />
              </div>
            ) : firstChapter ? (
              <CourseEnrollRedirectButton
                courseId={course.id}
                firstChapterId={firstChapter.id}
              />
            ) : (
              <p className="text-muted-foreground text-sm italic">
                Keine Kapitel verfügbar
              </p>
            )}

            {(course.faecher.length > 0 || course.categories.length > 0) && (
              <>
                <Separator className="bg-border/50" />
                <div className="space-y-4">
                  {course.faecher.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-2 text-[11px] font-semibold uppercase tracking-wider">
                        Fächer
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {course.faecher.map((fach) => (
                          <Badge key={fach.id} variant="secondary">
                            {fach.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {course.categories.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-2 text-[11px] font-semibold uppercase tracking-wider">
                        Themen
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {course.categories.map((category) => (
                          <Badge key={category.id} variant="outline">
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {course.kompetenzen && (
              <>
                <Separator className="bg-border/50" />
                <div>
                  <h2 className="mb-2 text-base font-semibold">
                    Was du lernen wirst
                  </h2>
                  <Preview value={course.kompetenzen} />
                </div>
              </>
            )}

            {course.vorkenntnisse && (
              <>
                <Separator className="bg-border/50" />
                <div>
                  <h2 className="mb-2 text-base font-semibold">
                    Vorkenntnisse
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {course.vorkenntnisse}
                  </p>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default CourseIdPage
