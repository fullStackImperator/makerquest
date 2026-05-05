import { SidebarAppShell } from '@/components/layout/sidebar-app-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SidebarAppShell>{children}</SidebarAppShell>
}
