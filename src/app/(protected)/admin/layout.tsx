import { getSessionUser } from '@/lib/get-session-user'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()

  if (!user) {
    redirect('/')
  }

  const canAccessAdmin = user.isTeacher === true || user.isAdmin === true
  if (!canAccessAdmin) {
    redirect(user.slug ? `/dashboard/${user.slug}` : '/')
  }

  return <>{children}</>
}
