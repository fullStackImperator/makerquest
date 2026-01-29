// 'use client'

// import React, { useTransition } from 'react'
import { LoginForm } from './_components/LoginForm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
    // const [isPending, startTransition] = useTransition()
    const session = await auth.api.getSession({
        headers: await headers()
    })
    
    if(session) {
        return redirect("/")
    }
  return (
    <LoginForm />
  )
}
