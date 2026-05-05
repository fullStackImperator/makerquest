'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Award } from 'lucide-react'
import BadgeList from './badges-list'
import BadgesDialog from './badges-dialog'

type Badge = {
  id: string
  name: string
  imageUrl: string
  createdAt: Date
  updatedAt: Date
}

interface CreateBadgesClientProps {
  badges: Badge[]
}

const CreateBadgesClient = ({ badges }: CreateBadgesClientProps) => {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')

  const handleOpenDialog = (badge: Badge) => {
    setSelectedBadge(badge)
    setDialogMode('edit')
  }

  const handleCloseDialog = () => {
    setSelectedBadge(null)
    setDialogMode('create')
  }

  return (
    <div className="max-w-5xl mx-auto mt-8 flex flex-col md:items-center md:justify-center p-6">
      <div className="text-center mb-8">
        <span className="justify-center flex mb-8">
          <Award className="h-12 w-12" />
        </span>
        <h1 className="text-2xl text-center">Erstelle einen Badge</h1>
        <p className="mt-1 text-sm text-slate-600 text-center">
          Der Badge kann anschliessend{' '}
          <Link href="/teacher/courses" className="underline">
            {' '}
            in den Projekten{' '}
          </Link>
          an Schüler vergeben werden
        </p>
        <BadgesDialog
          open={!!selectedBadge}
          onClose={handleCloseDialog}
          badgeData={selectedBadge || undefined}
          mode={dialogMode}
        />
      </div>
      <p className="text-sm text-slate-600 text-center mt-8">
        Vorhandene Badges
      </p>
      <p className="text-xs text-slate-600 text-center mb-4">
        (Klicke auf einen Badge um ihn zu bearbeiten)
      </p>
      <BadgeList badges={badges} onOpenDialog={handleOpenDialog} />
    </div>
  )
}

export default CreateBadgesClient
