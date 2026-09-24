import { redirect } from 'next/navigation'
import { UserCircle } from 'lucide-react'

import { getSessionUser } from '@/lib/get-session-user'
import { parseKlasse } from '@/lib/profile'
import { ProfileEditor } from './_components/profile-editor'

export default async function ProfilePage() {
  const user = await getSessionUser()
  if (!user) redirect('/')

  const { stufe, letter } = parseKlasse(user.klasse)

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pb-16">
      <header className="flex items-start gap-3">
        <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
          <UserCircle className="size-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mein Profil</h1>
          <p className="text-muted-foreground text-sm">
            So sehen dich Lehrkräfte und andere Schüler, z. B. in der Bestenliste.
          </p>
        </div>
      </header>
      <ProfileEditor
        dashboardHref={user.slug ? `/dashboard/${user.slug}` : '/'}
        email={user.email}
        initialName={user.name ?? ''}
        initialImage={user.image}
        initialStufe={stufe}
        initialLetter={letter}
        hasKlasse={!user.isTeacher && !user.isAdmin && !user.teacherRequestedAt}
      />
    </section>
  )
}
