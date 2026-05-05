'use client'

import * as z from 'zod'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { ImageIcon, Pencil, PlusCircle } from 'lucide-react'
import Image from 'next/image'

import { toast } from 'sonner'
import { Course } from '@/generated/client'
import { FileUpload } from '@/components/files/file-upload'
import { updateCourse } from '../_actions/update-course'
import { courseFormBlockClass } from './course-form-styles'

interface ImageFormProps {
  initialData: Course
  courseId: string
}

const formSchema = z.object({
  imageUrl: z.string().min(1, {
    message: 'Bild ist erforderlich',
  }),
})

export const ImageForm = ({ initialData, courseId }: ImageFormProps) => {
  const [isEditing, setIsEditing] = useState(false)

  const toggleEdit = () => setIsEditing((current) => !current)
  const router = useRouter()

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const result = await updateCourse(courseId, { imageUrl: values.imageUrl })
    if (!result.success) return toast.error(result.error)
    toast.success('Projekt aktualisiert')
    toggleEdit()
    router.refresh()
  }

  return (
    <div className={courseFormBlockClass}>
      <div className="font-medium flex items-center justify-between">
        Projekt Titelbild
        <Button onClick={toggleEdit} variant="outline" size="sm">
          {isEditing && <>Cancel</>}
          {!isEditing && !initialData.imageUrl && (
            <>
              <PlusCircle className="h-4 w-4 mr-2" />
              Bild hinzufügen
            </>
          )}
          {!isEditing && initialData.imageUrl && (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Bild ändern
            </>
          )}
        </Button>
      </div>
      {!isEditing &&
        (!initialData.imageUrl ? (
          <div className="flex items-center justify-center h-60 bg-slate-200 rounded-md mt-4">
            <ImageIcon className="h-10 w-10 text-slate-500" />
          </div>
        ) : (
          <div className="relative aspect-video mt-2">
            <Image
              alt="Upload"
              fill
              className="object-cover rounded-sm"
              src={initialData.imageUrl}
            />
          </div>
        ))}
      {isEditing && (
        <div>
          <FileUpload
            endpoint="courseImage"
            onChange={(url) => {
              if (url) {
                onSubmit({ imageUrl: url })
              }
            }}
          />
          <div className="text-xs text-muted-foreground mt-4">
            16:9 aspect ratio empfohlen
          </div>
        </div>
      )}
    </div>
  )
}
