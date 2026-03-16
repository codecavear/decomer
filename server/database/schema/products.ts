import { pgTable, uuid, text, timestamp, decimal, boolean, index, integer, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { stores } from './stores'

export const products = pgTable('decomer_products', {
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

  // Nutritional information
  calories: integer('calories'), // kcal
  protein: decimal('protein', { precision: 5, scale: 1 }), // grams
  carbs: decimal('carbs', { precision: 5, scale: 1 }), // grams
  fat: decimal('fat', { precision: 5, scale: 1 }), // grams
  fiber: decimal('fiber', { precision: 5, scale: 1 }), // grams (optional)

  // Ingredients & allergens
  ingredients: text('ingredients'), // comma-separated list
  allergens: text('allergens'), // comma-separated list (_e.g., "gluten, lactose, nuts")

  // Dietary filters
  isGlutenFree: boolean('is_gluten_free').default(false).notNull(),
  isLowCarb: boolean('is_low_carb').default(false).notNull(), // < 20g carbs
  isHighProtein: boolean('is_high_protein').default(false).notNull(), // > 25g protein
  isVegetarian: boolean('is_vegetarian').default(false).notNull(),

  // Additional metadata
  tags: jsonb('tags').$type<string[]>(), // _e.g., ["fit", "detox", "comfort"]

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, table => [
  index('products_store_idx').on(table.storeId),
  index('products_available_idx').on(table.isAvailable),
  index('products_vegan_idx').on(table.isVegan),
  index('products_gluten_free_idx').on(table.isGlutenFree),
  index('products_low_carb_idx').on(table.isLowCarb),
  index('products_high_protein_idx').on(table.isHighProtein)
])

export const productsRelations = relations(products, ({ one }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id]
  })
}))

export type _Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
