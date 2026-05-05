'use client'

import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormMessage,
  FormItem,
} from '@/components/ui/form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { FileUpload } from '@/components/files/file-upload'
import { PlusCircle } from 'lucide-react'
import { useState } from 'react'
import { createBadge } from '../_actions/create-badge'
import { updateBadge } from '../_actions/update-badge'
import { deleteBadgeItem } from '../_actions/delete-badge'

const formSchema = z.object({
  name: z.string().min(1, {
    message: 'Ein Name für den Badge ist erforderlich',
  }),
  imageUrl: z.string().min(1, {
    message: 'Bild ist erforderlich',
  }),
})

type Badge = {
  id: string
  name: string
  imageUrl: string
  oldImageUrl?: string
  createdAt?: Date
  updatedAt?: Date
}

type BadgesDialogProps = {
  open: boolean
  onClose: () => void
  badgeData?: Badge
  mode: 'create' | 'edit'
}

const BadgesDialog = ({
  open,
  onClose,
  badgeData,
  mode,
}: BadgesDialogProps) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: mode === 'edit' ? (badgeData?.name ?? '') : '',
      imageUrl: mode === 'edit' ? (badgeData?.imageUrl ?? '') : '',
    },
  })

  const { isSubmitting, isValid } = form.formState

  const closeDialog = () => {
    setDialogOpen(false)
    onClose()
    form.reset()
    router.refresh()
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (mode === 'edit') {
      const result = await updateBadge(
        badgeData!.id,
        values.name,
        values.imageUrl,
        badgeData!.imageUrl,
      )
      if (!result.success) return toast.error(result.error)
      toast.success('Badge erfolgreich aktualisiert')
    } else {
      const result = await createBadge(values.name, values.imageUrl)
      if (!result.success) return toast.error(result.error)
      toast.success('Badge erfolgreich erstellt')
    }
    closeDialog()
  }

  const handleDelete = async () => {
    if (!badgeData) return
    const result = await deleteBadgeItem(badgeData.id, badgeData.imageUrl)
    if (!result.success) return toast.error(result.error)
    toast.success('Badge erfolgreich gelöscht')
    closeDialog()
  }

  return (
    <Dialog open={open || dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="items-center text-center mt-8">
          <PlusCircle className="h-4 w-4 mr-2" />
          Badge erstellen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Badge bearbeiten' : 'Badge erstellen'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Bearbeite diesen Badge. Klicke auf Speichern wenn fertig.'
              : 'Erstelle einen Badge. Klicke auf Speichern wenn fertig.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid items-center gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormDescription>
                        {mode === 'edit'
                          ? 'Neuen Badge Namen eingeben'
                          : 'Badge Namen eingeben'}
                      </FormDescription>
                      <FormControl>
                        <Input
                          autoFocus={false}
                          placeholder="z.B. Arduino"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid items-center gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={() => (
                    <FormItem>
                      <FormDescription>
                        {mode === 'edit'
                          ? 'Badge Bild ändern'
                          : 'Badge Bild hinzufügen'}
                      </FormDescription>
                      <FormControl>
                        <FileUpload
                          endpoint="badgeImage"
                          onChange={(url) => {
                            if (url) {
                              form.setValue('imageUrl', url)
                              form.trigger('imageUrl')
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <div className="grid grid-cols-3 md:grid-cols-0 gap-2 md:gap-2">
                <DialogClose asChild onClick={closeDialog}>
                  <Button
                    type="button"
                    className="mr-auto md:mr-0 py-2"
                    variant="secondary"
                  >
                    Zurück
                  </Button>
                </DialogClose>
                {mode === 'edit' ? (
                  <>
                    <Button
                      type="button"
                      className="py-2 mx-auto md:mx-0"
                      onClick={handleDelete}
                    >
                      Löschen
                    </Button>
                    <Button
                      type="submit"
                      className="py-2"
                      disabled={isSubmitting || !isValid}
                    >
                      Speichern
                    </Button>
                  </>
                ) : (
                  <Button
                    type="submit"
                    className="py-2 ml-auto md:ml-0 col-span-2 md:col-span-0"
                    disabled={isSubmitting || !isValid}
                  >
                    Speichern
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default BadgesDialog
