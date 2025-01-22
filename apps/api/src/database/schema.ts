import { relations } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  text,
  boolean,
  uuid,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { FCMTokenDeviceEnum, UserGenderEnum } from '@family-tree/shared'

// enums
export const DrizzleUserGenderEnum = pgEnum('user_gender', [UserGenderEnum.MALE, UserGenderEnum.FEMALE]);
export const DrizzleFCMTokenDeviceEnum = pgEnum('fcm_token_device_type', [FCMTokenDeviceEnum.ANDROID, FCMTokenDeviceEnum.IOS, FCMTokenDeviceEnum.WEB]);

// schemas
const baseTable = {
  id: uuid('id').primaryKey(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}

export const users = pgTable('users', {
  username: text('username'),
  name: text('name').notNull(),
  image: text('image'),
  gender: DrizzleUserGenderEnum('gender').notNull(),
  alive: boolean('alive').default(true).notNull(),
  birthdate: timestamp('birthdate', { mode: 'date' }),
  ...baseTable
});

export const familyTrees = pgTable('family_trees', {
  name: text('name').notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  image: text('image'),
  visibility: boolean('visibility').default(false).notNull(),
  ...baseTable
});

export const familyMembers = pgTable('family_members', {
  name: text('name').notNull(),
  familyTreeId: uuid('family_tree_id').references(() => familyTrees.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  parentFamilyTreeId: uuid('parent_id').references(() => familyMembers.id),
  spouseId: uuid('spouse_id').references(() => users.id),
  ...baseTable
});

export const FCMTokens = pgTable('fcm_tokens', {
  token: text('token').notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  deviceType: DrizzleFCMTokenDeviceEnum('device_type').notNull(),
  ...baseTable
});

// relations
export const usersRelations = relations(users, ({ many }) => ({
  familyTrees: many(familyTrees, { relationName: 'user-family-trees' }),
  familyMembers: many(familyMembers, { relationName: 'user-family-members' }),
  fcmTokens: many(FCMTokens, { relationName: 'user-fcm-tokens' }),
}))

export const familyTreesRelations = relations(familyTrees, ({ one, many }) => ({
  familyMembers: many(familyMembers, { relationName: 'family-tree-family-members' }),
  creator: one(users, {
    fields: [familyTrees.createdBy],
    references: [users.id],
    relationName: 'family-tree-creator',
  })
}))

export const familyMembersRelations = relations(familyMembers, ({ one }) => ({
  familyTree: one(familyTrees, {
    fields: [familyMembers.familyTreeId],
    references: [familyTrees.id],
    relationName: 'family-member-family-tree',
  }),
  user: one(users, {
    fields: [familyMembers.userId],
    references: [users.id],
    relationName: 'family-member-user',
  }),
  parentFamilyTree: one(familyMembers, {
    fields: [familyMembers.parentFamilyTreeId],
    references: [familyMembers.id],
    relationName: 'family-member-parent-family-tree',
  }),
  spouse: one(users, {
    fields: [familyMembers.spouseId],
    references: [users.id],
    relationName: 'family-member-spouse',
  }),
}))

export const FCMTokensRelations = relations(FCMTokens, ({ one }) => ({
  user: one(users, {
    fields: [FCMTokens.userId],
    references: [users.id],
    relationName: 'fcm-token-user',
  }),
}))