import {
  FamilyTreeMemberConnectionEnum,
  FCMTokenDeviceEnum,
  UserGenderEnum,
} from '@family-tree/shared';
import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

// enums
export const DrizzleUserGenderEnum = pgEnum('user_gender', [
  UserGenderEnum.MALE,
  UserGenderEnum.FEMALE,
  UserGenderEnum.UNKNOWN,
]);
export const DrizzleMemberGenderEnum = pgEnum('member_gender', [
  UserGenderEnum.MALE,
  UserGenderEnum.FEMALE,
]);
export const DrizzleFCMTokenDeviceEnum = pgEnum('fcm_token_device_type', [
  FCMTokenDeviceEnum.ANDROID,
  FCMTokenDeviceEnum.IOS,
  FCMTokenDeviceEnum.WEB,
]);
export const DrizzleFamilyTreeMemberConnectionEnum = pgEnum(
  'family_tree_member_connection',
  [
    FamilyTreeMemberConnectionEnum.SPOUSE,
    FamilyTreeMemberConnectionEnum.PARENT,
  ],
);

// schemas
const baseSchema = {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
  deletedAt: timestamp('deleted_at', { mode: 'string', withTimezone: true }),
};

export const usersSchema = pgTable('users', {
  email: text('email').unique().notNull(),
  username: text('username').notNull(),
  name: text('name').notNull(),
  image: text('image'),
  gender: DrizzleUserGenderEnum('gender').notNull(),
  description: text('description'),
  dob: date('dob', { mode: 'string' }),
  dod: date('dod', { mode: 'string' }),
  ...baseSchema,
});

