import { redirect } from 'next/navigation'
import { Clock } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { isApproved } from '@/lib/approval'
import { getSessionUserIncludingUnapproved } from '@/lib/get-session-user'
import { needsProfileCompletion } from '@/lib/profile'
import { SignOutButton } from './_components/sign-out-button'

/** Shown to accounts without a school address until a teacher or admin approves them. */
export default async function FreischaltungPage() {
  const user = await getSessionUserIncludingUnapproved()
  if (!user) redirect('/login')
  if (needsProfileCompletion(user)) redirect('/willkommen')
  if (isApproved(user)) redirect(user.slug ? `/dashboard/${user.slug}` : '/')

  return (
    <Card>
      <CardHeader className="text-center">
        <Clock className="mx-auto mb-2 size-8 text-muted-foreground" />
        <CardTitle className="text-xl">Freischaltung ausstehend</CardTitle>
        <CardDescription>
          Dein Konto ({user.email}) muss von einer Lehrkraft freigeschaltet werden, weil es
          keine Schul-E-Mail-Adresse ist. Schau später noch einmal vorbei.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <SignOutButton />
      </CardContent>
    </Card>
  )
}
