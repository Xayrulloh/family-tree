# Project: Family Tree (famtree.uz)

## What it is
A web app for creating, managing, and sharing family trees. Users sign in via Google OAuth, create trees, add members (nodes), connect them (parent/spouse), and can share trees with other users with fine-grained RBAC permissions.

## Live domain
- Frontend: `https://www.famtree.uz`
- API: separate backend deployment
- Cloudflare Worker: sits in front of the SPA to serve OG meta tags for social crawlers

## Tech stack
| Layer | Tech |
|---|---|
| Monorepo | Nx + pnpm workspaces |
| Backend | NestJS + Drizzle ORM + PostgreSQL |
| Frontend | React + Vite + Effector (FSD architecture) + atomic-router + Axios |
| Worker | Cloudflare Workers (TypeScript) |
| Shared lib | Zod schemas + request/response types (used by both api and web) |
| Auth | Google OAuth2 → JWT stored as httpOnly cookie |
| File storage | Cloudflare R2 |
| Cache | Redis (via NestJS cache interceptors) |
| Linter | Biome |
| Error tracking | Sentry |
| Push notifications | Firebase FCM |
| CI/CD | GitHub Actions (`.github/workflows/`) |

## Monorepo structure
```
family-tree/
├── apps/
│   ├── api/          # NestJS backend
│   ├── web/          # React SPA
│   └── cloudflare/   # Cloudflare Worker (OG meta tags)
├── libs/
│   └── shared/       # Zod schemas + TS types shared between api and web
├── biome.json        # Linter config
├── nx.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Key conventions
- All API routes are prefixed with a global prefix (see `GLOBAL_PREFIX` constant in `apps/api/src/utils/constants.ts`)
- Biome is used for linting/formatting (not ESLint/Prettier)
- Shared package name: `@family-tree/shared`
- All DB tables use soft-delete via `deletedAt` timestamp
- Response validation uses `nestjs-zod` + `ZodSerializerDto` on every controller method
- Cookie name for JWT: `COOKIES_ACCESS_TOKEN_KEY` constant

## Testing setup
| Package | Runner | Config |
|---|---|---|
| `apps/api` | Jest (`@nx/jest`) | unit: `apps/api/jest.config.ts`; integration: `apps/api/jest.integration.config.ts`; E2E: `apps/api/jest.e2e.config.ts` |
| `apps/web` | Vitest / Playwright | unit: `apps/web/vite.config.ts`; integration: `apps/web/vitest.integration.config.ts`; E2E: `apps/web/playwright.config.ts` |
| `libs/shared` | Vitest | `libs/shared/vitest.config.ts` + `libs/shared/tsconfig.spec.json` |

Run commands (root shortcuts):
- `pnpm test:unit` — unit tests for all packages
- `pnpm test:integration` — integration tests for all packages
- `pnpm test:e2e` — E2E tests for all packages

Per-project (when you only want one):
- API unit: `pnpm exec nx test api --testPathPatterns="<pattern>"`
- API integration: `pnpm exec nx run api:test-integration`
- API E2E: `pnpm exec nx run api:test-e2e`
- Web unit: `pnpm exec nx test @family-tree/web` (or `npx vitest run <file>` from `apps/web/`)
- Web integration: `pnpm exec nx run @family-tree/web:test-integration`
- Web E2E: `pnpm exec nx run @family-tree/web:test-e2e`
- Shared: `pnpm exec nx test shared`

- Unit: ~355 tests (2026-07-06) — api 110 (Jest), shared 226 (Vitest), web (Vitest). Almost every logic-bearing source file has an adjacent spec; barrels/modules/one-line guards/ui.tsx are deliberately untested (covered by the E2E tier).
- Integration: ~215 tests — ~93 API (Testcontainers + real Postgres) + ~121 web (MSW + Effector `fork`).
- API E2E: 58 tests — supertest against full NestJS app, real Postgres via Testcontainers, `CacheService` overridden with no-op to avoid Redis. Covers all endpoint groups incl. shared-tree RBAC negative paths (403s).
- Web E2E: 19 tests — Playwright Chromium, all API calls intercepted via `page.route()`, dev server started by Playwright with `VITE_API_URL=http://localhost:9999/api`. Every page has a spec (home, registration, tree-list, public-tree-list, not-found, 3 detail pages, shared-tree-users).
- All four tiers now run in CI before SonarQube scan (`.github/workflows/ci.yml`).
- Web Sonar coverage = unit + integration lcov merged (`sonar.javascript.lcov.reportPaths` comma list; integration coverage always on via `coverage.enabled: true` in `vitest.integration.config.ts`); `.tsx` files are excluded from the coverage metric (`sonar.coverage.exclusions`) because their tier is Playwright, which can't emit lcov — keep logic in `model.ts`, not `.tsx`.
- API jest configs share `apps/api/jest.base.ts`. Gotcha: Jest's TS config loader needs the explicit extension — `import { baseConfig } from './jest.base.ts'` (extensionless fails with `ERR_MODULE_NOT_FOUND`).
- Both API global teardowns delegate to `apps/api/src/test/docker-cleanup.ts` (`stopAndRemoveContainer`); Ryuk is the fallback reaper.

## Test conventions
- All spec files use AAA (Arrange-Act-Assert) blank-line grouping inside `it()` blocks: one blank line before the act, one before the first `expect()`. Single-line tests need no gaps.
- All API spec files start with `/// <reference types="jest" />` for reliable IDE type resolution.
- `biome.json` has an `overrides` block for `**/*.spec.ts` / `**/*.test.ts` that disables `noExplicitAny` and `noNonNullAssertion` — use `as any` and `!` freely in test mocks.

## Build gotchas
- API build uses `@nx/rspack:rspack`; the `production` config keeps `optimization: false` **on purpose**. Enabling minification mangles DTO class names, which `nestjs-zod` + `@nestjs/swagger` use as OpenAPI schema names → breaks Swagger (one shared schema for all endpoints, missing params). Configure build optimization in `apps/api/project.json`, NOT `rspack.config.js` (the executor's `optimization` flag overrides the rspack config).
- CI uses `pnpm exec nx` (not `npx nx`) for test and scan steps — matches pnpm-first tooling convention.
- `apps/web/tsconfig.spec.json` includes `src/**/*.ts` + `src/**/*.tsx` (not just spec globs) so VS Code resolves source files imported by spec files without "not listed in project" errors.
