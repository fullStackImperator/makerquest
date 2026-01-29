'use client'
import { Button } from '@/components/ui/button'
import StarfieldBackground from '@/components/ui/Starfieldbackground'
import { ThemeToggle } from '@/components/ui/themeToggle'
import { authClient } from '@/lib/auth-client'
import { Rocket } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'
// import { auth } from '@/lib/auth'
// import { headers } from 'next/headers'
// import Image from 'next/image'

export default function Home() {
  const router = useRouter()
  const {
    data: session,
    // isPending, //loading state
    // error, //error object
    // refetch, //refetch the session
  } = authClient.useSession()
  // for server component
  // const session = await auth.api.getSession({
  //     headers: await headers(),
  //   })


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        router.push('/login')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])



  async function signOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/') // redirect to login page
          toast.success("Erfolgreich abgemeldet")
        },
      },
    })
  }

  return (
    <main className="min-h-screen">
      <StarfieldBackground />

      {/* Logo */}
      <div className="absolute top-2/5 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <Image src="/logo.png" alt="Logo" width={540} height={180} priority />
      </div>

      {/* Content */}
      {session ? (
        <section className="relative z-10 flex min-h-screen items-center px-8">
          <div className="max-w-xl">
            <div className=" border border-2 p-2 absolute top-4/5 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <Link
                href="/login"
                className="flex flex-col items-center gap-2 group"
              >
                {/* <Rocket className="w-12 h-12 text-cyan-400 group-hover:text-cyan-300 transition-colors" /> */}
                <p className="retro-blink text-cyan-400 text-sm md:text-base tracking-wider uppercase text-center">
                  Drücke die Leertaste zum Start
                </p>
              </Link>
            </div>
          </div>
          <div>
            <p>{session.user.email}</p>
            <Button onClick={signOut} size="sm" variant="outline">
              Logout
            </Button>
          </div>
        </section>
      ) : (
        <section className="relative z-10 flex min-h-screen items-center px-8">
          <div className="max-w-xl">
            <div className="absolute top-4/5 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <Link
                href="/login"
                className="flex flex-col items-center gap-2 group"
              >
                {/* <Rocket className="w-12 h-12 text-cyan-400 group-hover:text-cyan-300 transition-colors" /> */}
                <Button className="hover:cursor-pointer p-8">
                  <p className="retro-blink text-cyan-400 text-sm md:text-base tracking-wider uppercase text-center">
                    Drücke die Leertaste zum Start
                  </p>
                </Button>
              </Link>
            </div>
          </div>
          {/* <div> */}
          {/* <p>{session.user.name}</p> */}
          {/* <Button onClick={signOut}>Logout</Button> */}
          {/* <Button>Login</Button> */}
          {/* </div> */}
        </section>
      )}
    </main>

    // <div>
    //   <h1 className="text-red-500">Hello World</h1>
    //   <ThemeToggle />

    //   {session ? (
    //     <div>
    //       <p>{session.user.name}</p>
    //       <Button onClick={signOut}>Logout</Button>
    //     </div>
    //   ) : (
    //     <Button>Login</Button>
    //   )}
    // </div>
  )
}
