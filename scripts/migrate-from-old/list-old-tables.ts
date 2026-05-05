/**
 * Lists tables in the legacy makerspace DB so we can set @@map correctly.
 * Run: bun scripts/migrate-from-old/list-old-tables.ts
 */
import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'
import { Client } from 'pg'

loadEnv({ path: resolve(process.cwd(), '.env') })
loadEnv({ path: resolve(process.cwd(), '.env.local'), override: true })

const url = process.env.OLD_DATABASE_URL
if (url == null || url === '') {
  console.error('OLD_DATABASE_URL is missing in .env / .env.local')
  process.exit(1)
}

console.log('Host:', new URL(url).hostname)

const client = new Client({ connectionString: url })
await client.connect()
try {
  const schemasRes = await client.query<{ table_schema: string }>(`
    select distinct table_schema
    from information_schema.tables
    where table_schema not in ('pg_catalog', 'information_schema')
    order by table_schema
  `)
  console.log(
    '\nNon-system schemas:',
    schemasRes.rows.map((r) => r.table_schema).join(', ') || '(none)',
  )

  const tablesRes = await client.query<{
    table_schema: string
    table_name: string
    table_type: string
  }>(`
    select table_schema, table_name, table_type
    from information_schema.tables
    where table_schema not in ('pg_catalog', 'information_schema')
    order by table_schema, table_name
  `)

  console.log(`\nTables (${tablesRes.rows.length}):`)
  for (const r of tablesRes.rows) {
    console.log(`  ${r.table_schema}.${r.table_name}  [${r.table_type}]`)
  }
} finally {
  await client.end().catch(() => {})
}
