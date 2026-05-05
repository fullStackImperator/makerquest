'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BookOpen, Star} from 'lucide-react'
// import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getLevelName } from '@/lib/levelNames'

interface UserBadge {
  badge: {
    id: string
    name: string
    imageUrl: string
    createdAt?: Date
    updatedAt?: Date
  }
}

type SessionUser = {
  id: string
  name: string | null
  image: string | null
}

type UserScoreBannerProps = {
  usr: SessionUser
  userBadges: UserBadge[]
  allFaecher: { id: string; name: string }[]
  userFachExperience: {
    fachId: string
    experience: number
    level: number | null
  }[]
  totalXP: number
}

const fachIcons: Record<string, string> = {
  Mathe: '🧮',
  Biologie: '🧬',
  Deutsch: '📚',
  Englisch: '🗣️',
  Gesellschaft: '🌍',
  Informatik: '💻',
  Kunst: '🎨',
  Makerspace: '🛠️',
  'NW/T': '🔬',
  Physik: '⚛️',
}

export const UserScoreBanner = ({
  usr,
  userBadges,
  allFaecher,
  userFachExperience,
  totalXP,
}: UserScoreBannerProps) => {
  const userFachExperienceMap = userFachExperience.reduce(
    (acc, curr) => {
      acc[curr.fachId] = curr
      return acc
    },
    {} as Record<string, { experience: number; level: number | null }>,
  )

  const playerLevel = Math.floor(Math.sqrt(totalXP / 120))
  const playerLevelName = getLevelName(playerLevel)
  const currentLevelXP = 120 * playerLevel * playerLevel
  const nextLevelXP = 120 * (playerLevel + 1) * (playerLevel + 1)
  const progressToNextLevel =
    ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
  const xpToNextLevel = nextLevelXP - totalXP

  const displayName = usr.name ?? 'Anonym'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <Card className="panel p-4 max-w-6xl mx-auto shadow-lg">
      <CardHeader className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-10">
        <div className="flex items-center justify-between">
          <div className="relative">
            <Avatar className="w-36 h-36 border-2 border-red-600">
              <AvatarImage src={usr.image ?? undefined} alt={displayName} />
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <div className="absolute -top-2 -right-3 bg-green-500 text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-sm">
              {playerLevel}
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl">{displayName}</CardTitle>
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-medium">{playerLevelName}</span>
              <span className="text-lg font-bold text-green-600">
                Gesamtlevel {playerLevel}
              </span>
            </div>
            <div className="mt-2 w-80">
              <Progress value={progressToNextLevel} className="h-3" />
              <div className="flex justify-between items-center mt-1">
                <span className="text-base text-muted-foreground">
                  XP: {totalXP}
                </span>
                <span className="text-xs text-muted-foreground">
                  Level Up in: {xpToNextLevel} XP
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* <div className="flex items-center justify-between">
          <Button variant="default" className="ml-12">
            <Link
              href="/dashboard/userprofile"
              className="flex items-center justify-center text-sm w-full hover:opacity-75 transition"
            >
              <User className="mr-2 h-4 w-4" /> Benutzerprofil
            </Link>
          </Button>
          <Button
            className="flex items-center justify-center mr-6"
            variant="secondary"
          >
            <Link
              href="/dashboard/#finishedquests"
              className="flex items-center justify-center text-sm w-full hover:opacity-75 transition"
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Abgeschlossene Quests
            </Link>
          </Button>
        </div> */}
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <BookOpen className="mr-2 h-5 w-5" /> Fach-Meisterschaften
          </h3>
          <div className="grid gap-4">
            {allFaecher.map((fach) => {
              const data = userFachExperienceMap[fach.id]
              const experience = data?.experience ?? 0
              const level = data?.level ?? 1
              const currentLevelXP = 12 * level * level
              const nextLevelXP = 12 * (level + 1) * (level + 1)
              const levelProgress =
                ((experience - currentLevelXP) /
                  (nextLevelXP - currentLevelXP)) *
                100
              const xpToNextLevel = nextLevelXP - experience

              return (
                <Card
                  key={fach.id}
                  className="bg-card shadowhard border border-slate-500"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-medium flex items-center">
                        <span className="mr-2">{fachIcons[fach.name]}</span>
                        {fach.name}
                      </span>
                      <span className="text-base font-bold text-green-600">
                        Level {level}
                      </span>
                    </div>
                    <Progress value={levelProgress} className="h-2" />
                    <div className="flex justify-between mt-1">
                      <span className="text-base text-muted-foreground">
                        XP: {experience}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Level Up in: {xpToNextLevel} XP
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Star className="mr-2 h-5 w-5" /> Errungenschaften
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {userBadges.map((userBadge) => (
              <Link
                key={userBadge.badge.id}
                href={`/badges/${userBadge.badge.id}`}
              >
                <div className="badgeshadow w-[130px] h-[130px] text-center flex flex-col items-center transition ease-in-out delay-100 hover:cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:scale-105 rounded-lg p-2 bg-gradient-to-tr from-amber-200 to-yellow-500 border border-red-400">
                  <Avatar className="h-20 w-20 border border-white">
                    <AvatarImage
                      src={userBadge.badge.imageUrl}
                      alt={userBadge.badge.name}
                    />
                    <AvatarFallback>BG</AvatarFallback>
                  </Avatar>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {userBadge.badge.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
