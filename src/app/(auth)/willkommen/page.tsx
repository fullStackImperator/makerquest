import { redirect } from 'next/navigation'

import { getSessionUser } from '@/lib/get-session-user'
import { isNameBlocked } from '@/lib/name-policy'
import { needsProfileCompletion, parseKlasse } from '@/lib/profile'
import { ProfileForm } from './_components/profile-form'

export default async function WillkommenPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  if (!needsProfileCompletion(user)) {
    redirect(user.slug ? `/dashboard/${user.slug}` : '/')
  }

  const { stufe, letter } = parseKlasse(user.klasse)
  const nameRejected = isNameBlocked(user.name)

  return (
    <ProfileForm
      email={user.email}
      initialName={nameRejected ? '' : (user.name?.trim() ?? '')}
      nameRejected={nameRejected}
      isStaff={user.isTeacher === true || user.isAdmin === true}
      initialStufe={stufe}
      initialLetter={letter}
    />
  )
}
