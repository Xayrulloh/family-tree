# Web Frontend (React SPA)

## Location: `apps/web/`

## Tech stack
- React + Vite
- **State management**: Effector (stores/events/effects) + `effector-storage` for persistence
- **Routing**: `atomic-router` + `createHistoryRouter`
- **HTTP**: Axios via a shared `base` instance
- **Architecture**: Feature-Sliced Design (FSD) — pages / features / entities / shared / widgets
- **Theme**: light/dark, persisted in localStorage under `@app/theme`

## Environment variables
```
VITE_API_URL  — base URL for the API
```

## Routing (`src/shared/config/routing.ts`)
Scope prefix goes **before** the id (mirrors API). Literal paths listed before parameterized in `routesMap` — required or `:id` swallows "public"/"shared".

| Route name | Path |
|---|---|
| `browse` | `/` |
| `registration` | `/register` |
| `trees` | `/family-trees` (my trees tab) |
| `publicTreeList` | `/family-trees/public` (public trees tab) |
| `publicTreesDetail` | `/family-trees/public/:id` (read-only, anonymous) |
| `sharedTreeList` | `/family-trees/shared` (shared trees tab) |
| `sharedTreesDetail` | `/family-trees/shared/:id` (shared RBAC, requires auth) |
| `sharedTreeUsers` | `/family-trees/shared/:id/users` |
| `treesDetail` | `/family-trees/:id` (owner only, requires auth) |
| `notFound` | (catch-all) |

## API client (`src/shared/api/base.ts`)
- Axios instance with `baseURL: VITE_API_URL`, `withCredentials: true`
- Response interceptor: shows success toast for POST/PUT/PATCH/DELETE (except file uploads)
- Error interceptor: shows error toast; 401 silently rejects (triggers auth redirect elsewhere)

## API modules (`src/shared/api/`)
- `auth.ts`, `user.ts`, `tree.ts`, `tree-member.ts`, `tree-member-connection.ts`
- `shared-tree.ts`, `notification.ts`, `fcm-token.ts`, `file.ts`

## FSD layer structure
```
src/
├── app/           # App init, theme store, router setup
├── pages/         # Route-level pages (each: ui/ui.tsx + ui/index.ts + index.ts)
│   ├── home/                     # /
│   ├── registration/             # /register
│   ├── tree-list/                # /family-trees + /family-trees/public + /family-trees/shared
│   │                             # exports TreeList, PublicTreeList, SharedTreeList
│   │                             # model factory accepts initialMode?: TreesMode
│   ├── tree-detail/              # /family-trees/:id (owner, full permissions)
│   ├── shared-tree-detail/       # /family-trees/shared/:id (shared RBAC permissions)
│   ├── public-tree-detail/       # /family-trees/public/:id (read-only, anon)
│   ├── shared-tree-users/        # /family-trees/shared/:id/users
│   └── not-found/
├── features/      # User-triggered actions (each: model.ts + ui.tsx + index.ts)
│   ├── auth/                     # Google sign-in button
│   ├── tree/create-edit, delete, share   # share moved here from tree-detail/share
│   ├── tree-member/add, edit, preview
│   │   └── delete/               # Two-phase delete: fetchPreviewFx → modal → deleteTreeFx
│   │       ├── model.ts          # deleteTrigger sets $member, opens disclosure, fires fetchPreviewFx
│   │       │                     # fetchPreviewFx.doneData → $preview via fn: r => r.data
│   │       │                     # deleted → deleteTreeFx (attach reads $member + $treeScope)
│   │       └── ui.tsx            # Three-state modal: spinner / blocked+Close / confirm+Delete
│   └── shared-tree-users/edit    # Edit RBAC for shared user
├── entities/
│   └── user/                     # User entity store
├── widgets/
│   └── layout/                   # App shell (navbar, user dropdown)
└── shared/
    ├── api/        # Axios API modules
    ├── config/     # routing.ts, tree-scope.ts, system.ts (appStarted event)
    ├── lib/        # create-form, disclosure, family-chart-transformer, lazy-page, message, random-avatar, time-ago, with-suspense
    ├── styles/     # family-chart-custom.css
    └── ui/         # field-wrapper, loading spinner
```

