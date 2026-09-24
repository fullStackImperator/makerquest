import { redirect } from 'next/navigation'

import { getSessionUser } from '@/lib/get-session-user'
import { needsProfileCompletion, parseKlasse } from '@/lib/profile'
import { ProfileForm } from './_components/profile-form'

export default async function WillkommenPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  if (!needsProfileCompletion(user)) {
    redirect(user.slug ? `/dashboard/${user.slug}` : '/')
  }

  const { stufe, letter } = parseKlasse(user.klasse)

  return (
    <ProfileForm
      email={user.email}
      initialName={user.name?.trim() ?? ''}
      isStaff={user.isTeacher === true || user.isAdmin === true}
      initialStufe={stufe}
      initialLetter={letter}
    />
  )
}
