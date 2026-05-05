'use client'

import { useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'

import { ourFileRouter } from '@/app/api/uploadthing/core'
import { UploadDropzone } from '@/lib/uploadthing'

interface FileUploadProps {
  /** Second argument is the original filename from the upload response when available. */
  onChange: (url?: string, fileName?: string) => void
  endpoint: keyof typeof ourFileRouter
  value?: string | null
}

export const FileUpload = ({ onChange, endpoint, value }: FileUploadProps) => {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const preview = uploadedUrl ?? value ?? null

  const handleUploadComplete = (
    res: Array<{ url: string; name: string }>,
  ) => {
    const file = res?.[0]
    if (file?.url) {
      setUploadedUrl(file.url)
      onChange(file.url, file.name)
    }
  }

  const handleUploadError = (error: Error) => {
    toast.error(`${error?.message}`)
  }

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative rounded-md border border-border overflow-hidden bg-muted">
          <Image
            src={preview}
            alt="Vorschau"
            width={300}
            height={300}
            className="object-cover w-full max-h-75"
          />
        </div>
      ) : (
        <UploadDropzone
          endpoint={endpoint}
          onClientUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
      )}
    </div>
  )
}
