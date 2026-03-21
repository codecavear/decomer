import { pgTable, uuid, text, timestamp, decimal, integer, index, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { userMealSubscriptions } from './mealPlans'
import { viandas } from './viandas'

export const subscriptionOrderTypeEnum = ['subscription', 'one_time'] as const
export const subscriptionOrderStatusEnum = ['pending', 'confirmed', 'preparing', 'ready', 'en_route', 'delivered', 'cancelled'] as const
export const paymentMethodEnum = ['mercadopago', 'cash', 'transfer'] as const

// Subscription Orders - both recurring and one-time purchases
export const subscriptionOrders = pgTable('decomer_subscription_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: uuid('subscription_id').references(() => userMealSubscriptions.id, { onDelete: 'set null' }), // null for one-time orders

  type: text('type', { enum: subscriptionOrderTypeEnum }).notNull(),
  status: text('status', { enum: subscriptionOrderStatusEnum }).default('pending').notNull(),

  // Pricing
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0').notNull(), // Trial discount
  deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }).default('0').notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),

  // Delivery info
  deliveryAddress: text('delivery_address').notNull(),
  deliveryNeighborhood: text('delivery_neighborhood'),
  deliveryDate: timestamp('delivery_date').notNull(),
  deliveryTimeSlot: text('delivery_time_slot'), // "morning", "afternoon", "evening"
  deliveryNotes: text('delivery_notes'),

  // Payment
  paymentMethod: text('payment_method', { enum: paymentMethodEnum }).notNull(),
  paymentStatus: text('payment_status').default('pending').notNull(), // 'pending', 'paid', 'failed', 'refunded'
  paidAt: timestamp('paid_at'),

  // MercadoPago integration
  mercadopagoPaymentId: text('mercadopago_payment_id').unique(),
  mercadopagoPreferenceId: text('mercadopago_preference_id'),
  mercadopagoStatus: text('mercadopago_status'),

  // Fulfillment tracking
  preparedAt: timestamp('prepared_at'),
  deliveredAt: timestamp('delivered_at'),
  cancelledAt: timestamp('cancelled_at'),
  cancelReason: text('cancel_reason'),

  // Notes
  customerNotes: text('customer_notes'),
  kitchenNotes: text('kitchen_notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, table => [
  index('subscription_orders_user_idx').on(table.userId),
  index('subscription_orders_subscription_idx').on(table.subscriptionId),
  index('subscription_orders_status_idx').on(table.status),
  index('subscription_orders_delivery_date_idx').on(table.deliveryDate),
  index('subscription_orders_payment_status_idx').on(table.paymentStatus),
  index('subscription_orders_mp_payment_idx').on(table.mercadopagoPaymentId)
])

// Order Items - which viandas are in each order
export const subscriptionOrderItems = pgTable('decomer_subscription_order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => subscriptionOrders.id, { onDelete: 'cascade' }),
  viandaId: uuid('vianda_id').notNull().references(() => viandas.id, { onDelete: 'restrict' }),

  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),

  // Snapshot of vianda details at time of order (for historical accuracy)
  viandaSnapshot: jsonb('vianda_snapshot').$type<{
    name: string
    description?: string
    imageUrl?: string
    calories?: number
    protein?: string
    carbs?: string
    fats?: string
    ingredients?: string[]
  }>(),

  customerNotes: text('customer_notes'), // e.g., "sin cebolla"

  createdAt: timestamp('created_at').defaultNow().notNull()
}, table => [
  index('subscription_order_items_order_idx').on(table.orderId),
  index('subscription_order_items_vianda_idx').on(table.viandaId)
])

// Relations
export const subscriptionOrdersRelations = relations(subscriptionOrders, ({ one, many }) => ({
  user: one(users, {
    fields: [subscriptionOrders.userId],
    references: [users.id]
  }),
  subscription: one(userMealSubscriptions, {
    fields: [subscriptionOrders.subscriptionId],
    references: [userMealSubscriptions.id]
  }),
  items: many(subscriptionOrderItems)
}))

export const subscriptionOrderItemsRelations = relations(subscriptionOrderItems, ({ one }) => ({
  order: one(subscriptionOrders, {
    fields: [subscriptionOrderItems.orderId],
    references: [subscriptionOrders.id]
  }),
  vianda: one(viandas, {
    fields: [subscriptionOrderItems.viandaId],
    references: [viandas.id]
  })
}))

// Types
export type SubscriptionOrder = typeof subscriptionOrders.$inferSelect
export type NewSubscriptionOrder = typeof subscriptionOrders.$inferInsert
export type SubscriptionOrderType = typeof subscriptionOrderTypeEnum[number]
export type SubscriptionOrderStatus = typeof subscriptionOrderStatusEnum[number]
export type PaymentMethod = typeof paymentMethodEnum[number]

export type SubscriptionOrderItem = typeof subscriptionOrderItems.$inferSelect
export type NewSubscriptionOrderItem = typeof subscriptionOrderItems.$inferInsert
