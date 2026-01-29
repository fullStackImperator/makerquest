'use client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { authClient } from '@/lib/auth-client'
import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

export default function VerifyRequest() {
  const router = useRouter()
  const [otp, setOtp] = useState('')
  const [isEmailPending, startTransition] = useTransition()
  const isOtpCompleated = otp.length === 6
  const params = useSearchParams()
  const email = params.get('email') as string

  function verifyOtp() {
    startTransition(async () => {
      await authClient.signIn.emailOtp({
        email: email,
        otp: otp,
        fetchOptions: {
          onSuccess: () => {
            toast.success('Email bestätigt')
            router.push('/')
          },
          onError: () => {
            toast.error('Fehler. Email konnte nicht bestätigt werden')
          },
        },
      })
    })
  }

  return (
    <Card className="w-full mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Schaue in deinen Emails nach</CardTitle>
        <CardDescription>
          {' '}
          Wir haben dir eine Bestätigungsemail mit einem Code geschickt. Bitte
          öffne die Email, kopiere den Code und füge ihn unten ein.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <InputOTP
            maxLength={6}
            className="gap-2"
            value={otp}
            onChange={(value) => setOtp(value)}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <p className="text-sm text-muted-foreground">
            Gebe den 6-stelligen Code aus Ihrer E-Mail ein.
          </p>
        </div>
        <Button
          className="w-full"
          onClick={verifyOtp}
          disabled={isEmailPending || !isOtpCompleated}
        >
          {isEmailPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            'Bestätigen'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
