import { relations } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  text,
  boolean,
  uuid,
  pgEnum,
  date,
  unique,
  integer,
} from 'drizzle-orm/pg-core';
import { FCMTokenDeviceEnum, UserGenderEnum } from '@family-tree/shared';

// enums
export const DrizzleUserGenderEnum = pgEnum('user_gender', [
  UserGenderEnum.MALE,
  UserGenderEnum.FEMALE,
  UserGenderEnum.UNKNOWN,
]);
export const DrizzleFCMTokenDeviceEnum = pgEnum('fcm_token_device_type', [
  FCMTokenDeviceEnum.ANDROID,
  FCMTokenDeviceEnum.IOS,
  FCMTokenDeviceEnum.WEB,
]);

// schemas
const baseSchema = {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'date', withTimezone: true }),
};

export const usersSchema = pgTable('users', {
  email: text('email').unique(),
  username: text('username'),
  name: text('name').notNull(),
  image: text('image'),
  gender: DrizzleUserGenderEnum('gender').notNull(),
  deathdate: date('death_date', { mode: 'string' }),
  birthdate: date('birth_date', { mode: 'string' }),
  ...baseSchema,
});

export const familyTreesSchema = pgTable(
  'family_trees',
  {
    name: text('name').notNull(),
    createdBy: uuid('created_by')
      .references(() => usersSchema.id)
      .notNull(),
    image: text('image'),
    visibility: boolean('visibility').default(false).notNull(),
    ...baseSchema,
  },
  (table) => ({
    nameAndUserIdx: unique('name_and_user_idx').on(table.name, table.createdBy),
  })
);

// Closure Table for Family Tree Relationships
export const familyTreeRelationshipsSchema = pgTable(
  'family_tree_relationships',
  {
    ancestorId: uuid('ancestor_id')
      .references(() => usersSchema.id)
      .notNull(), // Ancestor (e.g., parent, grandparent)
    descendantId: uuid('descendant_id')
      .references(() => usersSchema.id)
      .notNull(), // Descendant (e.g., child, grandchild)
    familyTreeId: uuid('family_tree_id')
      .references(() => familyTreesSchema.id)
      .notNull(), // Family tree identifier
    depth: integer('depth').notNull(), // Depth of the relationship
    ...baseSchema, // FIXME: no need id primary key
  },
  (table) => ({
    pk: unique('relationship_pk').on(
      table.ancestorId,
      table.descendantId,
      table.familyTreeId
    ),
  })
);

export const FCMTokensSchema = pgTable('fcm_tokens', {
  token: text('token').notNull(),
  userId: uuid('user_id')
    .references(() => usersSchema.id)
    .notNull(),
  deviceType: DrizzleFCMTokenDeviceEnum('device_type').notNull(),
  ...baseSchema,
});

// relations
export const usersRelations = relations(usersSchema, ({ many }) => ({
  familyTrees: many(familyTreesSchema, { relationName: 'family-tree-creator' }),
  ancestor: many(familyTreeRelationshipsSchema, {
    relationName: 'family-tree-relationship-ancestor',
  }),
  descendant: many(familyTreeRelationshipsSchema, {
    relationName: 'family-tree-relationship-descendant',
  }),
  fcmTokens: many(FCMTokensSchema, { relationName: 'user-fcm-token' }),
}));

export const familyTreesRelations = relations(
  familyTreesSchema,
  ({ one, many }) => ({
    familyTreeRelationships: many(familyTreeRelationshipsSchema, {
      relationName: 'family-tree-family-relationship',
    }),
    creator: one(usersSchema, {
      fields: [familyTreesSchema.createdBy],
      references: [usersSchema.id],
      relationName: 'family-tree-creator',
    }),
  })
);

export const familyTreeRelationshipsRelations = relations(
  familyTreeRelationshipsSchema,
  ({ one }) => ({
    familyTree: one(familyTreesSchema, {
      fields: [familyTreeRelationshipsSchema.familyTreeId],
      references: [familyTreesSchema.id],
      relationName: 'family-tree-family-relationship',
    }),
    ancestor: one(usersSchema, {
      fields: [familyTreeRelationshipsSchema.ancestorId],
      references: [usersSchema.id],
      relationName: 'family-tree-relationship-ancestor',
    }),
    descendant: one(usersSchema, {
      fields: [familyTreeRelationshipsSchema.descendantId],
      references: [usersSchema.id],
      relationName: 'family-tree-relationship-descendant',
    }),
  })
);

export const FCMTokensRelations = relations(FCMTokensSchema, ({ one }) => ({
  user: one(usersSchema, {
    fields: [FCMTokensSchema.userId],
    references: [usersSchema.id],
    relationName: 'user-fcm-token',
  }),
}));
