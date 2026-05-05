/**
 * One-way migration: legacy makerspace DB → makerquest DB (content only).
 * Run from repo root: bun run db:migrate-old-data
 *
 * Does NOT import legacy users, progress, purchases, XP, badges, or gradings.
 * All imported courses are assigned to MIGRATION_COURSE_OWNER_ID (a user that
 * must already exist in the NEW database).
 *
 * Requires: DATABASE_URL, OLD_DATABASE_URL, MIGRATION_COURSE_OWNER_ID
 * Loads `.env` then `.env.local` (override).
 */
import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'

loadEnv({ path: resolve(process.cwd(), '.env') })
loadEnv({ path: resolve(process.cwd(), '.env.local'), override: true })

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient as OldPrismaClient } from '../../src/generated-old/index.js'
import { PrismaClient as NewPrismaClient } from '../../src/generated/client'

const BATCH = 250

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

function describeDbUrl(url: string): string {
  try {
    const u = new URL(url)
    const db =
      u.pathname.replace(/^\//, '').split('?')[0]?.split('/')[0] ?? ''
    const host = u.hostname + (u.port ? `:${u.port}` : '')
    return db ? `${host} / db=${db}` : host
  } catch {
    return '(could not parse URL)'
  }
}

function isPrismaUnreachable(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code: string }).code === 'P1001'
  )
}

function isPrismaTableMissing(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code: string }).code === 'P2021'
  )
}

function printLegacyDbUnreachableHelp(hostname: string) {
  console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cannot reach legacy database (OLD_DATABASE_URL)
Host: ${hostname}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
}

function printTableMapHelp() {
  console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Legacy table name mismatch (P2021). prisma/old/schema.prisma uses @@map(...)
to match makerspace table names. If this still fails, run in Neon SQL:

  select table_name from information_schema.tables
  where table_schema = 'public' order by 1;

Adjust @@map on the failing model in prisma/old/schema.prisma, then:
  bun run db:old:generate
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
}

