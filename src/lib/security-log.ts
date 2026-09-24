import 'server-only'

import { headers } from 'next/headers'

/**
 * Writes a structured security event to the server log (Vercel → Logs,
 * search for "security-event"). Never throws.
 */
export async function logSecurityEvent(event: string, details: Record<string, unknown> = {}) {
  try {
    const h = await headers()
    console.warn(
      JSON.stringify({
        type: 'security-event',
        event,
        at: new Date().toISOString(),
        ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip'),
        userAgent: h.get('user-agent'),
        ...details,
      }),
    )
  } catch {
    // logging must never break the request
  }
}
