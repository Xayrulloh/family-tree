# Family Tree — Claude Context

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Git — Never Commit Without Being Asked

**Do not run `git add` or `git commit` unless the user explicitly requests it.**

- Making code changes does NOT imply permission to commit them.
- Running Biome, fixing lint errors, or finishing a task does NOT imply permission to commit.
- The only triggers that authorize a commit are: the user running `/git-save`, or a direct instruction like "commit this" / "create a commit".
- After completing code changes, stop. Report what you did. Wait for the user to decide if/when to commit.

## 5. Always Write Tests

**Every code change ships with the test that proves it works.**

| Change type | Minimum required test |
|---|---|
| New feature / endpoint / page | Unit test for the core logic + integration test for the happy path |
| Bug fix | A test that would have caught the bug (write it first, watch it fail, then fix) |
| Refactor | Confirm existing tests still pass; add any missing coverage exposed by the refactor |
| Config / tooling only | No test needed — state explicitly why |

**Which tier to use:**
- **Unit** — pure logic, no I/O: Jest (`apps/api`) · Vitest (`apps/web`, `libs/shared`)
- **Integration** — cross-boundary: API (Jest + Testcontainers real Postgres) · Web (Vitest + MSW + Effector `fork`)
- **E2E** — user-visible flows: API (supertest) · Web (Playwright, all API calls mocked via `page.route()`)

**How to run:**
```
pnpm test:unit          # unit tests for all packages
pnpm test:integration   # integration tests for all packages
pnpm test:e2e           # E2E tests for all packages
```

**Rules:**
- Place the test file next to the file it tests (`foo.ts` → `foo.spec.ts`).
- Follow AAA layout: blank line before the act, blank line before the first `expect()`.
- Run the relevant tier locally before reporting the task done.
- If a test is genuinely impossible or disproportionate, say so explicitly — don't silently skip.

## 6. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

This file is the entry point for Claude Code in this project.

## Quick start for new sessions
Run `/remember` to load full project context instantly.

## Context files (`.claude/context/`)
| File | Contents |
|---|---|
| [project.md](.claude/context/project.md) | Project overview, tech stack, monorepo structure, key conventions |
| [db.md](.claude/context/db.md) | Drizzle schema, all tables, columns, relations, enums |
| [api.md](.claude/context/api.md) | All NestJS endpoints, auth flow, guards, interceptors, env vars |
| [web.md](.claude/context/web.md) | React SPA structure, routing, FSD layers, Effector patterns, API client |
| [cloudflare.md](.claude/context/cloudflare.md) | Cloudflare Worker — OG meta injection for social crawlers |
| [shared.md](.claude/context/shared.md) | Shared Zod schemas and types used by both API and web |
| [implementation-log.md](.claude/context/implementation-log.md) | Running log of what was built each session |

## Skills
| Command | Description |
|---|---|
| `/remember` | Load all context files and print a ready-to-work summary |
| `/compact` | Summarize current session and append to implementation-log.md, update stale context files |
| `/create-pr` | Draft and create a GitHub PR for the current branch |

## Key facts
- Monorepo: Nx + pnpm workspaces
- Linter: Biome (not ESLint/Prettier) — run `pnpm biome check` or `pnpm biome format`
- Shared package: `@family-tree/shared`
- Auth: Google OAuth → JWT in httpOnly cookie
- All tables have soft-delete (`deletedAt` field)
- Response validation: `@ZodSerializerDto(Schema)` on every controller method
- GitHub repo: Xayrulloh/family-tree
