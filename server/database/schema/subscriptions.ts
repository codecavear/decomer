import { pgTable, uuid, text, timestamp, boolean, decimal, integer, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { stores } from './stores'

export const subscriptionPlanEnum = ['free', 'pro', 'business'] as const
export const subscriptionStatusEnum = ['active', 'cancelled', 'past_due', 'trialing'] as const
export const billingCycleEnum = ['monthly', 'yearly'] as const

// Subscription Plans - defines available plans
export const subscriptionPlans = pgTable('decomer_subscription_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(), // Free, Pro, Business
  slug: text('slug').notNull().unique(), // free, pro, business
  description: text('description'),
  priceMonthly: decimal('price_monthly', { precision: 10, scale: 2 }).notNull(),
  priceYearly: decimal('price_yearly', { precision: 10, scale: 2 }).notNull(),

  // Plan limits
  maxProducts: integer('max_products').default(-1).notNull(), // -1 = unlimited
  maxLocations: integer('max_locations').default(1).notNull(),
  maxImagesPerProduct: integer('max_images_per_product').default(1).notNull(),

  // Features
  featuresEnabled: text('features_enabled').array(), // ['analytics', 'priority_support', 'custom_domain', etc.]

  isActive: boolean('is_active').default(true).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Store Subscriptions - tracks which stores have which plan
export const storeSubscriptions = pgTable('decomer_store_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  planId: uuid('plan_id').notNull().references(() => subscriptionPlans.id),
  status: text('status', { enum: subscriptionStatusEnum }).default('active').notNull(),
  billingCycle: text('billing_cycle', { enum: billingCycleEnum }).default('monthly').notNull(),

  // Billing dates
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),

  // Payment provider info (for future integration)
  externalId: text('external_id'), // Stripe subscription ID or similar
  externalCustomerId: text('external_customer_id'), // Stripe customer ID

  // Trial info
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, table => [
  index('store_subscriptions_store_idx').on(table.storeId),
  index('store_subscriptions_status_idx').on(table.status),
  index('store_subscriptions_period_end_idx').on(table.currentPeriodEnd)
])

// Relations
export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  storeSubscriptions: many(storeSubscriptions)
}))

export const storeSubscriptionsRelations = relations(storeSubscriptions, ({ one }) => ({
  store: one(stores, {
    fields: [storeSubscriptions.storeId],
    references: [stores.id]
  }),
  plan: one(subscriptionPlans, {
    fields: [storeSubscriptions.planId],
    references: [subscriptionPlans.id]
  })
}))

// Types
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert
export type SubscriptionPlanSlug = typeof subscriptionPlanEnum[number]

export type StoreSubscription = typeof storeSubscriptions.$inferSelect
export type NewStoreSubscription = typeof storeSubscriptions.$inferInsert
export type SubscriptionStatus = typeof subscriptionStatusEnum[number]
export type BillingCycle = typeof billingCycleEnum[number]

// Plan feature constants
export const PLAN_FEATURES = {
  free: {
    maxProducts: 10,
    maxLocations: 1,
    maxImagesPerProduct: 1,
    features: ['basic_analytics']
  },
  pro: {
    maxProducts: 100,
    maxLocations: 3,
    maxImagesPerProduct: 5,
    features: ['basic_analytics', 'advanced_analytics', 'priority_support', 'custom_hours']
  },
  business: {
    maxProducts: -1, // unlimited
    maxLocations: -1, // unlimited
    maxImagesPerProduct: 10,
    features: ['basic_analytics', 'advanced_analytics', 'priority_support', 'custom_hours', 'api_access', 'white_label']
  }
} as const
