import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Wrench } from 'lucide-react'
import { CourseProgress } from '@/components/quests/course-progress'
import { CourseEnrollButton } from '@/components/quests/course-enroll-button'
import { CARD_INNER, FONT, TEXT } from './glass-styles'

type CourseCardProps = {
  id: string
  title: string
  description: string
  imageUrl: string
  chaptersLength: number
  schwierigkeit: string
  progress?: number | null
  categories: string[] | undefined
  faecher: string[] | undefined
  prerequisites: string
  vorkenntnisse: string
  kompetenzen: string
}

function schwierigkeitStyle(s: string): { color: string; bg: string; border: string } {
  const l = s.toLowerCase()
  if (l.includes('anfänger') || l.includes('anfaenger') || l === 'easy')
    return { color: '#047857', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.25)' }
  if (l.includes('fortgeschritten') || l === 'medium')
    return { color: '#b45309', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.25)' }
  if (l.includes('pro') || l.includes('experte') || l === 'hard')
    return { color: '#b91c1c', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)' }
  return { color: '#4e6878', bg: 'rgba(100,160,220,0.08)', border: 'rgba(100,160,220,0.18)' }
}

export const CourseCard = ({
  id,
  title,
  description,
  imageUrl,
  chaptersLength,
  schwierigkeit,
  progress,
  faecher,
}: CourseCardProps) => {
  return (
    <Link href={`/quests/${id}`}>
      <div
        className="group relative h-full flex flex-col overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
        style={CARD_INNER}
      >
        {/* Thumbnail */}
        <div className="relative w-full aspect-video overflow-hidden" style={{ borderRadius: '12px 12px 0 0' }}>
          <Image
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            alt={title}
            src={imageUrl}
          />
          {schwierigkeit && (() => {
            const sp = schwierigkeitStyle(schwierigkeit)
            return (
              <div
                className="absolute top-2 right-2 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ color: sp.color, background: 'rgba(255,255,255,0.92)', border: `1px solid ${sp.border}`, fontFamily: FONT }}
              >
                {schwierigkeit}
              </div>
            )
          })()}

          {faecher && faecher.length > 0 && (
            <div className="absolute bottom-2 left-2 flex gap-1">
              {faecher.slice(0, 2).map((fach, i) => (
                <span
                  key={i}
                  className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.90)', color: '#459ea1', border: '1px solid rgba(69,158,161,0.20)', fontFamily: FONT }}
                >
                  {fach}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-3.5 gap-2">
          <h3
            className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-[#459ea1] transition-colors"
            style={{ color: TEXT.primary, fontFamily: FONT }}
          >
            {title}
          </h3>

          {description && (
            <p className="text-xs line-clamp-2 flex-1" style={{ color: TEXT.muted }}>{description}</p>
          )}

          <div
            className="mt-auto pt-3 flex items-center justify-between text-[10px]"
            style={{ color: TEXT.faint, borderTop: '1px solid rgba(180,210,225,0.25)', fontFamily: FONT }}
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-3 w-3" />
              {chaptersLength} Kapitel
            </span>
            {schwierigkeit && (
              <span className="flex items-center gap-1.5">
                <Wrench className="h-3 w-3" />
                {schwierigkeit}
              </span>
            )}
          </div>

          <div className="mt-1">
            {progress !== null
              ? <CourseProgress variant={progress === 100 ? 'success' : 'default'} size="sm" value={progress!} />
              : <CourseEnrollButton courseId={id} />
            }
          </div>
        </div>
      </div>
    </Link>
  )
}
