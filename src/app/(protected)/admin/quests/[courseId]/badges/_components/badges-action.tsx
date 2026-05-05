'use client'

import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Combobox } from '@/components/ui/combobox'
import { giveBadges } from '../_actions/give-badges'
import { deleteUserBadge } from '../_actions/delete-badges'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BadgeLoeschenModal } from '@/components/modals/badge-user-delete'

type Badge = {
  id: string
  name: string
  imageUrl: string
  createdAt?: Date
  updatedAt?: Date
}

interface BadgeActionsProps {
  courseId: string
  badges: Badge[]
  enrollmentWithBadges: {
    id: string
    courseId: string
    userId: string
    userName: string
    userBadges?:
      | {
          id?: string
          userId?: string
          badgeId?: string
          badge?: Badge
          createdAt?: Date
          updatedAt?: Date
        }[]
      | null
  }[]
  courseName?: string
  options: { label: string; value: string }[]
}

export const BadgeActions = ({
  courseId,
  badges,
  enrollmentWithBadges,
  courseName,
  options,
}: BadgeActionsProps) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedBadges, setSelectedBadges] = useState<{
    [userId: string]: string | null
  }>({})

  const handleBadgeChange = (value: string | null, userId: string) => {
    setSelectedBadges((prev) => ({ ...prev, [userId]: value ?? null }))
  }

  const onClick = async () => {
    try {
      setIsLoading(true)

      const updateData = Object.entries(selectedBadges).map(
        ([userId, badgeId]) => ({
          userId,
          badgeId,
        }),
      )

      const result = await giveBadges(courseId, updateData)
      if (!result.success) return toast.error(result.error)

      toast.success('Badges vergeben')
      setSelectedBadges({})
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  const onDelete = async (
    userId: string,
    badgeId: string,
    userBadgeId: string,
  ) => {
    try {
      setIsLoading(true)

      const result = await deleteUserBadge(courseId, userId, badgeId, userBadgeId)
      if (!result.success) return toast.error(result.error)

      toast.success('Erfolgreich vom Schüler gelöscht')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between align-middle">
        <Link
          href="/admin/quests"
          className="flex items-center text-sm hover:opacity-75 transition"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zur Kursübersicht
        </Link>
        <Button
          onClick={onClick}
          disabled={isLoading}
          variant="secondary"
          size="sm"
        >
          Badges übernehmen
        </Button>
      </div>
      <h1 className="p-6 mt-6 text-xl font-bold">Kurs: {courseName}</h1>
      <h4 className="pl-6 mb-4 text-muted-foreground">
        Badges für angemeldete Schüler vergeben
      </h4>
      <div className="space-y-4">
        <div className="flex flex-col relative gap-4 w-full">
          <div className="panel w-full p-4 z-0 flex flex-col relative justify-between gap-4 overflow-auto rounded-lg shadow-small">
            <Table className="min-w-full h-auto table-auto w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Schüler</TableHead>
                  <TableHead>Schüler Badges</TableHead>
                  <TableHead>Badge vergeben</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollmentWithBadges.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.userName}</TableCell>
                    <TableCell>
                      {student.userBadges?.length ? (
                        <div className="flex flex-wrap">
                          {student.userBadges.map((userBadge) => {
                            const badge = badges.find(
                              (b) => b.id === userBadge.badgeId,
                            )
                            return (
                              <BadgeLoeschenModal
                                onDelete={onDelete}
                                key={userBadge.id}
                                userId={student.userId}
                                badgeId={userBadge.badgeId!}
                                userBadgeId={userBadge.id!}
                              >
                                <div className="flex flex-col items-center mr-4 transition ease-in-out delay-100 hover:cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:scale-105 rounded-lg p-2 bg-orange-200 border border-red-400">
                                  <Avatar className="h-10 w-10 border border-white">
                                    <AvatarImage
                                      src={badge?.imageUrl}
                                      alt={badge?.name}
                                    />
                                    <AvatarFallback>BG</AvatarFallback>
                                  </Avatar>
                                  <span className="mt-1 text-xs text-muted-foreground">
                                    {badge?.name}
                                  </span>
                                </div>
                              </BadgeLoeschenModal>
                            )
                          })}
                        </div>
                      ) : (
                        'No badges'
                      )}
                    </TableCell>
                    <TableCell>
                      <Combobox
                        options={options}
                        value={selectedBadges[student.userId] || ''}
                        onChange={(value) =>
                          handleBadgeChange(value, student.userId)
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
