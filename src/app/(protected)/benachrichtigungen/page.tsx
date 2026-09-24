import { Bell } from 'lucide-react'

import { getMyNotificationHistory } from '@/actions/notifications'
import { NotificationHistory } from '@/components/notifications/notification-history'

export default async function NotificationsPage() {
  const items = await getMyNotificationHistory()

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pb-16">
      <header className="flex items-start gap-3">
        <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Bell className="size-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Benachrichtigungen</h1>
          <p className="text-muted-foreground text-sm">Die letzten 100 Benachrichtigungen.</p>
        </div>
      </header>
      <NotificationHistory initial={items} />
    </section>
  )
}
