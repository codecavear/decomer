import { _eq, count } from 'drizzle-orm'
import { storeSubscriptions, subscriptionPlans, stores, products, storeLocations } from '../../database/schema'

interface LimitCheck {
  feature: string
  allowed: boolean
  current: number
  limit: number
  message?: string
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const storeId = query.storeId as string

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
    throw createError({ statusCode: 403, message: 'Not authorized' })
  }

  // Get subscription and plan
  const [subscription] = await db
    .select({
      subscription: storeSubscriptions,
      plan: subscriptionPlans
    })
    .from(storeSubscriptions)
    .leftJoin(subscriptionPlans, _eq(storeSubscriptions.planId, subscriptionPlans.id))
    .where(_eq(storeSubscriptions.storeId, storeId))
    .limit(1)

  // Default limits for free tier
  let limits = {
    maxProducts: 100,
    maxLocations: 1,
    maxImagesPerProduct: 1
  }
  let planSlug = 'free'
  let features: string[] = ['basic_analytics']

  if (subscription?.plan) {
    limits = {
      maxProducts: subscription.plan.maxProducts,
      maxLocations: subscription.plan.maxLocations,
      maxImagesPerProduct: subscription.plan.maxImagesPerProduct
    }
    planSlug = subscription.plan.slug
    features = subscription.plan.featuresEnabled ?? ['basic_analytics']
  }

  // Get current usage counts
  const [productCount] = await db
    .select({ count: count() })
    .from(products)
    .where(_eq(products.storeId, storeId))

  const [locationCount] = await db
    .select({ count: count() })
    .from(storeLocations)
    .where(_eq(storeLocations.storeId, storeId))

  // Build limit checks
  const checks: LimitCheck[] = [
    {
      feature: 'products',
      current: productCount?.count ?? 0,
      limit: limits.maxProducts,
      allowed: limits.maxProducts === -1 || (productCount?.count ?? 0) < limits.maxProducts,
      message: limits.maxProducts === -1 ? 'Productos ilimitados' : `${productCount?.count ?? 0} de ${limits.maxProducts} productos`
    },
    {
      feature: 'locations',
      current: locationCount?.count ?? 0,
      limit: limits.maxLocations,
      allowed: limits.maxLocations === -1 || (locationCount?.count ?? 0) < limits.maxLocations,
      message: limits.maxLocations === -1 ? 'Ubicaciones ilimitadas' : `${locationCount?.count ?? 0} de ${limits.maxLocations} ubicaciones`
    }
  ]

  return {
    plan: planSlug,
    subscription: subscription?.subscription,
    limits,
    features,
    checks,
    canAddProduct: checks.find(c => c.feature === 'products')?.allowed ?? false,
    canAddLocation: checks.find(c => c.feature === 'locations')?.allowed ?? false
  }
})
