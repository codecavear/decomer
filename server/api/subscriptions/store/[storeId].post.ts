import { _eq } from 'drizzle-orm'
import { z } from 'zod'
import { storeSubscriptions, subscriptionPlans, stores } from '../../../database/schema'

const subscribeSchema = z.object({
  planId: z.string().uuid(),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly')
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const storeId = getRouterParam(event, 'storeId')
  if (!storeId) {
    throw createError({ statusCode: 400, message: 'Store ID is required' })
  }

  const body = await readBody(event)
  const validation = subscribeSchema.safeParse(body)
  if (!validation.success) {
    throw createError({ statusCode: 400, message: validation.error.issues[0]?.message || 'Invalid request body' })
  }

  const { planId, billingCycle } = validation.data
  const db = getDb()

  // Verify store ownership
  const [store] = await db
    .select()
    .from(stores)
    .where(_eq(stores.id, storeId))
    .limit(1)

  if (!store) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }

  if (store.ownerId !== session.user.id) {
    throw createError({ statusCode: 403, message: 'Not authorized to manage this subscription' })
  }

  // Verify plan exists
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(_eq(subscriptionPlans.id, planId))
    .limit(1)

  if (!plan || !plan.isActive) {
    throw createError({ statusCode: 400, message: 'Invalid plan selected' })
  }

  // Calculate billing period
  const now = new Date()
  const periodEnd = new Date(now)
  if (billingCycle === 'yearly') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  }

  // Check for existing subscription
  const [existingSub] = await db
    .select()
    .from(storeSubscriptions)
    .where(_eq(storeSubscriptions.storeId, storeId))
    .limit(1)

  if (existingSub) {
    // Update existing subscription
    const [updated] = await db
      .update(storeSubscriptions)
      .set({
        planId,
        billingCycle,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        updatedAt: now
      })
      .where(_eq(storeSubscriptions.id, existingSub.id))
      .returning()

    return { ...updated, plan }
  }

  // Create new subscription
  const [newSub] = await db
    .insert(storeSubscriptions)
    .values({
      storeId,
      planId,
      billingCycle,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd
    })
    .returning()

  return { ...newSub, plan }
})
