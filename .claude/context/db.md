# Database Design

## ORM & config
- Drizzle ORM with `node-postgres` driver
- Config: `apps/api/drizzle.config.ts`
- Schema: `apps/api/src/database/schema.ts`
- Migrations: `apps/api/src/database/drizzle/` (0000–0020 migration files)
- Provider: `DrizzleAsyncProvider` injected via `DrizzleModule`

## Base fields (all tables)
```ts
id: uuid (PK, defaultRandom)
createdAt: timestamp with timezone
updatedAt: timestamp with timezone ($onUpdate auto)
deletedAt: timestamp with timezone (nullable — soft delete)
```

## Enums
| Enum | Values |
|---|---|
| `user_gender` | MALE, FEMALE, UNKNOWN |
| `member_gender` | MALE, FEMALE |
| `fcm_token_device_type` | ANDROID, IOS, WEB |
| `family_tree_member_connection` | SPOUSE, PARENT |

## Tables

### `users`
| Column | Type | Notes |
|---|---|---|
| email | text | unique, notNull |
| username | text | notNull (`email_prefix-userId` on register) |
| name | text | notNull (from Google) |
| image | text | nullable |
| gender | enum user_gender | notNull |
| description | text | nullable |
| dob | date | nullable |
| dod | date | nullable |

### `family_trees`
| Column | Type | Notes |
|---|---|---|
| name | text | notNull |
| created_by | uuid → users.id | cascade delete |
| image | text | nullable |
| is_public | boolean | default false |
| Unique index | `name_and_user_idx` on (name, created_by) |
| Index | `is_public_idx` on is_public |

### `shared_family_trees`
Permission/access table for trees shared with other users.
| Column | Type | Notes |
|---|---|---|
| family_tree_id | uuid → family_trees.id | cascade delete |
| user_id | uuid → users.id | cascade delete |
| is_blocked | boolean | default false |
| can_edit_members | boolean | default false |
| can_delete_members | boolean | default false |
| can_add_members | boolean | default false |
| Unique index | `family_tree_and_user_idx` on (family_tree_id, user_id) |

### `family_tree_members`
Nodes in the tree (actual people).
| Column | Type | Notes |
|---|---|---|
| name | text | notNull |
| image | text | nullable |
| gender | enum member_gender | notNull (MALE/FEMALE only, no UNKNOWN) |
| description | text | nullable |
| dob | date | nullable |
| dod | date | nullable |
| family_tree_id | uuid → family_trees.id | cascade delete |

### `family_tree_member_connections`
Edges between nodes.
| Column | Type | Notes |
|---|---|---|
| family_tree_id | uuid → family_trees.id | cascade delete |
| from_member_id | uuid → family_tree_members.id | cascade delete |
| to_member_id | uuid → family_tree_members.id | cascade delete |
| type | enum family_tree_member_connection | SPOUSE or PARENT |

### `fcm_tokens`
Firebase push notification tokens per device.
| Column | Type | Notes |
|---|---|---|
| token | text | notNull |
| user_id | uuid → users.id | cascade delete |
| device_type | enum fcm_token_device_type | ANDROID/IOS/WEB |

### `notifications`
| Column | Type | Notes |
|---|---|---|
| content | text | notNull |
| receiver_user_id | uuid → users.id | cascade delete |
| sender_user_id | uuid → users.id | cascade delete |

### `notification_reads`
Tracks the last read time per user (single row per user, not per notification).
| Column | Type | Notes |
|---|---|---|
| user_id | uuid → users.id | PK (not uuid default) |
| updated_at | timestamp | notNull |

**Drift warning:** migration `0009` created this table WITHOUT the primary key that `schema.ts` declares. `drizzle-kit generate` finally emitted the catch-up `ALTER TABLE "notification_reads" ADD PRIMARY KEY ("user_id")` inside migration `0021` (the visits feature). That statement fails on any DB that already has the PK — e.g. anything ever synced with `drizzle-kit push` — or that has duplicate `user_id` rows. Verify the target DB before applying 0021.

### Visit counting (`family_trees.visit_count`)
Powers the public-tree ranking. Lives as a column on `family_trees`, not a side table.
- Written only by `GET /family-trees/public/:id`. Owner and shared views never count.
- **The increment uses raw SQL on purpose.** `baseSchema.updatedAt` has `$onUpdate(() => …)`, so a drizzle `.update()` would bump `updatedAt` on every *view* — marking a tree as modified merely for being looked at. `this.db.execute(sql\`UPDATE … SET visit_count = visit_count + 1\`)` bypasses that hook. Don't "simplify" it back to `.update()`.
- Read as a sort key only: the public list orders by `visit_count DESC, created_at DESC, id DESC`. The `id` key makes the order **total** — without it, ties on both leading keys let LIMIT/OFFSET repeat or drop a tree across pages.
- `visit_count` is absent from `FamilyTreeSchema`, so it never reaches an API response (`@ZodSerializerDto` strips it). The service's own return type doesn't expose it either — reading `.visitCount` off `getFamilyTreeById()` is a compile error, which is why tests query the row directly.
- Served by `public_visit_rank_idx` on `(is_public, visit_count, created_at, id)`; Postgres scans it backwards for the all-DESC ordering, so no DESC index is needed.
- An earlier revision used a separate `public_family_tree_visits` table (created in migration `0021`) to keep visits from invalidating a `family_trees` cache. That premise turned out false — no single-tree or public-list route is cached — so it was folded into this column. If a DB has `0021` applied, the table is dropped by the follow-up migration.

## Relations summary
- `users` → many `family_trees` (created), many `fcm_tokens`, many sent/received `notifications`
- `family_trees` → many `family_tree_members`, many `family_tree_member_connections`
- `shared_family_trees` → one `family_tree`, one `user`
- `family_tree_members` → many from/to `connections`, one `family_tree`
- `family_tree_member_connections` → one fromMember, one toMember, one familyTree
