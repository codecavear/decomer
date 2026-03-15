import { pgTable, uuid, timestamp, primaryKey, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { stores } from './stores'

export const favorites = pgTable('decomer_favorites', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, table => [
  primaryKey({ columns: [table.userId, table.storeId] }),
  index('favorites_store_idx').on(table.storeId)
])

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id]
  }),
  store: one(stores, {
    fields: [favorites.storeId],
    references: [stores.id]
  })
}))

export type Favorite = typeof favorites.$inferSelect
export type NewFavorite = typeof favorites.$inferInsert