async function main() {
  requireEnv('DATABASE_URL')
  requireEnv('OLD_DATABASE_URL')
  const courseOwnerId = requireEnv('MIGRATION_COURSE_OWNER_ID')

  const oldUrl = requireEnv('OLD_DATABASE_URL')
  const newUrl = requireEnv('DATABASE_URL')

  console.log('\nConnection targets (verify these match Neon):')
  console.log(`  OLD (source): ${describeDbUrl(oldUrl)}`)
  console.log(`  NEW (target): ${describeDbUrl(newUrl)}`)
  console.log(`  Course owner (NEW user id): ${courseOwnerId}\n`)

  const oldDb = new OldPrismaClient({
    adapter: new PrismaPg({ connectionString: oldUrl }),
    log: ['warn', 'error'],
  })

  const newDb = new NewPrismaClient({
    adapter: new PrismaPg({ connectionString: newUrl }),
    log: ['warn', 'error'],
  })

  const owner = await newDb.user.findUnique({ where: { id: courseOwnerId } })
  if (owner == null) {
    throw new Error(
      `MIGRATION_COURSE_OWNER_ID not found in NEW DB. Create an account in MakerQuest, copy id from table "user", set env, re-run.`,
    )
  }

  let legacyCoursesN = 0
  let legacyChaptersN = 0
  try {
    ;[legacyCoursesN, legacyChaptersN] = await Promise.all([
      oldDb.course.count(),
      oldDb.chapter.count(),
    ])
  } catch (e) {
    if (isPrismaUnreachable(e)) {
      try {
        printLegacyDbUnreachableHelp(new URL(oldUrl).hostname)
      } catch {
        printLegacyDbUnreachableHelp('(invalid URL)')
      }
    }
    if (isPrismaTableMissing(e)) {
      printTableMapHelp()
    }
    throw e
  }
  console.log(
    `Legacy DB row counts: Course=${legacyCoursesN}, Chapter=${legacyChaptersN}`,
  )

  // --- MathEditorDocument
  let mathOk = 0
  for (let skip = 0; ; skip += BATCH) {
    const rows = await oldDb.mathEditorDocument.findMany({
      skip,
      take: BATCH,
      orderBy: { id: 'asc' },
    })
    if (rows.length === 0) break
    for (const r of rows) {
      await newDb.mathEditorDocument.upsert({
        where: { id: r.id },
        create: {
          id: r.id,
          name: r.name,
          head: r.head,
          data: r.data as object,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        },
        update: {
          name: r.name,
          head: r.head,
          data: r.data as object,
          updatedAt: r.updatedAt,
        },
      })
      mathOk += 1
    }
  }
  console.log(`MathEditorDocument: ${mathOk} upserted.`)

  // --- Fach (remap by name to avoid duplicates)
  const fachIdRemap = new Map<string, string>()
  let fachInsert = 0
  let fachReuse = 0
  for (let skip = 0; ; skip += BATCH) {
    const rows = await oldDb.fach.findMany({
      skip,
      take: BATCH,
      orderBy: { id: 'asc' },
    })
    if (rows.length === 0) break
    for (const r of rows) {
      const byId = await newDb.fach.findUnique({ where: { id: r.id } })
      if (byId != null) {
        fachIdRemap.set(r.id, byId.id)
        fachReuse += 1
        continue
      }
      const byName = await newDb.fach.findUnique({ where: { name: r.name } })
      if (byName != null) {
        fachIdRemap.set(r.id, byName.id)
        fachReuse += 1
        continue
      }
      await newDb.fach.create({ data: { id: r.id, name: r.name } })
      fachIdRemap.set(r.id, r.id)
      fachInsert += 1
    }
  }
  console.log(`Fach: ${fachInsert} created, ${fachReuse} reused.`)

  // --- Category (remap by name)
  const categoryIdRemap = new Map<string, string>()
  let catInsert = 0
  let catReuse = 0
  for (let skip = 0; ; skip += BATCH) {
    const rows = await oldDb.category.findMany({
      skip,
      take: BATCH,
      orderBy: { id: 'asc' },
    })
    if (rows.length === 0) break
    for (const r of rows) {
      const byId = await newDb.category.findUnique({ where: { id: r.id } })
      if (byId != null) {
        categoryIdRemap.set(r.id, byId.id)
        catReuse += 1
        continue
      }
      const byName = await newDb.category.findUnique({
        where: { name: r.name },
      })
      if (byName != null) {
        categoryIdRemap.set(r.id, byName.id)
        catReuse += 1
        continue
      }
      await newDb.category.create({ data: { id: r.id, name: r.name } })
      categoryIdRemap.set(r.id, r.id)
      catInsert += 1
    }
  }
  console.log(`Category: ${catInsert} created, ${catReuse} reused.`)

  // --- Badge (remap by name)
  const badgeIdRemap = new Map<string, string>()
  let badgeInsert = 0
  let badgeReuse = 0
  for (let skip = 0; ; skip += BATCH) {
    const rows = await oldDb.badge.findMany({
      skip,
      take: BATCH,
      orderBy: { id: 'asc' },
    })
    if (rows.length === 0) break
    for (const r of rows) {
      const byId = await newDb.badge.findUnique({ where: { id: r.id } })
      if (byId != null) {
        badgeIdRemap.set(r.id, byId.id)
        await newDb.badge.update({
          where: { id: byId.id },
          data: {
            description: r.description,
            imageUrl: r.imageUrl,
            updatedAt: r.updatedAt,
          },
        })
        badgeReuse += 1
        continue
      }
      const byName = await newDb.badge.findUnique({ where: { name: r.name } })
      if (byName != null) {
        badgeIdRemap.set(r.id, byName.id)
        badgeReuse += 1
        continue
      }
      await newDb.badge.create({
        data: {
          id: r.id,
          name: r.name,
          description: r.description,
          imageUrl: r.imageUrl,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        },
      })
      badgeIdRemap.set(r.id, r.id)
      badgeInsert += 1
    }
  }
  console.log(`Badge: ${badgeInsert} created, ${badgeReuse} reused.`)

  // --- Course (all owned by MIGRATION_COURSE_OWNER_ID)
  let courseOk = 0
  for (let skip = 0; ; skip += BATCH) {
    const rows = await oldDb.course.findMany({
      skip,
      take: BATCH,
      orderBy: { id: 'asc' },
      include: { faecher: true, categories: true },
    })
    if (rows.length === 0) break
    for (const c of rows) {
      const schwierigkeit = c.schwierigkeit ?? 'EASY'
      await newDb.course.upsert({
        where: { id: c.id },
        create: {
          id: c.id,
          userId: courseOwnerId,
          title: c.title,
          description: c.description,
          longDescription: c.longDescription,
          prerequisites: c.prerequisites,
          vorkenntnisse: c.vorkenntnisse,
          kompetenzen: c.kompetenzen,
          imageUrl: c.imageUrl,
          schwierigkeit,
          klassenstufe: c.klassenstufe,
          isPublished: c.isPublished,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          faecher: {
            connect: c.faecher
              .map((f) => fachIdRemap.get(f.id) ?? f.id)
              .map((id) => ({ id })),
          },
          categories: {
            connect: c.categories
              .map((x) => categoryIdRemap.get(x.id) ?? x.id)
              .map((id) => ({ id })),
          },
        },
        update: {
          userId: courseOwnerId,
          title: c.title,
          description: c.description,
          longDescription: c.longDescription,
          prerequisites: c.prerequisites,
          vorkenntnisse: c.vorkenntnisse,
          kompetenzen: c.kompetenzen,
          imageUrl: c.imageUrl,
          schwierigkeit,
          klassenstufe: c.klassenstufe,
          isPublished: c.isPublished,
          updatedAt: c.updatedAt,
          faecher: {
            set: c.faecher
              .map((f) => fachIdRemap.get(f.id) ?? f.id)
              .map((id) => ({ id })),
          },
          categories: {
            set: c.categories
              .map((x) => categoryIdRemap.get(x.id) ?? x.id)
              .map((id) => ({ id })),
          },
        },
      })
      courseOk += 1
    }
  }
  console.log(`Course: ${courseOk} upserted (userId → MIGRATION_COURSE_OWNER_ID).`)

  // --- Chapter
  let chOk = 0
  for (let skip = 0; ; skip += BATCH) {
    const rows = await oldDb.chapter.findMany({
      skip,
      take: BATCH,
      orderBy: { id: 'asc' },
    })
    if (rows.length === 0) break
    for (const r of rows) {
      await newDb.chapter.upsert({
        where: { id: r.id },
        create: {
          id: r.id,
          title: r.title,
          description: r.description,
          descriptionEditor: r.descriptionEditor as object | undefined,
          mathEditor: r.mathEditor as object | undefined,
          videoUrl: r.videoUrl,
          position: r.position,
          isPublished: r.isPublished,
          isFree: r.isFree,
          courseId: r.courseId,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        },
        update: {
          title: r.title,
          description: r.description,
          descriptionEditor: r.descriptionEditor as object | undefined,
          mathEditor: r.mathEditor as object | undefined,
          videoUrl: r.videoUrl,
          position: r.position,
          isPublished: r.isPublished,
          isFree: r.isFree,
          courseId: r.courseId,
          updatedAt: r.updatedAt,
        },
      })
      chOk += 1
    }
  }
  console.log(`Chapter: ${chOk} upserted.`)

  // --- Attachment (legacy userId dropped — no matching users in NEW)
  let attOk = 0
  for (let skip = 0; ; skip += BATCH) {
    const rows = await oldDb.attachment.findMany({
      skip,
      take: BATCH,
      orderBy: { id: 'asc' },
    })
    if (rows.length === 0) break
    for (const r of rows) {
      await newDb.attachment.upsert({
        where: { id: r.id },
        create: {
          id: r.id,
          name: r.name,
          url: r.url,
          courseId: r.courseId,
          userId: null,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        },
        update: {
          name: r.name,
          url: r.url,
          courseId: r.courseId,
          userId: null,
          updatedAt: r.updatedAt,
        },
      })
      attOk += 1
    }
  }
  console.log(`Attachment: ${attOk} upserted (userId cleared).`)

  const [nMath, nCourse, nChapter, nFach, nCat, nBadge] = await Promise.all([
    newDb.mathEditorDocument.count(),
    newDb.course.count(),
    newDb.chapter.count(),
    newDb.fach.count(),
    newDb.category.count(),
    newDb.badge.count(),
  ])

  console.log('\n--- New DB counts (selected tables) ---')
  console.log({
    mathEditorDocument: nMath,
    fach: nFach,
    category: nCat,
    badge: nBadge,
    course: nCourse,
    chapter: nChapter,
  })
  console.log(
    '\nSkipped: User, UserFachExperience, AwardedPoints, UserProgress, Purchase, Grading, UserBadge, JournalEntry, …',
  )

  await oldDb.$disconnect()
  await newDb.$disconnect()
  console.log('\nMigration finished.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
