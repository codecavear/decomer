import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const pushSubscriptions = pgTable('decomer_push_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export type PushSubscription = typeof pushSubscriptions.$inferSelect
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert
