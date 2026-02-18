import { buttonVariants } from '@/components/ui/button'
import StarfieldBackground from '@/components/ui/Starfieldbackground'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { ReactNode } from 'react'
// import Logo from "@public/kkcz_logo.png"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center">
      <StarfieldBackground />

      <Link
        href="/"
        className={buttonVariants({
          variant: 'outline',
          className: 'absolute top-4 left-4',
        })}
      >
        <ArrowLeft className="size-4" /> Zurück
      </Link>

      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <Image src="/logo.png" alt="Logo" width={150} height={150} />
          {/* MakerQuest */}
        </Link>
        {children}

        <div className="text-balance text-center text-xs text-muted-foreground">
          Durch Klicken auf Fortfahren akzeptieren Sie unsere{' '}
          <span className="hover:text-primary hover:underline hover:cursor-pointer">
            AGB
          </span>{' '}
          und die {' '}
          <span className="hover:text-primary hover:underline hover:cursor-pointer ">
            Datenschutzerklärung
          </span>
          .
        </div>
      </div>
    </div>
  )
}
