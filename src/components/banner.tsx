import { cn } from '@/lib/utils'
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader } from './ui/card'

interface BannerProps {
  variant?: 'warning' | 'success' | 'destructive'
  label: string
  className?: string
}

const icons = {
  warning: AlertTriangle,
  success: CheckCircle,
  destructive: AlertCircle,
}

export function Banner({ variant = 'warning', label, className }: BannerProps) {
  const Icon = icons[variant]

  return (
    <Card
      className={cn(
        'rounded-lg border p-4 text-sm font-medium flex items-center gap-2',
        variant === 'warning' &&
          'border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-200',
        variant === 'success' &&
          'border-green-500/50 bg-green-500/10 text-green-800 dark:text-green-200',
        variant === 'destructive' &&
          'border-destructive/50 bg-destructive/10 text-destructive',
        className,
      )}
    >
      <CardHeader>
        <Icon className="h-4 w-4 shrink-0" />
      </CardHeader>
      <CardContent>{label}</CardContent>
    </Card>
  )
}
