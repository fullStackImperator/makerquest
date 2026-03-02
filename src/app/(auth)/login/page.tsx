// 'use client'

// import React, { useTransition } from 'react'
import { LoginForm } from './_components/LoginForm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function LoginPage() {


  // const [isPending, startTransition] = useTransition()
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  console.log('SESSION: ', { session })

  // if(session) {
  //     return redirect(`/dashboard/${session.user.slug}`)
  // }

  if (session) {
    // Fetch the user's slug from the database
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { slug: true },
    })

    if (user?.slug) {
      console.log('IN USER SLUG!!')
      return redirect(`/dashboard/${user.slug}`)
    }
  }

  return <LoginForm />
}
