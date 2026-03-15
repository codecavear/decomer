import { pgTable, uuid, boolean, integer, timestamp, primaryKey, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { products } from './products'
import { stores } from './stores'

export const storeProducts = pgTable('vegy_store_products', {
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  isAvailable: boolean('is_available').default(true).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, table => [
  primaryKey({ columns: [table.productId, table.storeId] }),
  index('store_products_store_idx').on(table.storeId),
  index('store_products_available_idx').on(table.storeId, table.isAvailable)
])

export const storeProductsRelations = relations(storeProducts, ({ one }) => ({
  product: one(products, {
    fields: [storeProducts.productId],
    references: [products.id]
  }),
  store: one(stores, {
    fields: [storeProducts.storeId],
    references: [stores.id]
  })
}))

export type StoreProduct = typeof storeProducts.$inferSelect
export type NewStoreProduct = typeof storeProducts.$inferInsert
