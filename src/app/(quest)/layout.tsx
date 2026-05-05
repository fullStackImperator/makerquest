import { SidebarAppShell } from '@/components/layout/sidebar-app-shell'

export default async function QuestGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SidebarAppShell>{children}</SidebarAppShell>
}
