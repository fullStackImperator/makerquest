import Image from 'next/image'
import Link from 'next/link'
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Flame,
  GraduationCap,
  Hash,
  Library,
  Route,
} from 'lucide-react'
import { CourseEnrollButton } from './course-enroll-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DifficultyLevel } from '@/generated/enums'

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

const diffConfig: Record<
  DifficultyLevel,
  { label: string; emoji: string; badgeClass: string }
> = {
  VERY_EASY: {
    label: 'Sehr einfach',
    emoji: '🌱',
    badgeClass:
      'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  EASY: {
    label: 'Einfach',
    emoji: '🌱',
    badgeClass:
      'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  MEDIUM: {
    label: 'Mittel',
    emoji: '⚔️',
    badgeClass:
      'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  DIFFICULT: {
    label: 'Schwierig',
    emoji: '👑',
    badgeClass:
      'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  },
  VERY_DIFFICULT: {
    label: 'Sehr schwierig',
    emoji: '👑',
    badgeClass:
      'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  },
}

const fallbackDiff = {
  label: 'Unbekannt',
  emoji: '✨',
  badgeClass: 'border-border text-muted-foreground',
}

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex h-5 items-center text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">{children}</div>
      </div>
    </div>
  )
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
  const cfg =
    (diffConfig as Record<string, (typeof diffConfig)[DifficultyLevel]>)[
      schwierigkeit
    ] ?? fallbackDiff

  const isEnrolled = progress !== null && progress !== undefined
  const isCompleted = isEnrolled && (progress ?? 0) >= 100
  const isInProgress = isEnrolled && !isCompleted

  const href = `/quests/${id}`

  const statusBadge = isCompleted ? (
    <Badge
      variant="outline"
      className="border-emerald-500/40 bg-emerald-500/15 text-[10px] text-emerald-700 backdrop-blur-sm dark:text-emerald-300"
    >
      <CheckCircle2 />
      Abgeschlossen
    </Badge>
  ) : isInProgress ? (
    <Badge
      variant="outline"
      className="border-orange-500/40 bg-orange-500/15 text-[10px] text-orange-700 backdrop-blur-sm dark:text-orange-300"
    >
      <Flame />
      Aktiv
    </Badge>
  ) : isPublished === false ? (
    <Badge
      variant="outline"
      className="bg-background/80 text-[10px] text-muted-foreground backdrop-blur-sm"
    >
      Entwurf
    </Badge>
  ) : null

  return (
    <Card
      className={cn(
        'group h-full gap-4 overflow-hidden py-0 pb-5 transition-all duration-200',
        'hover:border-foreground/20 hover:shadow-md',
        isCompleted && 'ring-1 ring-emerald-500/30',
      )}
    >
      {/* ── Hero image ────────────────────────────────────────── */}
      <Link
        href={href}
        className="relative block aspect-video w-full overflow-hidden bg-muted/30 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {imageUrl ? (
          <Image
            fill
            src={imageUrl}
            alt={title}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
            <BookOpen className="h-10 w-10" />
          </div>
        )}

        {statusBadge && (
          <div className="absolute right-2 top-2">{statusBadge}</div>
        )}
      </Link>

      {/* ── Header: difficulty + title + description ──────────── */}
      <CardHeader className="gap-2">
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] uppercase tracking-wider',
            cfg.badgeClass,
          )}
        >
          <span aria-hidden>{cfg.emoji}</span>
          {cfg.label}
        </Badge>

        <Link href={href} className="block">
          <CardTitle className="line-clamp-2 text-base leading-snug transition-colors group-hover:text-sky-600 dark:group-hover:text-sky-400">
            {title}
          </CardTitle>
        </Link>

        {description && (
          <CardDescription className="line-clamp-2 text-xs leading-relaxed">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      {/* ── Body: stats + labelled meta rows ──────────────────── */}
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Klasse</span>
            <span className="font-semibold tabular-nums text-foreground">
              {typeof klassenstufe === 'number' ? klassenstufe : '—'}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold tabular-nums text-foreground">
              {chaptersLength}
            </span>
            <span className="text-muted-foreground">Kapitel</span>
          </span>
        </div>

        {!!faecher?.length && (
          <MetaRow icon={Library} label="Fächer">
            {faecher.slice(0, 4).map((fach) => (
              <Badge
                key={`fach-${fach}`}
                variant="secondary"
                className="bg-muted/60 text-[11px] font-medium"
              >
                {fach}
              </Badge>
            ))}
            {faecher.length > 4 && (
              <Badge variant="secondary" className="text-[11px]">
                +{faecher.length - 4}
              </Badge>
            )}
          </MetaRow>
        )}

        {!!categories?.length && (
          <MetaRow icon={Hash} label="Themen">
            {categories.slice(0, 4).map((category) => (
              <Badge
                key={`cat-${category}`}
                variant="outline"
                className="border-border/60 text-[11px] font-medium"
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
          </MetaRow>
        )}
      </CardContent>

      {/* ── Footer: progress (above) + CTA ────────────────────── */}
      <CardFooter className="flex-col items-stretch gap-3">
        {isEnrolled && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Fortschritt</span>
              <span className={cn(isCompleted && 'text-emerald-500')}>
                {Math.round(progress ?? 0)}%
              </span>
            </div>
            <Progress
              value={progress ?? 0}
              className={cn(
                'h-2',
                isCompleted &&
                  '[&>[data-slot=progress-indicator]]:bg-emerald-500',
              )}
            />
          </div>
        )}

        {isEnrolled ? (
          <Button
            variant={isCompleted ? 'outline' : 'secondary'}
            className={cn(
              'w-full justify-center gap-2',
              isCompleted &&
                'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300',
            )}
            asChild
          >
            <Link href={href}>
              {isCompleted ? <CheckCircle2 /> : <Route />}
              {isCompleted ? 'Quest ansehen' : 'Weiterlernen'}
              <ChevronRight className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        ) : (
          <div className="w-full">
            <CourseEnrollButton courseId={id} />
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
