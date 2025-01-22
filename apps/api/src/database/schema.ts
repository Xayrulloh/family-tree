import {
  pgTable,
  timestamp,
  text,
  boolean,
  uuid,
} from 'drizzle-orm/pg-core';

const baseTable = {
  id: uuid('id').primaryKey(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}

export const users = pgTable('users', {
  username: text('username').notNull(),
  name: text('name').notNull(),
  surname: text('surname').notNull(),
  alive: boolean('alive').default(true).notNull(),
  ...baseTable
});