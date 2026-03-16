import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const userRoleEnum = ['user', 'store_owner', 'admin'] as const

export const users = pgTable('decomer_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  googleId: text('google_id').unique(),
  email: text('email').unique().notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  role: text('role', { enum: userRoleEnum }).default('user').notNull(),
  // Profile fields
  phone: text('phone'),
  deliveryAddress: text('delivery_address'),
  deliveryNeighborhood: text('delivery_neighborhood'),
  deliveryNotes: text('delivery_notes'),
  allergies: jsonb('allergies').$type<string[]>().default([]),
  preferences: jsonb('preferences').$type<string[]>().default([]),
  deliverySchedule: jsonb('delivery_schedule').$type<{ start: string; end: string } | null>().default(null),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type UserRole = typeof userRoleEnum[number]
