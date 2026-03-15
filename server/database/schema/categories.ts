import { pgTable, uuid, text, timestamp, primaryKey, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { stores } from './stores'

export const categories = pgTable('vegy_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  icon: text('icon'),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, table => [
  uniqueIndex('categories_slug_idx').on(table.slug),
  index('categories_parent_idx').on(table.parentId)
])

export const storeCategories = pgTable('vegy_store_categories', {
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, table => [
  primaryKey({ columns: [table.storeId, table.categoryId] }),
  index('store_categories_category_idx').on(table.categoryId)
])

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id]
  }),
  children: many(categories),
  storeCategories: many(storeCategories)
}))

export const storeCategoriesRelations = relations(storeCategories, ({ one }) => ({
  store: one(stores, {
    fields: [storeCategories.storeId],
    references: [stores.id]
  }),
  category: one(categories, {
    fields: [storeCategories.categoryId],
    references: [categories.id]
  })
}))

export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert

export type StoreCategory = typeof storeCategories.$inferSelect
export type NewStoreCategory = typeof storeCategories.$inferInsert
