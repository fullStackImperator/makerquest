import {
  LayoutDashboard,
  ListChecks,
  Wrench,
  Dumbbell,
  BookCheck,
  BookPlus,
  ArrowLeft,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react'

import { auth } from '@/lib/auth'
import { getCourseIfTeachable } from '@/lib/can-access-course-for-teaching'
import { db } from '@/lib/db'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { TitleForm } from './_components/title-form'
import { DescriptionForm } from './_components/description-form'
import { ImageForm } from './_components/image-form'
import { CategoryForm } from './_components/category-form'
import { CourseItemsForm } from './_components/course-items-form'
import { CourseActions } from './_components/course-actions'
import { Banner } from '@/components/banner'
import { PrerequisiteForm } from './_components/prerequisite-form'
import { VorkenntnisseForm } from './_components/vorkenntnisse-form'
import { KompetenzenForm } from './_components/kompetenz-form'
import { SchwierigkeitsForm } from './_components/schwierigkeit-form'
import { LongDescriptionForm } from './_components/longDescription-form'
import Link from 'next/link'
import { KlassenstufeForm } from './_components/klassenstufe-form'
import { FachForm } from './_components/fach-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

function CourseCardSection({
  heading,
  children,
}: {
  heading: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
        {heading}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function QuestSectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="bg-sidebar-accent text-sidebar-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60">
            <Icon className="size-4" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-pretty">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-0">{children}</CardContent>
    </Card>
  )
}

interface CourseIdPageProps {
  params: Promise<{ courseId: string }>
}

const CourseIdPage = async ({ params }: CourseIdPageProps) => {
  const { courseId } = await params

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

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      chapters: {
        orderBy: { position: 'asc' },
      },
      exercises: {
        orderBy: { position: 'asc' },
      },
      categories: true,
      faecher: true,
    },
  })

  const categories = await db.category.findMany({
    orderBy: {
      name: 'asc',
    },
  })

  const faecher = await db.fach.findMany({
    orderBy: {
      name: 'asc',
    },
  })

  if (!course) {
    return redirect('/')
  }

  const pendingExerciseReviews = await db.exerciseResponse.count({
    where: {
      needsReview: true,
      attempt: { exercise: { courseId } },
    },
  })

  const requiredFields = [
    course.title,
    course.description,
    course.longDescription,
    course.imageUrl,
    course.chapters.some((chapter) => chapter.isPublished),
    course.prerequisites,
    course.vorkenntnisse,
    course.kompetenzen,
  ]

  const totalFields = requiredFields.length
  const completedFields = requiredFields.filter(Boolean).length
  const progressPercentage = (completedFields / totalFields) * 100
  const isComplete = requiredFields.every(Boolean)

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-8">
      {!course.isPublished && (
        <Banner
          variant="warning"
          label="Dieser Quest ist nicht veröffentlicht. Er ist für die SuS nicht sichtbar."
        />
      )}

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Link
          href="/admin/quests"
          className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="size-4 shrink-0" />
          Zurück zur Questübersicht
        </Link>

        <div className="border-border/60 space-y-5 border-b pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Quest gestalten
              </h1>
              <p className="text-muted-foreground text-sm">
                Kapitel anlegen, Inhalte pflegen und Felder ausfüllen — mindestens
                ein Kapitel muss veröffentlicht sein.
              </p>
            </div>
            <div className="shrink-0">
              <CourseActions
                disabled={!isComplete}
                courseId={courseId}
                isPublished={course.isPublished}
              />
            </div>
          </div>
          <div className="max-w-xl space-y-2">
            <div className="text-muted-foreground flex items-center justify-between text-sm">
              <span>Fortschritt</span>
              <span className="text-foreground font-medium tabular-nums">
                {completedFields} / {totalFields}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            {!isComplete && (
              <p className="text-muted-foreground text-xs">
                Alle Felder ausfüllen, um veröffentlichen zu können.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <QuestSectionCard
            icon={LayoutDashboard}
            title="Quest-Informationen"
            description="Titel, Beschreibung, Bild, Fach und Kategorien"
          >
            <CourseCardSection heading="Name & Kurzinfo">
              <TitleForm initialData={course} courseId={course.id} />
              <DescriptionForm initialData={course} courseId={course.id} />
            </CourseCardSection>
            <Separator className="bg-border/50" />
            <CourseCardSection heading="Langbeschreibung">
              <LongDescriptionForm initialData={course} courseId={course.id} />
            </CourseCardSection>
            <Separator className="bg-border/50" />
            <CourseCardSection heading="Titelbild">
              <ImageForm initialData={course} courseId={course.id} />
            </CourseCardSection>
            <Separator className="bg-border/50" />
            <CourseCardSection heading="Einordnung">
              <FachForm
                initialData={course}
                courseId={course.id}
                options={faecher.map((fach) => ({
                  label: fach.name,
                  value: fach.id,
                }))}
              />
              <CategoryForm
                initialData={course}
                courseId={course.id}
                options={categories.map((category) => ({
                  label: category.name,
                  value: category.id,
                }))}
              />
            </CourseCardSection>
          </QuestSectionCard>

          <div className="flex flex-col gap-6">
            {pendingExerciseReviews > 0 && (
              <Link
                href={`/admin/quests/${courseId}/reviews`}
                className="border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors"
              >
                <ClipboardCheck className="size-5 shrink-0 text-amber-700" />
                <span>
                  <strong>{pendingExerciseReviews}</strong> Aufgaben-Antwort(en)
                  warten auf Prüfung
                </span>
              </Link>
            )}
            <QuestSectionCard
              icon={ListChecks}
              title="Inhalte"
              description="Kapitel und Aufgaben — Reihenfolge per Drag & Drop"
            >
              <CourseItemsForm initialData={course} courseId={course.id} />
            </QuestSectionCard>

            <QuestSectionCard
              icon={Dumbbell}
              title="Niveau"
              description="Schwierigkeit und Klassenstufe"
            >
              <CourseCardSection heading="Schwierigkeit">
                <SchwierigkeitsForm initialData={course} courseId={course.id} />
              </CourseCardSection>
              <Separator className="bg-border/50" />
              <CourseCardSection heading="Klassenstufe">
                <KlassenstufeForm initialData={course} courseId={course.id} />
              </CourseCardSection>
            </QuestSectionCard>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-2 xl:col-span-1">
            <QuestSectionCard
              icon={Wrench}
              title="Materialien"
              description="Was brauchen die Lernenden?"
            >
              <PrerequisiteForm initialData={course} courseId={course.id} />
            </QuestSectionCard>

            <QuestSectionCard
              icon={BookCheck}
              title="Vorkenntnisse"
              description="Voraussetzungen für diesen Quest"
            >
              <VorkenntnisseForm initialData={course} courseId={course.id} />
            </QuestSectionCard>

            <QuestSectionCard
              icon={BookPlus}
              title="Kompetenzen"
              description="Was sollen die Lernenden mitnehmen?"
            >
              <KompetenzenForm initialData={course} courseId={course.id} />
            </QuestSectionCard>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CourseIdPage
