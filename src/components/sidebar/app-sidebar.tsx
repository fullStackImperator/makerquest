'use client'

import * as React from 'react'
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  LayoutDashboard,
  Route,
  Trophy,
  Award,
  Wrench,
  BowArrow,
} from 'lucide-react'

import { NavMain } from '@/components/sidebar/nav-main'
import { NavProjects } from '@/components/sidebar/nav-projects'
import { NavSecondary } from '@/components/sidebar/nav-secondary'
import { NavUser } from '@/components/sidebar/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import Image from 'next/image'

// const data = {
//   user: {
//     name: 'shadcn',
//     email: 'm@example.com',
//     avatar: '/avatars/shadcn.jpg',
//   },
//   navMain: [
//     {
//       title: 'Playground',
//       url: '#',
//       icon: SquareTerminal,
//       isActive: true,
//       items: [
//         {
//           title: 'History',
//           url: '#',
//         },
//         {
//           title: 'Starred',
//           url: '#',
//         },
//         {
//           title: 'Settings',
//           url: '#',
//         },
//       ],
//     },
//     {
//       title: 'Models',
//       url: '#',
//       icon: Bot,
//       items: [
//         {
//           title: 'Genesis',
//           url: '#',
//         },
//         {
//           title: 'Explorer',
//           url: '#',
//         },
//         {
//           title: 'Quantum',
//           url: '#',
//         },
//       ],
//     },
//     {
//       title: 'Documentation',
//       url: '#',
//       icon: BookOpen,
//       items: [
//         {
//           title: 'Introduction',
//           url: '#',
//         },
//         {
//           title: 'Get Started',
//           url: '#',
//         },
//         {
//           title: 'Tutorials',
//           url: '#',
//         },
//         {
//           title: 'Changelog',
//           url: '#',
//         },
//       ],
//     },
//     {
//       title: 'Settings',
//       url: '#',
//       icon: Settings2,
//       items: [
//         {
//           title: 'General',
//           url: '#',
//         },
//         {
//           title: 'Team',
//           url: '#',
//         },
//         {
//           title: 'Billing',
//           url: '#',
//         },
//         {
//           title: 'Limits',
//           url: '#',
//         },
//       ],
//     },
//   ],
//   navSecondary: [
//     {
//       title: 'Support',
//       url: '#',
//       icon: LifeBuoy,
//     },
//     {
//       title: 'Feedback',
//       url: '#',
//       icon: Send,
//     },
//   ],
//   projects: [
//     {
//       name: 'Dashboard',
//       url: `/dashboard/${userSlug}`,
//       icon: LayoutDashboard,
//     },
//     {
//       name: 'Lernpfade',
//       url: '#',
//       icon: Route,
//     },
//     {
//       name: 'Quests',
//       url: '#',
//       icon: BowArrow,
//     },
//     {
//       name: 'Erfolge',
//       url: '#',
//       icon: Award,
//     },
//     {
//       name: 'Leaderboard',
//       url: '#',
//       icon: Trophy,
//     },
//     {
//       name: 'Tools',
//       url: '#',
//       icon: Wrench,
//     },
//     {
//       name: 'Admin',
//       url: '/admin',
//       icon: Wrench,
//     },
//   ],
// }

export function AppSidebar({
  userSlug,
  ...props
}: React.ComponentProps<typeof Sidebar> & { userSlug: string }) {
  const projects = [
    {
      name: 'Dashboard',
      url: `/dashboard/${userSlug}`,
      icon: LayoutDashboard,
    },
    {
      name: 'Lernpfade',
      url: `/lernpfade/${userSlug}`,
      icon: Route,
    },
    {
      name: 'Quests',
      url: '/quests',
      icon: BowArrow,
    },
    {
      name: 'Badges',
      url: '/badges',
      icon: Award,
    },
    {
      name: 'Leaderboard',
      url: '/leaderboard',
      icon: Trophy,
    },
    {
      name: 'Tools',
      url: '#',
      icon: Wrench,
    },
    {
      name: 'Admin',
      url: '/admin',
      icon: Wrench,
    },
  ]

  const navSecondary = [
    {
      title: 'Support',
      url: '#',
      icon: LifeBuoy,
    },
    {
      title: 'Feedback',
      url: '#',
      icon: Send,
    },
  ]

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="">
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  {/* <Command className="size-4" /> */}
                  <Image
                    src="/logo_schrift.jpg"
                    alt="Logo"
                    width={320}
                    height={32}
                    priority
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">MakerQuest</span>
                  <span className="truncate text-xs">maken und lernen</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* <NavMain items={data.navMain} /> */}
        <NavProjects projects={projects} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      {/* <SidebarFooter>
        <NavUser user={data.user} />
        </SidebarFooter> */}
    </Sidebar>
  )
}
