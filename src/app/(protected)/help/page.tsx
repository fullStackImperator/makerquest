import Link from 'next/link'
import { HelpCircle, Mail } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'
import { FEEDBACK_EMAIL } from '@/lib/contact'
import { getSessionUser } from '@/lib/get-session-user'
import { FaqList } from './_components/faq-list'
import { AddFaqButton } from './_components/add-faq-button'

export default async function HelpPage() {
  const [user, entries] = await Promise.all([
    getSessionUser(),
    db.faqEntry.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        question: true,
        answer: true,
      },
    }),
  ])

  const canEditFaq = user?.isTeacher === true || user?.isAdmin === true

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 p-4 md:p-6">
      <header className="space-y-3">
        <div className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <HelpCircle className="h-5 w-5" />
          <span>Hilfe</span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Häufige Fragen
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Antworten auf die wichtigsten Fragen rund um MakerQuest. Findest
              du deine Frage nicht? Schreibe uns einfach eine Nachricht.
            </p>
          </div>
          {canEditFaq && <AddFaqButton />}
        </div>
      </header>

      {entries.length === 0 ? (
        <Card className="border-dashed py-10 text-center shadow-none">
          <CardContent className="space-y-3">
            <HelpCircle className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="text-lg font-semibold">Noch keine Einträge</p>
            <p className="text-sm text-muted-foreground">
              Sobald deine Lehrer:innen Fragen &amp; Antworten anlegen,
              erscheinen sie hier.
            </p>
          </CardContent>
        </Card>
      ) : (
        <FaqList entries={entries} canEdit={canEditFaq} />
      )}

      {/* Contact callout */}
      <Card className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Keine Antwort gefunden?
          </CardTitle>
          <CardDescription>
            Schreib uns eine E-Mail mit deiner Frage oder deinem Feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="gap-2">
            <Link href={`mailto:${FEEDBACK_EMAIL}`}>
              <Mail className="h-4 w-4" />
              E-Mail schreiben
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
