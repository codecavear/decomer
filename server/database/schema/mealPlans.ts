import { pgTable, uuid, text, timestamp, boolean, decimal, integer, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

export const mealPlanTypeEnum = ['basico', 'full', 'premium'] as const
export const mealPlanStatusEnum = ['active', 'paused', 'cancelled', 'trialing'] as const
export const subscriptionFrequencyEnum = ['weekly', 'monthly'] as const

// Meal Plans - defines available subscription plans for users
export const mealPlans = pgTable('decomer_meal_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type', { enum: mealPlanTypeEnum }).notNull().unique(),
  name: text('name').notNull(), // "Plan Básico", "Plan Full", "Plan Premium"
  description: text('description'),

  // Pricing
  priceWeekly: decimal('price_weekly', { precision: 10, scale: 2 }).notNull(),
  priceMonthly: decimal('price_monthly', { precision: 10, scale: 2 }).notNull(),

  // Discount for trial (20% off first period)
  trialDiscountPercent: integer('trial_discount_percent').default(20).notNull(),

  // Plan features
  mealsPerWeek: integer('meals_per_week').notNull(), // 5, 10, 14
  canCustomize: boolean('can_customize').default(false).notNull(), // Can choose specific meals
  includesDelivery: boolean('includes_delivery').default(true).notNull(),
  priorityDelivery: boolean('priority_delivery').default(false).notNull(), // Premium gets priority slots

  // Availability
  isActive: boolean('is_active').default(true).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, table => [
  index('meal_plans_type_idx').on(table.type),
  index('meal_plans_active_idx').on(table.isActive)
])

// User Meal Subscriptions - tracks active subscriptions
export const userMealSubscriptions = pgTable('decomer_user_meal_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  planId: uuid('plan_id').notNull().references(() => mealPlans.id),

  status: text('status', { enum: mealPlanStatusEnum }).default('active').notNull(),
  frequency: text('frequency', { enum: subscriptionFrequencyEnum }).default('weekly').notNull(),

  // Billing dates
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),

  // Trial period
  isTrialPeriod: boolean('is_trial_period').default(false).notNull(),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),

  // Pause/cancel management
  pausedAt: timestamp('paused_at'),
  pauseReason: text('pause_reason'),
  cancelledAt: timestamp('cancelled_at'),
  cancelReason: text('cancel_reason'),
  willCancelAt: timestamp('will_cancel_at'), // Cancel at end of period

  // MercadoPago integration
  mercadopagoSubscriptionId: text('mercadopago_subscription_id').unique(),
  mercadopagoCustomerId: text('mercadopago_customer_id'),
  lastPaymentId: text('last_payment_id'),
  lastPaymentStatus: text('last_payment_status'),

  // Delivery preferences
  preferredDeliveryDay: integer('preferred_delivery_day'), // 0-6 (Sunday-Saturday)
  deliveryTimeSlot: text('delivery_time_slot'), // "morning", "afternoon", "evening"

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, table => [
  index('user_meal_subscriptions_user_idx').on(table.userId),
  index('user_meal_subscriptions_status_idx').on(table.status),
  index('user_meal_subscriptions_period_end_idx').on(table.currentPeriodEnd),
  index('user_meal_subscriptions_mp_subscription_idx').on(table.mercadopagoSubscriptionId)
])

// Subscription History - track plan changes
export const subscriptionHistory = pgTable('decomer_subscription_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  subscriptionId: uuid('subscription_id').notNull().references(() => userMealSubscriptions.id, { onDelete: 'cascade' }),

  action: text('action').notNull(), // 'created', 'upgraded', 'downgraded', 'paused', 'resumed', 'cancelled'
  fromPlanId: uuid('from_plan_id').references(() => mealPlans.id),
  toPlanId: uuid('to_plan_id').references(() => mealPlans.id),

  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, table => [
  index('subscription_history_subscription_idx').on(table.subscriptionId),
  index('subscription_history_created_idx').on(table.createdAt)
])

// Relations
export const mealPlansRelations = relations(mealPlans, ({ many }) => ({
  subscriptions: many(userMealSubscriptions)
}))

export const userMealSubscriptionsRelations = relations(userMealSubscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [userMealSubscriptions.userId],
    references: [users.id]
  }),
  plan: one(mealPlans, {
    fields: [userMealSubscriptions.planId],
    references: [mealPlans.id]
  }),
  history: many(subscriptionHistory)
}))

export const subscriptionHistoryRelations = relations(subscriptionHistory, ({ one }) => ({
  subscription: one(userMealSubscriptions, {
    fields: [subscriptionHistory.subscriptionId],
    references: [userMealSubscriptions.id]
  }),
  fromPlan: one(mealPlans, {
    fields: [subscriptionHistory.fromPlanId],
    references: [mealPlans.id]
  }),
  toPlan: one(mealPlans, {
    fields: [subscriptionHistory.toPlanId],
    references: [mealPlans.id]
  })
}))

// Types
export type MealPlan = typeof mealPlans.$inferSelect
export type NewMealPlan = typeof mealPlans.$inferInsert
export type MealPlanType = typeof mealPlanTypeEnum[number]

export type UserMealSubscription = typeof userMealSubscriptions.$inferSelect
export type NewUserMealSubscription = typeof userMealSubscriptions.$inferInsert
export type MealPlanStatus = typeof mealPlanStatusEnum[number]
export type SubscriptionFrequency = typeof subscriptionFrequencyEnum[number]

export type SubscriptionHistory = typeof subscriptionHistory.$inferSelect
export type NewSubscriptionHistory = typeof subscriptionHistory.$inferInsert

// Default plan configurations
export const DEFAULT_MEAL_PLANS = {
  basico: {
    type: 'basico' as const,
    name: 'Plan Básico',
    description: '5 viandas semanales, menú fijo, delivery estándar',
    priceWeekly: '2500.00',
    priceMonthly: '9000.00',
    mealsPerWeek: 5,
    canCustomize: false,
    includesDelivery: true,
    priorityDelivery: false,
    displayOrder: 1
  },
  full: {
    type: 'full' as const,
    name: 'Plan Full',
    description: '10 viandas semanales, menú personalizable, delivery estándar',
    priceWeekly: '4500.00',
    priceMonthly: '16000.00',
    mealsPerWeek: 10,
    canCustomize: true,
    includesDelivery: true,
    priorityDelivery: false,
    displayOrder: 2
  },
  premium: {
    type: 'premium' as const,
    name: 'Plan Premium',
    description: '14 viandas semanales, menú personalizable, delivery prioritario',
    priceWeekly: '6000.00',
    priceMonthly: '21000.00',
    mealsPerWeek: 14,
    canCustomize: true,
    includesDelivery: true,
    priorityDelivery: true,
    displayOrder: 3
  }
} as const
