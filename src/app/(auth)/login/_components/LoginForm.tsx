'use client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'
import { GithubIcon, Loader, Loader2, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isEmailPending, startEmailTransition] = useTransition()
  const [githubPending, startGithubTransition] = useTransition()

   function signInWithGithub() {
    startGithubTransition(async () => {
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: '/login',
        fetchOptions: {
          onSuccess: () => {
            toast.success('Signin mit Github, du wirst weitergeleitet.')
          },
          onError: () => {
            toast.error('Internal Server Error')
          },
        },
      })
    })
  }

  function signInWithEmail() {
    startEmailTransition(async () => {
      await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: 'sign-in',
        fetchOptions: {
          onSuccess: () => {
            toast.success('Email gesendet')
            router.push(`/anmeldung-bestaetigen?email=${email}`)
          },
          onError: () => {
            toast.error('Fehler beim senden der Email')
          },
        },
      })
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Willkommen zurück</CardTitle>
        <CardDescription>Login mit Github oder deiner Email</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <Button
          disabled={githubPending}
          onClick={signInWithGithub}
          className="w-full"
          variant="outline"
        >
          {githubPending ? (
            <>
              <Loader className="size-4 animate-spin" />
              <span>Loading...</span>
            </>
          ): (
          <>
            <GithubIcon className="size-4" />
            Sign in with Github
          </>
          )

          }
        </Button>

        <div
          className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 
        after:z-0 after:flex after:items-center after:border-t after:border-border  "
        >
          <span className="relative z-10 bg-card px-2 text-muted-foreground">
            {' '}
            oder
          </span>
        </div>

        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="deine@email.de"
              required
            ></Input>
          </div>
        </div>

        <Button onClick={signInWithEmail} disabled={isEmailPending}>
          {isEmailPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <Send className="size-4" />
              <span>Mit Email fortfahren</span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
