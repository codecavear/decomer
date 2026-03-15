import { pgTable, uuid, text, timestamp, decimal, boolean, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { stores } from './stores'

export const products = pgTable('vegy_products', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  imagePublicId: text('image_public_id'),
  isAvailable: boolean('is_available').default(true).notNull(),
  isVegan: boolean('is_vegan').default(true).notNull(),
  category: text('category'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, table => [
  index('products_store_idx').on(table.storeId),
  index('products_available_idx').on(table.isAvailable)
])

export const productsRelations = relations(products, ({ one }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id]
  })
}))

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
