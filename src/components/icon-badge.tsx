import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IconBadgeProps {
  icon: LucideIcon
  className?: string
  size?: 'sm' | 'default'
}

export function IconBadge({ icon: Icon, className, size = 'default' }: IconBadgeProps) {
  return (
    <div
      className={cn(
        'rounded-full bg-primary/10 text-primary flex items-center justify-center',
        size === 'sm' && 'h-8 w-8',
        size === 'default' && 'h-10 w-10',
        className
      )}
    >
      <Icon className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
    </div>
  )
}
