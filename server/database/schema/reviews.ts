import { pgTable, uuid, text, timestamp, integer, boolean, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { stores } from './stores'

export const reviews = pgTable('vegy_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'),
  isVerified: boolean('is_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, table => [
  index('reviews_user_idx').on(table.userId),
  index('reviews_store_idx').on(table.storeId),
  index('reviews_rating_idx').on(table.rating)
])

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id]
  }),
  store: one(stores, {
    fields: [reviews.storeId],
    references: [stores.id]
  })
}))

export type Review = typeof reviews.$inferSelect
export type NewReview = typeof reviews.$inferInsert
