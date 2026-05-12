'use client'

import { $getSelection, $setSelection, type LexicalEditor } from 'lexical'
import { memo, useEffect, useState } from 'react'
import { SET_DIALOGS_COMMAND } from './commands'
import useFixedBodyScroll from '../../../../hooks/useFixedBodyScroll'
import { INSERT_YOUTUBE_COMMAND } from '../../YouTubePlugin'
import { $isYouTubeNode, type YouTubeNode } from '../../../nodes/YouTubeNode'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const YOUTUBE_ID_PARSER =
  /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/

function parseYouTubeVideoID(url: string): string | null {
  const urlMatches = url.match(YOUTUBE_ID_PARSER)
  return urlMatches?.[2].length === 11 ? urlMatches[2] : null
}

function YouTubeDialog({
  editor,
  node,
  open,
}: {
  editor: LexicalEditor
  node: YouTubeNode | null
  open: boolean
}) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (!open) return
    const next = node
      ? `https://www.youtube.com/watch?v=${node.getId()}`
      : ''
    const t = setTimeout(() => setUrl(next), 0)
    return () => clearTimeout(t)
  }, [node, open])

  const closeDialog = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { youtube: { open: false } })
  }

  const restoreSelection = () => {
    editor.read(() => {
      const selection = $getSelection()?.clone() ?? null
      editor.update(() => $setSelection(selection))
    })
  }

  const handleClose = () => {
    closeDialog()
    restoreSelection()
  }

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault()
    const videoID = parseYouTubeVideoID(url.trim())
    if (!videoID) return
    if (!node) {
      editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, videoID)
    } else {
      editor.update(() => {
        const latest = node.getLatest()
        if ($isYouTubeNode(latest)) latest.setVideoId(videoID)
      })
    }
    closeDialog()
    setTimeout(() => editor.focus(), 0)
  }

  useFixedBodyScroll(open)

  const disabled = url.trim() === '' || !parseYouTubeVideoID(url.trim())

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        {/* Radix requires Title as direct child of Content (not inside DialogHeader). */}
        <DialogTitle>
          {node ? 'Edit YouTube video' : 'Insert YouTube video'}
        </DialogTitle>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="youtube-dialog-url">YouTube URL</Label>
            <Input
              id="youtube-dialog-url"
              data-test-id="youtube-embed-modal-url"
              placeholder="https://www.youtube.com/watch?v=…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              data-test-id="youtube-embed-modal-submit-btn"
              disabled={disabled}
            >
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default memo(YouTubeDialog)
