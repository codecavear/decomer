import { _eq } from 'drizzle-orm'
import { storeSubscriptions, subscriptionPlans, stores } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const storeId = getRouterParam(event, 'storeId')
  if (!storeId) {
    throw createError({ statusCode: 400, message: 'Store ID is required' })
  }

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
    throw createError({ statusCode: 403, message: 'Not authorized to view this subscription' })
  }

  // Get subscription with plan details
  const [subscription] = await db
    .select({
      subscription: storeSubscriptions,
      plan: subscriptionPlans
    })
    .from(storeSubscriptions)
    .leftJoin(subscriptionPlans, _eq(storeSubscriptions.planId, subscriptionPlans.id))
    .where(_eq(storeSubscriptions.storeId, storeId))
    .limit(1)

  if (!subscription) {
    // Return free plan defaults if no subscription exists
    return {
      plan: 'free',
      status: 'active',
      limits: {
        maxProducts: 10,
        maxLocations: 1,
        maxImagesPerProduct: 1
      },
      features: ['basic_analytics']
    }
  }

  return {
    ...subscription.subscription,
    plan: subscription.plan,
    limits: {
      maxProducts: subscription.plan?.maxProducts ?? 10,
      maxLocations: subscription.plan?.maxLocations ?? 1,
      maxImagesPerProduct: subscription.plan?.maxImagesPerProduct ?? 1
    },
    features: subscription.plan?.featuresEnabled ?? ['basic_analytics']
  }
})
