'use client'

import { useEffect, useState } from 'react'

/**
 * Renders children only after mount. Use to avoid hydration mismatches
 * for components that generate different markup on server vs client
 * (e.g. Radix UI auto-generated ids).
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <>{fallback}</>
  return <>{children}</>
}
