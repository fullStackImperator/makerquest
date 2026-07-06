'use client'

import * as React from 'react'
import Link from 'next/link'
import { MoreHorizontal, Pencil, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ShareQuestDialog } from './share-quest-dialog'

interface QuestActionsCellProps {
  id: string
  title: string
  canManageShares: boolean
}

export function QuestActionsCell({
  id,
  title,
  canManageShares,
}: QuestActionsCellProps) {
  const [shareOpen, setShareOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-4 w-8 p-0">
            <span className="sr-only">Menü öffnen</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Link href={`/admin/quests/${id}`}>
            <DropdownMenuItem>
              <Pencil className="h-4 w-4 mr-2" />
              Inhalt bearbeiten
            </DropdownMenuItem>
          </Link>
          <Link href={`/admin/quests/${id}/grading`}>
            <DropdownMenuItem>
              <Pencil className="h-4 w-4 mr-2" />
              Punkte vergeben
            </DropdownMenuItem>
          </Link>
          <Link href={`/admin/quests/${id}/badges`}>
            <DropdownMenuItem>
              <Pencil className="h-4 w-4 mr-2" />
              Badges vergeben
            </DropdownMenuItem>
          </Link>
          {canManageShares && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  setShareOpen(true)
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                Für Lehrer freigeben
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {canManageShares && (
        <ShareQuestDialog
          courseId={id}
          courseTitle={title}
          open={shareOpen}
          onOpenChange={setShareOpen}
        />
      )}
    </>
  )
}
