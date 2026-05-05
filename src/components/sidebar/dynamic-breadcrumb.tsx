'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { getBreadcrumbLabels } from '@/actions/get-breadcrumb-labels'

const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Admin',
  'create-badges': 'Create Badges',
  quests: 'Quests',
  chapters: 'Chapters',
  create: 'New quest',
  users: 'Users',
  badges: 'Badges',
  grading: 'Grading',
  dashboard: 'Dashboard',
  lernpfade: 'Lernpfade',
  leaderboard: 'Leaderboard',
}

function looksLikeId(segment: string): boolean {
  return /^[a-zA-Z0-9_-]{10,}$/.test(segment) || /^[0-9a-f-]{36}$/i.test(segment)
}

function getDefaultLabel(segment: string, index: number, segments: string[]): string {
  if (SEGMENT_LABELS[segment] !== undefined) {
    return SEGMENT_LABELS[segment]
  }
  if (looksLikeId(segment)) {
    if (
      segments[0] === 'admin' &&
      segments[1] === 'quests' &&
      index === 2
    ) {
      return 'Course'
    }
    if (
      segments[0] === 'admin' &&
      segments[1] === 'quests' &&
      segments[3] === 'chapters' &&
      index === 4
    ) {
      return 'Chapter'
    }
  }
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

interface DynamicBreadcrumbProps {
  userEmail?: string
  userSlug?: string
}

export function DynamicBreadcrumb({
  userEmail,
  userSlug,
}: DynamicBreadcrumbProps) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  const [labelOverrides, setLabelOverrides] = useState<Record<number, string>>({})

  useEffect(() => {
    let cancelled = false
    getBreadcrumbLabels(pathname).then((overrides) => {
      if (!cancelled) {
        setLabelOverrides(overrides)
      }
    })
    return () => {
      cancelled = true
    }
  }, [pathname])

  const breadcrumbItems = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const isLast = index === segments.length - 1

    let label: string
    if (
      index === 1 &&
      userEmail &&
      segments[0] === 'dashboard' &&
      segment === userSlug
    ) {
      label = userEmail
    } else if (labelOverrides[index] !== undefined) {
      label = labelOverrides[index]
    } else {
      label = getDefaultLabel(segment, index, segments)
    }

    let finalHref = href
    if (index === 0 && segment === 'dashboard' && userSlug) {
      finalHref = `/dashboard/${userSlug}`
    }

    return { href: finalHref, label, isLast, segment, index }
  })

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <div key={`${item.index}-${item.segment}`} className="contents">
            {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
            <BreadcrumbItem className={index === 0 ? 'hidden md:block' : ''}>
              {item.isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
