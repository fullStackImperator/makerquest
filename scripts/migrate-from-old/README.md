# Migrate legacy makerspace → MakerQuest (content only)

Imports **courses, chapters, taxonomy, badges, math docs, attachments** from the old Neon DB into MakerQuest.

**Users are not migrated.** Everyone signs up again in MakerQuest. Progress, XP, purchases, gradings, and per-user badges are **not** imported.

## Prerequisites

1. **`DATABASE_URL`** – **new** MakerQuest database (same as `bun dev`).
2. **`OLD_DATABASE_URL`** – **legacy** makerspace database.
3. **`MIGRATION_COURSE_OWNER_ID`** – `id` of a user that **already exists** in the **new** DB (e.g. your admin account). Every imported `Course.userId` is set to this value so FK constraints stay valid.

Put vars in **`.env.local`** and/or **`.env`**. The script loads `.env` then `.env.local` (override).

4. After changing `prisma/old/schema.prisma`:

   ```bash
   bun run db:old:generate
   ```

## Legacy schema

All legacy tables live in the Postgres schema **`makerspace`** (not `public`). `prisma/old/schema.prisma` declares it via:

- `datasource db { schemas = ["makerspace"] }`
- `@@schema("makerspace")` on every model (and the `DifficultyLevel` enum)

If you get **P2021** for any model, run `bun run db:list-old-tables` to see real schema/table names.

## Optional: reset target DB

If the target DB only has disposable data:

```bash
bun run db:reset
```

## Run migration

```bash
bun run db:migrate-old-data
```

Idempotent (upserts by primary key).

### Error: `P1001` on OLD

See “Connection details” in Neon for makerspace; prefer a **pooled** URL (`-pooler` in the host). Test:

```bash
bun run db:test-old-connection
```

### Error: `P2021` on OLD

Wrong `@@map` vs real table name — fix in `prisma/old/schema.prisma`, then `bun run db:old:generate`.

## What gets migrated

| Imported |
|----------|
| `MathEditorDocument`, `Fach`, `Category`, `Badge` |
| `Course` (`userId` → `MIGRATION_COURSE_OWNER_ID`; drops legacy `price` / `level`; `schwierigkeit` default `EASY` if null; M:N `faecher` / `categories`) |
| `Chapter` |
| `Attachment` (`userId` cleared on the new side) |

## Not migrated

- `User` and anything user-bound: `UserFachExperience`, `AwardedPoints`, `UserProgress`, `Purchase`, `Grading`, `UserBadge`
- Legacy-only: `Task`, `MuxData`, `StripeCustomer`, `Column`, `Card`, `Event`, `JournalEntry`, …
- New DB auth: `Session`, `Account`, `Verification`
- Learning-path models

## Rollback

Neon restore / snapshot, or `bun run db:reset` (drops imported data on that DB).
