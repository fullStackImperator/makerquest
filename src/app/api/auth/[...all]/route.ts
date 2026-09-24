import { auth } from '@/lib/auth' // path to your auth file
import { FEEDBACK_EMAIL } from '@/lib/contact'
import { logSecurityEvent } from '@/lib/security-log'
import { toNextJsHandler } from 'better-auth/next-js'

const handler = toNextJsHandler(auth)

// Password login/signup is disabled (only email code and GitHub are offered).
// Requests to these endpoints don't come from the app, so they get logged.
const BLOCKED_PATHS = ['/api/auth/sign-up/email', '/api/auth/sign-in/email']

const BLOCKED_MESSAGE = [
  'Zugriff verweigert. Anmeldung mit Passwort ist bei MakerQuest deaktiviert.',
  'Dieser Versuch wurde mit Zeitpunkt, IP-Adresse und Browser protokolliert.',
  'Unbefugte Zugriffe auf fremde Daten können nach §§ 202a ff. StGB strafbar sein.',
  `Sicherheitslücke gefunden? Melde sie verantwortungsvoll an ${FEEDBACK_EMAIL}.`,
].join(' ')

export const GET = handler.GET

export async function POST(request: Request) {
  const { pathname } = new URL(request.url)
  if (BLOCKED_PATHS.includes(pathname)) {
    await logSecurityEvent('blocked-password-auth', { path: pathname })
    return Response.json(
      { code: 'ACCESS_DENIED', message: BLOCKED_MESSAGE },
      { status: 403 },
    )
  }
  return handler.POST(request)
}
