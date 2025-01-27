import { relations } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  text,
  boolean,
  uuid,
  pgEnum,
  AnyPgColumn,
  date,
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

export const familyTreesSchema = pgTable('family_trees', {
  name: text('name').notNull(),
  createdBy: uuid('created_by')
    .references(() => usersSchema.id)
    .notNull(),
  image: text('image'),
  visibility: boolean('visibility').default(false).notNull(),
  ...baseSchema,
});

export const familyMembersSchema = pgTable('family_members', {
  name: text('name').notNull(),
  familyTreeId: uuid('family_tree_id')
    .references(() => familyTreesSchema.id)
    .notNull(),
  userId: uuid('user_id')
    .references(() => usersSchema.id)
    .notNull(),
  parentFamilyTreeId: uuid('parent_id').references(
    (): AnyPgColumn => familyMembersSchema.id
  ),
  spouseId: uuid('spouse_id').references(() => usersSchema.id),
  ...baseSchema,
});

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
  familyMembers: many(familyMembersSchema, {
    relationName: 'family-member-parent1',
  }),
  familyMembers2: many(familyMembersSchema, {
    relationName: 'family-member-parent2',
  }),
  fcmTokens: many(FCMTokensSchema, { relationName: 'user-fcm-token' }),
}));

export const familyTreesRelations = relations(
  familyTreesSchema,
  ({ one, many }) => ({
    familyMembers: many(familyMembersSchema, {
      relationName: 'family-tree-family-member',
    }),
    creator: one(usersSchema, {
      fields: [familyTreesSchema.createdBy],
      references: [usersSchema.id],
      relationName: 'family-tree-creator',
    }),
  })
);

export const familyMembersRelations = relations(
  familyMembersSchema,
  ({ one, many }) => ({
    familyTree: one(familyTreesSchema, {
      fields: [familyMembersSchema.familyTreeId],
      references: [familyTreesSchema.id],
      relationName: 'family-tree-family-member',
    }),
    user: one(usersSchema, {
      fields: [familyMembersSchema.userId],
      references: [usersSchema.id],
      relationName: 'family-member-parent1',
    }),
    parentFamilyTree: one(familyMembersSchema, {
      fields: [familyMembersSchema.parentFamilyTreeId],
      references: [familyMembersSchema.id],
      relationName: 'family-member-recursive',
    }),
    spouse: one(usersSchema, {
      fields: [familyMembersSchema.spouseId],
      references: [usersSchema.id],
      relationName: 'family-member-parent2',
    }),
    childFamilyTree: many(familyMembersSchema, {
      relationName: 'family-member-recursive',
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
