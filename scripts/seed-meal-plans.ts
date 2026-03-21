#!/usr/bin/env bun
/**
 * Seed script for meal plans and test subscription data
 * Run: bun run scripts/seed-meal-plans.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../server/database/schema'
import {
  mealPlans,
  userMealSubscriptions,
  subscriptionOrders,
  subscriptionOrderItems,
  users,
  viandas,
  type MealPlanType
} from '../server/database/schema'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
const db = drizzle(client, { schema })

async function seed() {
  console.log('🌱 Seeding meal plans database...\n')

  // Check if plans already exist
  const existingPlans = await db.select().from(mealPlans)
  if (existingPlans.length > 0) {
    console.log('✅ Meal plans already exist, skipping seed.')
    console.log(`Found ${existingPlans.length} plans:\n`)
    existingPlans.forEach((plan) => {
      console.log(`  - ${plan.name} (${plan.type}): $${plan.priceWeekly}/week, ${plan.mealsPerWeek} meals`)
    })
    return
  }

  // Get first user for test subscription
  const testUser = await db.select().from(users).limit(1)
  if (testUser.length === 0) {
    console.log('⚠️  No users found. Create a user first.')
    return
  }

  // Get some viandas for test order
  const testViandas = await db.select().from(viandas).limit(3)
  if (testViandas.length === 0) {
    console.log('⚠️  No viandas found. Run viandas seed first.')
    return
  }

  console.log('📦 Creating meal plans...\n')

  const planConfigs = [
    {
      type: 'basico' as MealPlanType,
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
    {
      type: 'full' as MealPlanType,
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
    {
      type: 'premium' as MealPlanType,
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
  ]

  const createdPlans = await db.insert(mealPlans).values(planConfigs).returning()

  console.log('✅ Created meal plans:')
  createdPlans.forEach((plan) => {
    console.log(`  - ${plan.name}: $${plan.priceWeekly}/week, ${plan.mealsPerWeek} meals`)
  })

  console.log('\n📝 Creating test subscription for user:', testUser[0].email)

  // Create test subscription (trial period)
  const basicPlan = createdPlans.find(p => p.type === 'basico')!
  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setDate(periodEnd.getDate() + 7) // 1 week

  const [subscription] = await db.insert(userMealSubscriptions).values({
    userId: testUser[0].id,
    planId: basicPlan.id,
    status: 'trialing',
    frequency: 'weekly',
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    isTrialPeriod: true,
    trialStart: now,
    trialEnd: periodEnd,
    preferredDeliveryDay: 1, // Monday
    deliveryTimeSlot: 'afternoon'
  }).returning()

  console.log('✅ Created test subscription:', subscription.id)

  console.log('\n📦 Creating test order...')

  // Calculate order totals
  const subtotal = parseFloat(basicPlan.priceWeekly)
  const discount = subtotal * 0.20 // 20% trial discount
  const deliveryFee = 0
  const total = subtotal - discount + deliveryFee

  const deliveryDate = new Date(now)
  deliveryDate.setDate(deliveryDate.getDate() + 2) // 2 days from now

  const [order] = await db.insert(subscriptionOrders).values({
    userId: testUser[0].id,
    subscriptionId: subscription.id,
    type: 'subscription',
    status: 'pending',
    subtotal: subtotal.toString(),
    discount: discount.toString(),
    deliveryFee: deliveryFee.toString(),
    total: total.toString(),
    deliveryAddress: testUser[0].deliveryAddress || 'Av. Colón 1234, Córdoba',
    deliveryNeighborhood: testUser[0].deliveryNeighborhood || 'Centro',
    deliveryDate,
    deliveryTimeSlot: 'afternoon',
    paymentMethod: 'mercadopago',
    paymentStatus: 'pending'
  }).returning()

  console.log('✅ Created test order:', order.id)

  console.log('\n📦 Creating order items...')

  // Add viandas to order (5 meals for basic plan)
  const orderItemsData = testViandas.slice(0, 3).map(vianda => ({
    orderId: order.id,
    viandaId: vianda.id,
    quantity: 1,
    unitPrice: vianda.price,
    subtotal: vianda.price,
    viandaSnapshot: {
      name: vianda.name,
      description: vianda.description,
      imageUrl: vianda.imageUrl,
      calories: vianda.calories,
      protein: vianda.protein?.toString(),
      carbs: vianda.carbs?.toString(),
      fats: vianda.fats?.toString(),
      ingredients: vianda.ingredients as string[]
    }
  }))

  const orderItems = await db.insert(subscriptionOrderItems).values(orderItemsData).returning()

  console.log('✅ Created order items:', orderItems.length)

  console.log('\n✨ Seed complete!\n')
  console.log('Summary:')
  console.log(`  - ${createdPlans.length} meal plans created`)
  console.log(`  - 1 test subscription created (trial period)`)
  console.log(`  - 1 test order created`)
  console.log(`  - ${orderItems.length} order items created`)
}

seed().catch(console.error)