## Visualization widget (`src/widgets/tree-visualization/`)
- `model.ts` — `createTreeDetailModel<T>(config)` generic factory; takes `scope`, `requireAuth`, `fetchTree`, `resolvePermissions`, `getName`; returns `TreeDetailModel` (`$members`, `$connections`, `$id`, `$treeName`, `$permissions`, `$loading`). All three fetch effects (`fetchTreeFx`, `fetchMembersFx`, `fetchConnectionsFx`) have both done and fail handlers — fail reinits the affected stores.
- `visualization.tsx` — canvas component; reads `permissions.canAdd/canEdit/canDelete/canManageSharedUsers`
- `view.tsx` — `TreeDetailView` (edit/delete buttons gated on permissions)
- All 3 tree-detail pages (`tree-detail`, `shared-tree-detail`, `public-tree-detail`) are thin wrappers: `createModel` delegates to this factory, `component = TreeDetailView`

## TreeScope (`src/shared/config/tree-scope.ts`)
- `TreeScope = 'owner' | 'shared' | 'public'`
- `$treeScope` global store — set by `treeScopeChanged` on every page open so write features (add/edit/delete) target the correct API prefix
- `scopeSegment(scope)` → `''` / `'/shared'` / `'/public'` — inserted **before** the tree id in all URL templates (e.g. `/family-trees${scopeSegment(scope)}/${id}/members`)

## API client URL pattern
All scoped endpoints use `prefix-before-id`:
- Owner:  `/family-trees/${id}/members`
- Shared: `/family-trees/shared/${id}/members`
- Public: `/family-trees/public/${id}/members`

`tree-list` page: `api.tree.findAll` for own trees, `api.tree.findAllPublic` for public list (separate endpoints), `api.sharedTree.findAll` for shared list. `PublicTreeList` uses `triggerRoute = route` (not `authorizedRoute`) so anonymous users can browse without being redirected to login.

## Key patterns
- Tree detail pages: no separate `model.ts`; `createModel` inline in `ui/ui.tsx`; `component` is re-exported via `export { TreeDetailView as component } from '~/widgets/tree-visualization'` (SonarQube S7763 wants `export…from` over `export const x = imported`; same for `export { factory as createModel } from '../model'` on list pages)
- Write features (`add/edit/delete`) are singletons; they read `$treeScope` via `attach({ source: { ..., scope: $treeScope } })` so scope propagates without prop-drilling
- `shared/lib/create-form.ts` — generic form factory
- `shared/lib/disclosure.ts` — open/close state for modals/drawers
- Lazy loading via `shared/lib/lazy-page.ts` + `with-suspense` HOC
- `appStarted` event fires on app boot to initialize router history and trigger `sessionFx` (so session is resolved on all pages, including public ones that don't use `chainAuthorized`)
- `shared/lib/family-chart-transformer.ts` — transforms API member/connection data into family-chart format
- **`chainAuthorized` always redirects anonymous users** — even when a page model sets `triggerRoute = route` (not `authorizedRoute`) to allow public data fetching, `chainAuthorized` fires `routes.registration.open` when session becomes `UnAuthorized`. There is no "allow anonymous but skip auth features" mode. All E2E/integration tests for pages that call `chainAuthorized` must mock an authenticated user to prevent the redirect.
- **Playwright `page.route()` patterns must be scoped to the API origin** — a bare regex like `/family-trees\/shared\/.+\/users/` also matches the browser navigation URL (dev-server port 4300), so Playwright serves the JSON mock as the page document. Anchor regexes with `:9999/api/` or use the `API_URL`-prefixed glob from `e2e/fixtures.ts`.
- **`requireAuth: false` skips `chainAuthorized`** — `createTreeDetailModel` only wraps the route when `requireAuth: true`; the public tree-detail page is genuinely anonymous-safe (E2E can use `mockUnauthenticated`), unlike list pages that always call `chainAuthorized`.
- **`chainRoute` `$hasSameParams` guard breaks Effector fork** — `chainRoute` (atomic-router) uses reference-equality (`===`) to compare `route.$params` against its internal params store before opening the chained route. In Effector `fork`+`allSettled`, both stores are set from the same event value but may NOT satisfy `===`, so `authorizedRoute.opened` never fires and `authorizedRoute.$params` stays `{}`. **Consequence:** in integration tests, models that derive state from `authorizedRoute.$params` (e.g. `$familyTreeId = authorizedRoute.$params.map(p => p.id ?? null)`) will always return `null` after `allSettled(route.opened, ...)`. Don't assert fetch-effect call args that depend on route params in integration tests — assert store state directly instead.
