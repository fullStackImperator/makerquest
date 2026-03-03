import { AppSidebar } from '@/components/app-sidebar'
import { DynamicBreadcrumb } from '@/components/dynamic-breadcrumb'
import { NavUser } from '@/components/nav-user'
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

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  // Redirect to login if no session
  if (!session) {
    redirect('/')
  }

  // Get user's slug
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { slug: true },
  })

  return (
    <SidebarProvider>
      <AppSidebar userSlug={user.slug} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b justify-between px-4">
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
            <ThemeToggle />
            {/* User button in the right corner */}

            <NavUser user={session.user} />
          </div>
        </header>

        {/* Main content area - this is where page content will render */}
        <div className=" flex flex-1 flex-col gap-4 p-4 ">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
