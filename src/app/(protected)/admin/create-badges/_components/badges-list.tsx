'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type Badge = {
  id: string
  name: string
  imageUrl: string
  createdAt: Date
  updatedAt: Date
}

interface BadgeListProps {
  badges: Badge[]
  onOpenDialog: (badge: Badge) => void
}

const BadgeList = ({ badges, onOpenDialog }: BadgeListProps) => {
  if (!badges.length) {
    return (
      <p className="text-sm text-slate-500 italic">Keine Badges vorhanden</p>
    )
  }

  return (
    <div className="flex flex-wrap justify-center">
      {badges.map((badge) => (
        <div
          key={badge.id}
          className="m-4 text-center flex flex-col items-center transition ease-in-out delay-100 hover:cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:scale-105 rounded-lg p-2 bg-gradient-to-tr from-amber-200 to-yellow-500 border border-red-400"
          onClick={() => onOpenDialog(badge)}
        >
          <Avatar className="h-20 w-20 border-2 border-white">
            <AvatarImage src={badge.imageUrl} alt={badge.name} />
            <AvatarFallback>BG</AvatarFallback>
          </Avatar>
          <p className="mt-2 text-muted-foreground text-sm">{badge.name}</p>
        </div>
      ))}
    </div>
  )
}

export default BadgeList
