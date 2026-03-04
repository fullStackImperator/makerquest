import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";


type CourseProgressProps = {
  value: number | null
  variant?: 'default' | 'success' | 'black'
  size?: 'default' | 'sm' | 'md'
}

const colorByVariant = {
    default: "text-sky-700",
    success: "text-emerald-700",
    black: "text-black-800",
}

const sizeByVariant = {
    default: "text-sm",
    sm: "text-xs",
    md: "text-md",
}

export const CourseProgress = ({
    value,
    variant,
    size,
}: CourseProgressProps) => {
    return (
      <div>
        <Progress className="h-1" value={value} />
        <p
          className={cn(
            'font-medium mt-2 text-sky-700',
            colorByVariant[variant || 'default'],
            sizeByVariant[size || 'default']
          )}
        >
          {typeof value === 'number' ? `${Math.round(value)}% Fortschritt` : ''}
        </p>
      </div>
    )
}