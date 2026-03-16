import { pgTable, uuid, text, timestamp, decimal, boolean, integer, index, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Vianda (meal prep item)
export const viandas = pgTable('decomer_viandas', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  imageUrl: text('image_url'),
  imagePublicId: text('image_public_id'),

  // Macros
  calories: integer('calories'),
  protein: decimal('protein', { precision: 5, scale: 1 }), // gramos
  carbs: decimal('carbs', { precision: 5, scale: 1 }), // gramos
  fats: decimal('fats', { precision: 5, scale: 1 }), // gramos

  // Filters
  isVegetarian: boolean('is_vegetarian').default(false).notNull(),
  isVegan: boolean('is_vegan').default(false).notNull(),
  isGlutenFree: boolean('is_gluten_free').default(false).notNull(),
  isLowCarb: boolean('is_low_carb').default(false).notNull(),
  isHighProtein: boolean('is_high_protein').default(false).notNull(),

  // Ingredients (stored as JSON array)
  ingredients: jsonb('ingredients').$type<string[]>(),

  // Availability
  isAvailable: boolean('is_available').default(true).notNull(),

  // Pricing
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, table => [
  index('viandas_slug_idx').on(table.slug),
  index('viandas_available_idx').on(table.isAvailable),
  index('viandas_vegetarian_idx').on(table.isVegetarian),
  index('viandas_gluten_free_idx').on(table.isGlutenFree),
  index('viandas_low_carb_idx').on(table.isLowCarb),
  index('viandas_high_protein_idx').on(table.isHighProtein)
])

// Weekly menu (which viandas are available this week)
export const weeklyMenus = pgTable('decomer_weekly_menus', {
  id: uuid('id').defaultRandom().primaryKey(),
  weekStart: timestamp('week_start').notNull(), // Monday of the week
  weekEnd: timestamp('week_end').notNull(), // Sunday of the week
  isActive: boolean('is_active').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, table => [
  index('weekly_menus_active_idx').on(table.isActive),
  index('weekly_menus_week_start_idx').on(table.weekStart)
])

// Join table: which viandas are in which weekly menu
export const weeklyMenuViandas = pgTable('decomer_weekly_menu_viandas', {
  id: uuid('id').defaultRandom().primaryKey(),
  weeklyMenuId: uuid('weekly_menu_id').notNull().references(() => weeklyMenus.id, { onDelete: 'cascade' }),
  viandaId: uuid('vianda_id').notNull().references(() => viandas.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week'), // 0-6, null = available all week
  isAvailable: boolean('is_available').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, table => [
  index('weekly_menu_viandas_menu_idx').on(table.weeklyMenuId),
  index('weekly_menu_viandas_vianda_idx').on(table.viandaId),
  index('weekly_menu_viandas_day_idx').on(table.dayOfWeek)
])

// Relations
export const viandasRelations = relations(viandas, ({ many }) => ({
  weeklyMenuViandas: many(weeklyMenuViandas)
}))

export const weeklyMenusRelations = relations(weeklyMenus, ({ many }) => ({
  viandas: many(weeklyMenuViandas)
}))

export const weeklyMenuViandasRelations = relations(weeklyMenuViandas, ({ one }) => ({
  weeklyMenu: one(weeklyMenus, {
    fields: [weeklyMenuViandas.weeklyMenuId],
    references: [weeklyMenus.id]
  }),
  vianda: one(viandas, {
    fields: [weeklyMenuViandas.viandaId],
    references: [viandas.id]
  })
}))

// Types
export type Vianda = typeof viandas.$inferSelect
export type NewVianda = typeof viandas.$inferInsert
export type WeeklyMenu = typeof weeklyMenus.$inferSelect
export type NewWeeklyMenu = typeof weeklyMenus.$inferInsert
export type WeeklyMenuVianda = typeof weeklyMenuViandas.$inferSelect
export type NewWeeklyMenuVianda = typeof weeklyMenuViandas.$inferInsert
