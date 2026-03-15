import { pgTable, uuid, text, timestamp, decimal, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { stores } from './stores'
import { orders } from './orders'

export const paymentStatusEnum = ['pending', 'approved', 'rejected', 'cancelled', 'refunded'] as const
export const paymentProviderEnum = ['mercadopago', 'cash', 'transfer'] as const

export const payments = pgTable('decomer_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),

  // MercadoPago fields
  preferenceId: text('preference_id'),
  paymentId: text('payment_id'),
  externalReference: text('external_reference'),

  // Amount
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('ARS').notNull(),

  // Status
  status: text('status', { enum: paymentStatusEnum }).default('pending').notNull(),
  statusDetail: text('status_detail'),
  provider: text('provider', { enum: paymentProviderEnum }).default('mercadopago').notNull(),

  // URLs
  initPoint: text('init_point'),
  sandboxInitPoint: text('sandbox_init_point'),

  // Buyer info
  buyerEmail: text('buyer_email'),
  buyerName: text('buyer_name'),

  // Webhook tracking
  webhookEvents: text('webhook_events'),
  lastWebhookAt: timestamp('last_webhook_at'),
  paidAt: timestamp('paid_at'),
  refundedAt: timestamp('refunded_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, table => [
  index('payments_order_idx').on(table.orderId),
  index('payments_user_idx').on(table.userId),
  index('payments_store_idx').on(table.storeId),
  index('payments_status_idx').on(table.status),
  index('payments_preference_idx').on(table.preferenceId),
  index('payments_payment_idx').on(table.paymentId),
  index('payments_external_ref_idx').on(table.externalReference),
  index('payments_created_idx').on(table.createdAt)
])

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id]
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id]
  }),
  store: one(stores, {
    fields: [payments.storeId],
    references: [stores.id]
  })
}))

export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
export type PaymentStatus = typeof paymentStatusEnum[number]
export type PaymentProvider = typeof paymentProviderEnum[number]
