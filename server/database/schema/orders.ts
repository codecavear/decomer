import { pgTable, uuid, text, timestamp, decimal, integer, jsonb, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { stores } from './stores'
import { products } from './products'

export const orderStatusEnum = ['pending', 'confirmed', 'preparing', 'ready', 'en_route', 'delivered', 'cancelled'] as const
export const deliveryTypeEnum = ['pickup', 'delivery'] as const
export const paymentStatusEnum = ['pending', 'paid', 'failed', 'refunded'] as const

export const orders = pgTable('decomer_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  status: text('status', { enum: orderStatusEnum }).default('pending').notNull(),
  paymentStatus: text('payment_status', { enum: paymentStatusEnum }).default('pending'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  deliveryType: text('delivery_type', { enum: deliveryTypeEnum }).notNull(),
  deliveryAddress: jsonb('delivery_address'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, table => [
  index('orders_user_idx').on(table.userId),
  index('orders_store_idx').on(table.storeId),
  index('orders_status_idx').on(table.status),
  index('orders_payment_status_idx').on(table.paymentStatus),
  index('orders_created_idx').on(table.createdAt)
])

export const orderItems = pgTable('decomer_order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, table => [
  index('order_items_order_idx').on(table.orderId),
  index('order_items_product_idx').on(table.productId)
])

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id]
  }),
  store: one(stores, {
    fields: [orders.storeId],
    references: [stores.id]
  }),
  items: many(orderItems)
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  })
}))

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
export type OrderStatus = typeof orderStatusEnum[number]
export type DeliveryType = typeof deliveryTypeEnum[number]
export type PaymentStatus = typeof paymentStatusEnum[number]

export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert
