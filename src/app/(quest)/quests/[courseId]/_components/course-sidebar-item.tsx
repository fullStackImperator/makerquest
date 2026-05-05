'use client'

import { cn } from '@/lib/utils'
import { CheckCircle, Lock, PlayCircle } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

type CourseSidebarItemProps = {
  index: number
  label: string
  id: string
  isCompleted: boolean
  courseId: string
  isLocked: boolean
}

export const CourseSidebarItem = ({
  index,
  label,
  id,
  isCompleted,
  courseId,
  isLocked,
}: CourseSidebarItemProps) => {
  const pathname = usePathname()
  const router = useRouter()

  const Icon = isLocked ? Lock : isCompleted ? CheckCircle : PlayCircle
  const isActive = pathname?.includes(id)

  const onClick = () => {
    router.push(`/quests/${courseId}/chapters/${id}`)
  }

  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        'border-border/30 hover:bg-muted/50 flex w-full items-stretch gap-0 border-b text-left text-sm transition-colors',
        isActive && 'bg-muted/60',
        isCompleted && !isActive && 'bg-emerald-500/4',
      )}
    >
      <div
        className={cn(
          'w-1 shrink-0 bg-transparent transition-colors',
          isActive && 'bg-primary',
          isCompleted && 'bg-emerald-600',
        )}
      />
      <div className="flex min-w-0 flex-1 items-center gap-2.5 py-3 pl-3 pr-2">
        <span
          className={cn(
            'text-muted-foreground w-6 shrink-0 text-center font-mono text-xs tabular-nums',
            isActive && 'text-foreground font-medium',
          )}
        >
          {index}.
        </span>
        <Icon
          className={cn(
            'size-4 shrink-0 text-muted-foreground',
            isActive && 'text-foreground',
            isCompleted && 'text-emerald-600',
          )}
        />
        <span
          className={cn(
            'min-w-0 flex-1 truncate font-medium text-foreground/90',
            isLocked && 'text-muted-foreground',
          )}
        >
          {label}
        </span>
      </div>
    </button>
  )
}
