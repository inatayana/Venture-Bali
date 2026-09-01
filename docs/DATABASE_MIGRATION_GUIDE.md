# Venture Bali — Database Migration Guide

> **Version:** 1.0.0
> **ORM:** Prisma (schema: `prisma/schema.prisma`)

## 1. Golden Rules

1. NEVER edit `prisma/schema.prisma` without generating a migration in the same change.
2. NEVER edit or delete an applied migration file.
3. NEVER run destructive migrations (data loss) on production without owner approval and a backup.
4. Update `src/types/venture.ts` and affected docs whenever the schema changes.

## 2. Development Flow

```bash
# 1. Edit prisma/schema.prisma
# 2. Create + apply migration locally
npx prisma migrate dev --name <short_description>
# 3. Regenerate the client
npx prisma generate
# 4. Lint + typecheck + test, then commit schema + migration together
```

The `prisma/migrations/` folder is part of the repo — always commit it with schema changes.

## 3. Production Flow

```bash
npx prisma migrate deploy   # applies pending migrations only, never resets
```

- Run migrations BEFORE deploying the code that needs the new schema (forward-compatible changes first, deploy after).
- Take a database backup/snapshot before running `migrate deploy`.

## 4. Common Situations

| Situation | Action |
|-----------|--------|
| Schema drift (DB ≠ migrations) | Investigate with `npx prisma migrate diff`; never "fix" by hand-editing the DB |
| Need to rename a column | Do it in steps: add new column → backfill → remove old (avoids downtime) |
| Bad migration not yet applied to prod | Delete it locally, fix, re-create with a NEW name |
| Fresh local setup | `npx prisma migrate dev` applies all migrations |

## 5. Multi-Tenant Note

All tenant-scoped models carry `tenantId`. New tables MUST include tenant scoping unless there is an approved reason not to.
