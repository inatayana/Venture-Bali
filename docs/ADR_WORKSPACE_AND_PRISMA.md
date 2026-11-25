# ADR-003: Workspace & Prisma Client Isolation

**Status:** ACCEPTED  
**Date:** 2026-11-25  
**Deciders:** CTO, Owner  
**Tags:** worktree, prisma, developer-experience  
**Supersedes:** ad-hoc guidance previously kept on branch `feat/customer-auth-v1.2` (not merged into `staging`)

---

## Context

BaliWild develops in parallel Git worktrees (`repo`, `worktrees/integration`, `worktrees/growth`, `worktrees/v1.2-actors`). Before this ADR, `prisma generate` wrote the client into the shared `node_modules/.prisma/client` directory reachable from every worktree through a junction. Two agents generating different schemas in parallel corrupted each other's client, and on Windows the generated `query_engine-windows.dll.node` is frequently held open by a running Node process (`EPERM: operation not permitted, unlink`). This blocked `npm run db:generate` on `integration` during Phase 1 of the Customer Account work and forced a manual DLL rename workaround.

The referenced earlier document `ADR_WORKSPACE_AND_PRISMA.md §2.4` existed only on an unmerged branch. This ADR restates and formalises that decision for `staging` and all future worktrees.

---

## Decision — §2.4 Prisma output isolation

1. `prisma/schema.prisma` generator declares an explicit per-worktree output:

   ```prisma
   generator client {
     provider = "prisma-client-js"
     output   = "../src/generated/prisma"
   }
   ```

   The path is relative to the schema file, so every worktree owns its own generated client under `<worktree>/src/generated/prisma`.

2. **All** imports resolve to that local client:
   - `src/**` and test files: `import { ... } from '@/generated/prisma'` (tsconfig path `@/* → ./src/*`, Jest `moduleNameMapper` already matches).
   - `prisma/*.ts` scripts (run with `node --experimental-strip-types`, no alias support): relative `../src/generated/prisma`.
   - `scripts/*.js` (CommonJS): relative `../src/generated/prisma`.

3. `src/generated/` is **git-ignored** (build artifact, per `AGENTS.md §3`). A fresh checkout must run `npm install && npm run db:generate` before `npm run typecheck`, `npm test`, or `npm run build`. CI/Vercel must run `npx prisma generate` or `npm run db:generate` after `npm ci`.

4. The legacy `@prisma/client` package remains a declared dependency (Prisma CLI/runtime peer), but **application code must not import it directly**. Lint/typecheck reviews should reject new `@prisma/client` imports.

5. This isolation is independent of, and must not weaken, the actor separation in `docs/ADMIN_ACCESS_MODEL.md` and `docs/CUSTOMER_ACCOUNT_DESIGN.md`.

---

## Consequences

**Positive**
- Parallel worktrees can generate different schemas simultaneously without DLL/lock collisions.
- No more manual DLL rename workaround on Windows.
- Generated code is clearly identifiable as an artifact and never committed.

**Negative / trade-off**
- An extra generation step is required after checkout and after every schema change.
- Import paths in scripts differ from application imports (relative vs alias).

---

## Verification

- [ ] `npm run db:generate` creates `<worktree>/src/generated/prisma` with no EPERM.
- [ ] `npm run typecheck` passes with zero direct `@prisma/client` imports in `src/`, `prisma/`, `scripts/`.
- [ ] `npm test` passes with Jest resolving `@/generated/prisma`.
- [ ] `git status` stays clean after generation (artifact ignored).
