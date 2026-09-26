import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { DynamicBreadcrumb } from '@/components/sidebar/dynamic-breadcrumb'
import { NavUser } from '@/components/sidebar/nav-user'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/themeToggle'
import { ClientOnly } from '@/components/ui/client-only'
import { needsProfileCompletion } from '@/lib/profile'
import { isApproved } from '@/lib/approval'
import { getMyNotifications } from '@/actions/notifications'
import { NotificationsProvider } from '@/components/notifications/notifications-provider'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { AccountNotices } from '@/components/notifications/account-notices'

export async function SidebarAppShell({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/')
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      slug: true,
      isTeacher: true,
      isAdmin: true,
      name: true,
      klasse: true,
      teacherRequestedAt: true,
      approvedAt: true,
    },
  })

  // Name (and Klasse for students) is required before using the app.
  if (!user || needsProfileCompletion(user)) {
    redirect('/willkommen')
  }

  // Non-school accounts wait for a teacher or admin to approve them.
  if (!isApproved(user)) {
    redirect('/freischaltung')
  }

  const isAdminOrTeacher = user?.isTeacher === true || user?.isAdmin === true

  const notifications = await getMyNotifications()

  const dateStr = new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <NotificationsProvider initial={notifications}>
      <SidebarProvider>
        <AppSidebar
          userSlug={user?.slug ?? ''}
          isAdminOrTeacher={isAdminOrTeacher}
        />

        {/* Glass panel: blurs the body gradient behind it for an Apple-style frosted surface */}
        <SidebarInset
          className="overflow-clip"
          style={{
            background: 'linear-gradient(175deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.18) 100%)',
            backdropFilter: 'blur(32px) saturate(160%)',
            WebkitBackdropFilter: 'blur(32px) saturate(160%)',
          }}
        >

          {/* Header — transparent so it blends with the main gradient */}
          <header className="flex h-14 shrink-0 items-center gap-2 justify-between border-b border-white/30 px-5">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <DynamicBreadcrumb
                userEmail={session.user.email}
                userSlug={user?.slug || undefined}
              />
            </div>

            <div className="flex items-center gap-4">
              {/* Date — right-aligned, capitalised */}
              <span
                className="hidden md:block text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: '#459ea1', fontFamily: 'var(--font-jakarta)' }}
              >
                {dateStr}
              </span>

              <ClientOnly
                fallback={<div className="flex min-h-10 min-w-28 items-center gap-2" aria-hidden />}
              >
                <div className="flex items-center gap-2">
                  <NotificationBell />
                  <ThemeToggle />
                  <NavUser user={session.user} />
                </div>
              </ClientOnly>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
            <AccountNotices />
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </NotificationsProvider>
  )
}
