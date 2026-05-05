import { ChapterTitleForm } from './_components/chapter-title-form'
import { ChapterEditorForm } from './_components/chapter-editor-form'
import { Banner } from '@/components/banner'
import { ChapterActions } from './_components/chapter-actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { auth } from '@/lib/auth'
import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { headers } from 'next/headers'
import { ArrowLeft, Type } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

interface ChapterIdPageProps {
  params: Promise<{ courseId: string; chapterId: string }>
}

const ChapterIdPage = async ({ params }: ChapterIdPageProps) => {
  const { courseId, chapterId } = await params

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    redirect('/')
  }

  const viewer = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isAdmin: true },
  })

  if (!viewer) {
    redirect('/')
  }

  const teachable = await getCourseIfTeachable(courseId, viewer)
  if (!teachable) {
    redirect('/admin/quests')
  }

  const chapter = await db.chapter.findFirst({
    where: {
      id: chapterId,
      courseId,
    },
  })

  if (!chapter) {
    return redirect('/')
  }

  const requiredFields = [chapter.title, chapter.mathEditor]
  const isComplete = requiredFields.every(Boolean)

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 px-4">
      {!chapter.isPublished && (
        <Banner
          variant="warning"
          label="Dieses Kapitel ist nicht veröffentlicht. Es wird im Quest nicht sichtbar sein."
        />
      )}

      <div className="mx-auto flex w-full flex-col gap-6 pb-6">
        <Link
          href={`/admin/quests/${courseId}`}
          className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="size-4 shrink-0" />
          Zurück zur Kursgestaltung
        </Link>

        <div className="border-border/60 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Kapitel bearbeiten
            </h1>
            {!isComplete && (
              <p className="text-muted-foreground text-sm">
                Zum Veröffentlichen brauchst du einen Titel und Inhalt im
                Kapitelinhalt.
              </p>
            )}
          </div>
          <div className="shrink-0">
            <ChapterActions
              disabled={!isComplete}
              courseId={courseId}
              chapterId={chapterId}
              isPublished={chapter.isPublished}
            />
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Type className="text-muted-foreground size-5" />
              <CardTitle className="text-lg">Titel</CardTitle>
            </div>
            <CardDescription>
              Name in der Kapitelliste deines Kurses
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ChapterTitleForm
              initialData={chapter}
              courseId={courseId}
              chapterId={chapterId}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <ChapterEditorForm
            initialData={chapter}
            courseId={courseId}
            chapterId={chapterId}
          />
        </Card>
      </div>
    </section>
  )
}

export default ChapterIdPage
