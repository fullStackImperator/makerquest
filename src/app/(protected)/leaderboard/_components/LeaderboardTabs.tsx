'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  getLeaderboard,
  type LeaderboardUser,
} from '@/app/(protected)/leaderboard/_actions/get-leaderboard'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LeaderboardProps {
  allFaecher: { id: string; name: string }[]
}

export default function Leaderboard({ allFaecher }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [activeTab, setActiveTab] = useState<string>('total')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const updateLeaderboard = async () => {
      setLoading(true)
      try {
        const data = await getLeaderboard(
          activeTab === 'total' ? undefined : activeTab
        )
        setLeaderboard(data)
      } finally {
        setLoading(false)
      }
    }
    updateLeaderboard()
  }, [activeTab])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-center items-center gap-2">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex flex-col items-center"
        >
          <TabsList className="flex flex-wrap justify-center h-auto p-1 gap-1 bg-muted">
            <TabsTrigger value="total" className="px-4 py-2">
              Gesamtpunkte
            </TabsTrigger>
            {allFaecher.map((fach) => (
              <TabsTrigger
                key={fach.id}
                value={fach.id}
                className="px-4 py-2"
              >
                {fach.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <Separator />
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Lade Leaderboard…
        </div>
      ) : (
        <LeaderboardTable
          leaderboard={leaderboard}
          isTotal={activeTab === 'total'}
        />
      )}
    </div>
  )
}

function LeaderboardTable({
  leaderboard,
  isTotal = false,
}: {
  leaderboard: LeaderboardUser[]
  isTotal?: boolean
}) {
  let rank = 0

  return (
    <div className="w-full overflow-auto rounded-lg border border-border bg-card panel">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
            <TableHead className="rounded-tl-lg">Rang</TableHead>
            <TableHead>Avatar</TableHead>
            <TableHead>Schüler</TableHead>
            <TableHead>Klasse</TableHead>
            <TableHead>Punkte</TableHead>
            <TableHead className="rounded-tr-lg">Badges</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaderboard.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center py-12 text-muted-foreground"
              >
                Noch keine Punkte auf dem Leaderboard.
              </TableCell>
            </TableRow>
          ) : (
            leaderboard.map((user) => (
              <TableRow
                key={user.userId}
                className="border-border hover:bg-muted/30"
              >
                <TableCell className="font-medium">{++rank}.</TableCell>
                <TableCell>
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarImage
                      src={user.userImageUrl || '/icons/ninja.jpg'}
                      alt={user.userName || 'User Avatar'}
                    />
                    <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                      {user.userName?.slice(0, 2)?.toUpperCase() ?? '?'}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>{user.userName}</TableCell>
                <TableCell className="text-muted-foreground">
                  {user.userKlasse ?? '–'}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
                    {isTotal ? `${user.totalXP} XP` : `${user.fachXP} XP`}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    {user.badges.map((userBadge) => (
                      <Link
                        key={userBadge.id}
                        href={`/badges/${userBadge.id}`}
                        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                      >
                        <div
                          className={cn(
                            'flex flex-col items-center gap-1 rounded-lg border border-border bg-muted/30 p-2 w-20 transition',
                            'hover:bg-muted hover:shadow-md hover:scale-105 hover:-translate-y-0.5'
                          )}
                        >
                          <Avatar className="h-10 w-10 border border-border">
                            <AvatarImage
                              src={userBadge.imageUrl}
                              alt={userBadge.name}
                            />
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                              BG
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground text-center line-clamp-2">
                            {userBadge.name}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
