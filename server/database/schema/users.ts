import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const userRoleEnum = ['user', 'store_owner', 'admin'] as const

export const users = pgTable('decomer_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  googleId: text('google_id').unique(),
  email: text('email').unique().notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  role: text('role', { enum: userRoleEnum }).default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type UserRole = typeof userRoleEnum[number]
