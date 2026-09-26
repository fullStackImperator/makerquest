'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { approveUser } from '../_actions/approve-user'

export function ApproveUserButton({ userId }: { userId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      size="sm"
      className="gap-1.5"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await approveUser(userId)
          if (!result.success) return void toast.error(result.error)
          toast.success('Nutzer freigeschaltet')
          router.refresh()
        })
      }
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
      Freischalten
    </Button>
  )
}
