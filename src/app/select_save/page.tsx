"use client"

import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import LoginCard from "@/components/ui/login-card"
import StarfieldBackground from "@/components/ui/Starfieldbackground"
import { Ghost } from "lucide-react"

type Mode = "signin" | "signup"

export default function login() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>("signin")

  return (
    <main className="min-h-screen">
      <StarfieldBackground />


      {/* Logo */}
      <div className="absolute top-1/5 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <Image src="/logo.png" alt="Logo" width={120} height={40} priority/>
      </div>

      {/* Content */}
      <section className="relative z-10 flex min-h-screen items-center justify-center px-10">
         <div className="flex gap-20">
          
          <div className="grid grid-cols-3 gap-30">
            <Button
              variant="ghost"
              className=" h-40 w-56
                rounded-2xl
                border-4 border-white
                bg-transparent
                text-xl font-bold tracking-widest
             hover:bg-white/10"
              onClick={() => {
                setMode("signup")
                setOpen(true)
              }}
            >
             New Game
            </Button>

            <Button
              variant="ghost"
              className=" h-40 w-56
                rounded-2xl
                border-4 border-white
                bg-transparent
                text-xl font-bold tracking-widest
             hover:bg-white/10"
              onClick={() => {
                setMode("signin")
                setOpen(true)
              }}
            >
              Load Game
            </Button>

            <Button
              variant="ghost"
               className=" h-40 w-56
                rounded-2xl
                border-4 border-white
                bg-transparent
                text-xl font-bold tracking-widest
             hover:bg-white/10"
              onClick={() => {
                setMode("signin")
                setOpen(true)
              }}
            >
             Coach Mode
            </Button>
          </div>
        </div>
      </section>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <LoginCard
            mode={mode}
            onClose={() => setOpen(false)}
            onSwitchMode={setMode}
          />
        </div>
      )}
    </main>
  )
}
