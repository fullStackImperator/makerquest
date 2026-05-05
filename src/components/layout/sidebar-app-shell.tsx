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
    select: { slug: true, isTeacher: true, isAdmin: true },
  })

  const isAdminOrTeacher = user?.isTeacher === true || user?.isAdmin === true

  return (
    <SidebarProvider>
      <AppSidebar
        userSlug={user?.slug ?? ''}
        isAdminOrTeacher={isAdminOrTeacher}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 justify-between border-b px-4">
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

          <div>
            <ClientOnly
              fallback={
                <div
                  className="flex min-h-10 min-w-28 items-center gap-2"
                  aria-hidden
                />
              }
            >
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <NavUser user={session.user} />
              </div>
            </ClientOnly>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