export const familyTreesSchema = pgTable(
  'family_trees',
  {
    name: text('name').notNull(),
    createdBy: uuid('created_by')
      .references(() => usersSchema.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    image: text('image'),
    isPublic: boolean('is_public').notNull().default(false),
    visitCount: integer('visit_count').notNull().default(0),
    ...baseSchema,
  },
  (table) => ({
    nameAndUserIdx: unique('name_and_user_idx').on(table.name, table.createdBy),
    isPublicIdx: index('is_public_idx').on(table.isPublic),
    // Serves the public listing: filter on is_public, then order by
    // visit_count/created_at/id. Postgres scans this backwards to satisfy the
    // all-DESC ordering, so no separate DESC index is needed.
    publicVisitRankIdx: index('public_visit_rank_idx').on(
      table.isPublic,
      table.visitCount,
      table.createdAt,
      table.id,
    ),
  }),
);

export const sharedFamilyTreesSchema = pgTable(
  'shared_family_trees',
  {
    familyTreeId: uuid('family_tree_id')
      .references(() => familyTreesSchema.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => usersSchema.id, { onDelete: 'cascade' })
      .notNull(),
    isBlocked: boolean('is_blocked').notNull().default(false),
    canEditMembers: boolean('can_edit_members').notNull().default(false),
    canDeleteMembers: boolean('can_delete_members').notNull().default(false),
    canAddMembers: boolean('can_add_members').notNull().default(false),
    ...baseSchema,
  },
  (table) => ({
    familyTreeAndUserIdx: unique('family_tree_and_user_idx').on(
      table.familyTreeId,
      table.userId,
    ),
  }),
);

export const familyTreeMembersSchema = pgTable('family_tree_members', {
  name: text('name').notNull(),
  image: text('image'),
  gender: DrizzleMemberGenderEnum('gender').notNull(),
  description: text('description'),
  dob: date('dob', { mode: 'string' }),
  dod: date('dod', { mode: 'string' }),
  familyTreeId: uuid('family_tree_id')
    .references(() => familyTreesSchema.id, { onDelete: 'cascade' })
    .notNull(),
  ...baseSchema,
});

export const familyTreeMemberConnectionsSchema = pgTable(
  'family_tree_member_connections',
  {
    familyTreeId: uuid('family_tree_id')
      .references(() => familyTreesSchema.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    fromMemberId: uuid('from_member_id')
      .references(() => familyTreeMembersSchema.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    toMemberId: uuid('to_member_id')
      .references(() => familyTreeMembersSchema.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    type: DrizzleFamilyTreeMemberConnectionEnum('type').notNull(),
    ...baseSchema,
  },
);

export const FCMTokensSchema = pgTable('fcm_tokens', {
  token: text('token').notNull(),
  userId: uuid('user_id')
    .references(() => usersSchema.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  deviceType: DrizzleFCMTokenDeviceEnum('device_type').notNull(),
  ...baseSchema,
});

export const notificationsSchema = pgTable('notifications', {
  content: text('content').notNull(),
  receiverUserId: uuid('receiver_user_id')
    .references(() => usersSchema.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  senderUserId: uuid('sender_user_id')
    .references(() => usersSchema.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  ...baseSchema,
});

export const notificationReadsSchema = pgTable('notification_reads', {
  userId: uuid('user_id')
    .references(() => usersSchema.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .primaryKey(),
  updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
    .defaultNow()
    .notNull(),
});

// relations
export const usersRelations = relations(usersSchema, ({ many }) => ({
  familyTrees: many(familyTreesSchema, {
    relationName: 'created_family_trees',
  }),
  fcmTokens: many(FCMTokensSchema, { relationName: 'user_fcm_tokens' }),
  sentNotifications: many(notificationsSchema, {
    relationName: 'sent_notifications',
  }),
  receivedNotifications: many(notificationsSchema, {
    relationName: 'received_notifications',
  }),
  notificationReads: many(notificationReadsSchema),
}));

export const familyTreesRelations = relations(
  familyTreesSchema,
  ({ one, many }) => ({
    creator: one(usersSchema, {
      fields: [familyTreesSchema.createdBy],
      references: [usersSchema.id],
      relationName: 'created_family_trees',
    }),
    familyTreeMembers: many(familyTreeMembersSchema, {
      relationName: 'tree_members',
    }),
    familyTreeMemberConnections: many(familyTreeMemberConnectionsSchema, {
      relationName: 'tree_connections',
    }),
  }),
);

export const sharedFamilyTreesRelations = relations(
  sharedFamilyTreesSchema,
  ({ one }) => ({
    familyTree: one(familyTreesSchema, {
      fields: [sharedFamilyTreesSchema.familyTreeId],
      references: [familyTreesSchema.id],
      relationName: 'shared_family_trees',
    }),
    sharedWithUser: one(usersSchema, {
      fields: [sharedFamilyTreesSchema.userId],
      references: [usersSchema.id],
      relationName: 'shared_family_trees',
    }),
  }),
);

export const familyTreeMembersRelations = relations(
  familyTreeMembersSchema,
  ({ many, one }) => ({
    fromConnections: many(familyTreeMemberConnectionsSchema, {
      relationName: 'from_member_connections',
    }),
    toConnections: many(familyTreeMemberConnectionsSchema, {
      relationName: 'to_member_connections',
    }),
    familyTree: one(familyTreesSchema, {
      fields: [familyTreeMembersSchema.familyTreeId],
      references: [familyTreesSchema.id],
      relationName: 'tree_members',
    }),
  }),
);

export const familyTreeMemberConnectionsRelations = relations(
  familyTreeMemberConnectionsSchema,
  ({ one }) => ({
    fromMember: one(familyTreeMembersSchema, {
      fields: [familyTreeMemberConnectionsSchema.fromMemberId],
      references: [familyTreeMembersSchema.id],
      relationName: 'from_member_connections',
    }),
    toMember: one(familyTreeMembersSchema, {
      fields: [familyTreeMemberConnectionsSchema.toMemberId],
      references: [familyTreeMembersSchema.id],
      relationName: 'to_member_connections',
    }),
    familyTree: one(familyTreesSchema, {
      fields: [familyTreeMemberConnectionsSchema.familyTreeId],
      references: [familyTreesSchema.id],
      relationName: 'tree_connections',
    }),
  }),
);

export const FCMTokensRelations = relations(FCMTokensSchema, ({ one }) => ({
  user: one(usersSchema, {
    fields: [FCMTokensSchema.userId],
    references: [usersSchema.id],
    relationName: 'user_fcm_tokens',
  }),
}));

export const notificationsRelations = relations(
  notificationsSchema,
  ({ one }) => ({
    sender: one(usersSchema, {
      fields: [notificationsSchema.senderUserId],
      references: [usersSchema.id],
      relationName: 'sent_notifications',
    }),
    receiver: one(usersSchema, {
      fields: [notificationsSchema.receiverUserId],
      references: [usersSchema.id],
      relationName: 'received_notifications',
    }),
  }),
);

export const notificationReadsRelations = relations(
  notificationReadsSchema,
  ({ one }) => ({
    user: one(usersSchema, {
      fields: [notificationReadsSchema.userId],
      references: [usersSchema.id],
    }),
  }),
);
