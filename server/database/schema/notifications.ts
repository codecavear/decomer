import { pgTable, text, timestamp, uuid, varchar, jsonb } from 'drizzle-orm/pg-core'
import { users } from './users'

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),

  // Notification details
  channel: varchar('channel', { length: 20 }).notNull(), // 'sms' | 'whatsapp' | 'email' | 'push'
  type: varchar('type', { length: 50 }).notNull(), // e.g., 'order_confirmed', 'order_en_route', etc.
  to: varchar('to', { length: 100 }).notNull(), // Phone number, email, or push token
  message: text('message').notNull(),

  // Metadata
  metadata: jsonb('metadata'), // Order ID, links, etc.

  // Delivery tracking
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending' | 'sent' | 'failed' | 'delivered'
  externalId: varchar('external_id', { length: 100 }), // Twilio SID, email ID, etc.
  error: text('error'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at')
})

export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert
