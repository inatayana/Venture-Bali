# AGENTS.md — Working Rules for All Agents

> **Version:** 1.0.0
> **Audience:** AI agents and human developers working on Venture Bali
> **Status:** MUST FOLLOW. If a rule here conflicts with any other doc, this file wins.

## 1. Required Reading (in order)

1. `docs/PROJECT_STRUCTURE.md` — folder layout, conventions, tech stack
2. `docs/DEVELOPMENT_WORKFLOW.md` — Git flow, branch naming
3. `Venture_Bali_PRD_PPS.md` — product requirements and phases
4. `docs/REFUND_POLICY.md`, `docs/NO_SHOW_POLICY.md` — business rules that affect code

Do not start work before reading the section relevant to your task.

## 2. Mandatory Workflow (every task, no exceptions)

1. Work on a branch, never directly on `main` (see §5).
2. Do ONE phase or task at a time. Do not mix unrelated changes.
3. Before every commit, ALL of these must pass from the repo root:
   ```bash
   npm run lint        # zero errors
   npm run typecheck   # zero errors
   npm test            # all tests pass
   ```
4. Commit with a conventional commit message (see §6).
5. Push to `origin` immediately after commit (backup policy).

## 3. Definition of Done

A task is DONE only when:
- [ ] `lint`, `typecheck`, and `test` all pass
- [ ] New/changed behavior has tests where applicable
- [ ] No secrets, `.env`, or build artifacts in the commit
- [ ] Docs updated if behavior or structure changed
- [ ] Committed AND pushed to GitHub

## 4. Forbidden Actions

- NEVER commit `.env`, API keys, tokens, or credentials (use `.env.example` as template)
- NEVER force-push, rebase published branches, or delete branches you don't own
- NEVER commit directly to `main`
- NEVER change `prisma/schema.prisma` without a proper migration and updating docs
- NEVER add/remove npm dependencies without explicit approval from the owner
- NEVER disable or weaken lint rules, type checking, or tests to make them pass
- NEVER invent env vars not documented in `.env.example`

## 5. Git & Branching

- Production branch: `main` (protected, deploys automatically)
- Branch naming (from `docs/DEVELOPMENT_WORKFLOW.md`):
  - `feature/short-desc`, `bugfix/issue-desc`, `hotfix/issue-desc`, `release/vX.Y.Z`
- Always branch from latest `main`: `git checkout main && git pull && git checkout -b feature/...`
- Merge via PR with squash only (when repo protections are enabled)

## 6. Commit Messages

Conventional Commits format:

```
<type>(<scope>): <short summary in present tense>

Types: feat | fix | docs | chore | refactor | test | ci
Examples:
  feat(booking): add date validation to BookingForm
  fix(refund): correct 30-day cutoff calculation
  docs: add SECURITY_PROTOCOL.md
```

- One logical change per commit
- Commit only after all checks pass (§2.3)

## 7. Secrets & Environment

- All env vars used in code MUST be listed in `.env.example` (no real values)
- Real secrets live ONLY in local `.env` (git-ignored) or the host's secret manager
- If a secret is ever committed: report it immediately, rotate the key, never just delete the file

## 8. Code Style Quick Rules

- TypeScript strict mode, no `any` (per `docs/PROJECT_STRUCTURE.md`)
- Import order: external → `@/` internal → relative → type-only
- Use `zod` for input validation on all API routes and webhooks
- UI changes must be responsive (mobile-first) and use existing components in `src/components/ui/`

## 9. When Something Is Unclear

If instructions conflict, or a task is ambiguous:
1. Stop before writing code
2. Ask the owner a specific question
3. Document the decision in the relevant doc once answered
