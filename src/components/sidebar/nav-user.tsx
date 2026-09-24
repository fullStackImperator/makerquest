'use client'

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  User,
} from 'lucide-react'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useNotifications } from '@/components/notifications/notifications-provider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    image?: string | null
  }
}) {
  const router = useRouter()
  const notifications = useNotifications()

  const handleLogout = async () => {
    await authClient.signOut()
    toast.success('Erfolgreich abgemeldet')
    router.push('/')
  }

  // Generate initials from name or email
  const getInitials = () => {
    if (user.name && user.name.trim().length > 0) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user.email.slice(0, 2).toUpperCase()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-auto p-2"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage
              src={user.image || undefined}
              alt={user.name || user.email}
            />
            <AvatarFallback className="rounded-lg">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight ml-2">
            <span className="truncate font-medium">
              {user.name || 'Benutzer'}
            </span>
            <span className="truncate text-xs">{user.email}</span>
          </div>
          <ChevronsUpDown className="ml-auto size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage
                src={user.image || undefined}
                alt={user.name || user.email}
              />
              <AvatarFallback className="rounded-lg">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {user.name || 'Benutzer'}
              </span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* <DropdownMenuGroup>
          <DropdownMenuItem>
            <Sparkles />
            Upgrade to Pro
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator /> */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profil">
              <User />
              Mein Profil
            </Link>
          </DropdownMenuItem>
          {/* <DropdownMenuItem>
            <CreditCard />
            Abrechnung
          </DropdownMenuItem> */}
          <DropdownMenuItem asChild>
            <Link href="/benachrichtigungen">
              <Bell />
              Benachrichtigungen
              {!!notifications?.unread && (
                <span className="ml-auto rounded-full bg-rose-500 px-1.5 text-[10px] font-bold leading-4 text-white tabular-nums">
                  {notifications.unread > 99 ? '99+' : notifications.unread}
                </span>
              )}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut />
          Abmelden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
