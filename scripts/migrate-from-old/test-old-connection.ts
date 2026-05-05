/**
 * Verify OLD_DATABASE_URL loads and connects (same env rules as migrate.ts).
 * Run: bun scripts/migrate-from-old/test-old-connection.ts
 */
import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'
import { Client } from 'pg'

loadEnv({ path: resolve(process.cwd(), '.env') })
loadEnv({ path: resolve(process.cwd(), '.env.local'), override: true })

const u = process.env.OLD_DATABASE_URL
if (u == null || u === '') {
  console.error('OLD_DATABASE_URL is missing in .env / .env.local')
  process.exit(1)
}

console.log('Host:', new URL(u).hostname)

const client = new Client({ connectionString: u })
try {
  await client.connect()
  const r = await client.query('select 1 as ok')
  console.log('OK:', r.rows)
} finally {
  await client.end().catch(() => {})
}
