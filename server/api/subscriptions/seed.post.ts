import { subscriptionPlans } from '../../database/schema'

// This endpoint seeds the default subscription plans
// Should only be called once during initial setup
// Protected by ADMIN_SECRET env variable
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const adminSecret = query.secret as string
  const expectedSecret = process.env.ADMIN_SECRET

  if (!expectedSecret || adminSecret !== expectedSecret) {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const db = getDb()

  const plans = [
    {
      name: 'Gratis',
      slug: 'free',
      description: 'Para empezar tu tienda vegana',
      priceMonthly: '0',
      priceYearly: '0',
      maxProducts: 10,
      maxLocations: 1,
      maxImagesPerProduct: 1,
      featuresEnabled: ['basic_analytics'],
      isActive: true,
      displayOrder: 0
    },
    {
      name: 'Pro',
      slug: 'pro',
      description: 'Para tiendas en crecimiento',
      priceMonthly: '4999', // $49.99 ARS
      priceYearly: '49990', // $499.90 ARS (2 months free)
      maxProducts: 100,
      maxLocations: 3,
      maxImagesPerProduct: 5,
      featuresEnabled: ['basic_analytics', 'advanced_analytics', 'priority_support', 'custom_hours'],
      isActive: true,
      displayOrder: 1
    },
    {
      name: 'Business',
      slug: 'business',
      description: 'Para tiendas grandes o cadenas',
      priceMonthly: '9999', // $99.99 ARS
      priceYearly: '99990', // $999.90 ARS (2 months free)
      maxProducts: -1,
      maxLocations: -1,
      maxImagesPerProduct: 10,
      featuresEnabled: ['basic_analytics', 'advanced_analytics', 'priority_support', 'custom_hours', 'api_access', 'white_label'],
      isActive: true,
      displayOrder: 2
    }
  ]

  // Upsert plans
  for (const plan of plans) {
    await db
      .insert(subscriptionPlans)
      .values(plan)
      .onConflictDoUpdate({
        target: subscriptionPlans.slug,
        set: {
          name: plan.name,
          description: plan.description,
          priceMonthly: plan.priceMonthly,
          priceYearly: plan.priceYearly,
          maxProducts: plan.maxProducts,
          maxLocations: plan.maxLocations,
          maxImagesPerProduct: plan.maxImagesPerProduct,
          featuresEnabled: plan.featuresEnabled,
          isActive: plan.isActive,
          displayOrder: plan.displayOrder,
          updatedAt: new Date()
        }
      })
  }

  return { success: true, message: 'Subscription plans seeded successfully' }
})
