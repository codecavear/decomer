import { pgTable, uuid, text, timestamp, decimal, integer, boolean, time, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

export const storeStatusEnum = ['pending', 'active', 'suspended'] as const
export const storeTypeEnum = ['catalog', 'pickup', 'delivery', 'pickup_delivery'] as const
export const contactTypeEnum = ['phone', 'whatsapp', 'email', 'instagram', 'facebook', 'twitter', 'website'] as const

export const stores = pgTable('decomer_stores', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  logoUrl: text('logo_url'),
  logoPublicId: text('logo_public_id'),
  bannerUrl: text('banner_url'),
  bannerPublicId: text('banner_public_id'),
  status: text('status', { enum: storeStatusEnum }).default('pending').notNull(),
  type: text('type', { enum: storeTypeEnum }).default('catalog').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, table => [
  uniqueIndex('stores_slug_idx').on(table.slug),
  index('stores_owner_idx').on(table.ownerId),
  index('stores_status_idx').on(table.status),
  index('stores_type_idx').on(table.type)
])

export const storeLocations = pgTable('decomer_store_locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  address: text('address').notNull(),
  city: text('city').notNull(),
  country: text('country').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  neighborhood: text('neighborhood'),
  apartment: text('apartment'),
  isPrimary: boolean('is_primary').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, table => [
  index('store_locations_store_idx').on(table.storeId),
  index('store_locations_coordinates_idx').on(table.latitude, table.longitude)
])

export const storeSchedules = pgTable('decomer_store_schedules', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6 (Sunday to Saturday)
  openTime: time('open_time'),
  closeTime: time('close_time'),
  isClosed: boolean('is_closed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, table => [
  index('store_schedules_store_idx').on(table.storeId)
])

export const storeContacts = pgTable('decomer_store_contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  type: text('type', { enum: contactTypeEnum }).notNull(),
  value: text('value').notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, table => [
  index('store_contacts_store_idx').on(table.storeId)
])

export const storesRelations = relations(stores, ({ one, many }) => ({
  owner: one(users, {
    fields: [stores.ownerId],
    references: [users.id]
  }),
  locations: many(storeLocations),
  schedules: many(storeSchedules),
  contacts: many(storeContacts)
}))

export const storeLocationsRelations = relations(storeLocations, ({ one }) => ({
  store: one(stores, {
    fields: [storeLocations.storeId],
    references: [stores.id]
  })
}))

export const storeSchedulesRelations = relations(storeSchedules, ({ one }) => ({
  store: one(stores, {
    fields: [storeSchedules.storeId],
    references: [stores.id]
  })
}))

export const storeContactsRelations = relations(storeContacts, ({ one }) => ({
  store: one(stores, {
    fields: [storeContacts.storeId],
    references: [stores.id]
  })
}))

export type Store = typeof stores.$inferSelect
export type NewStore = typeof stores.$inferInsert
export type StoreStatus = typeof storeStatusEnum[number]
export type StoreType = typeof storeTypeEnum[number]

export type _StoreLocation = typeof storeLocations.$inferSelect
export type NewStoreLocation = typeof storeLocations.$inferInsert

export type StoreSchedule = typeof storeSchedules.$inferSelect
export type NewStoreSchedule = typeof storeSchedules.$inferInsert

export type StoreContact = typeof storeContacts.$inferSelect
export type NewStoreContact = typeof storeContacts.$inferInsert
export type ContactType = typeof contactTypeEnum[number]
