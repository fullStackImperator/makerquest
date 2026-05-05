'use client'

const SplashScreen: React.FC<{ title?: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => {
  return (
    <div className="splash-screen">
      <div className="splash-screen-content flex flex-col items-center gap-2 text-center">
        {title && (
          <span className="text-sm font-medium uppercase tracking-wide text-foreground">
            {title}
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        )}
      </div>
    </div>
  )
}
export default SplashScreen
