import { z } from 'zod'
import { MercadoPagoConfig, Preference } from 'mercadopago'

const checkoutSchema = z.object({
  planId: z.string().uuid(),
  frequency: z.enum(['weekly', 'monthly']),
  isTrial: z.boolean().optional().default(false)
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readValidatedBody(event, checkoutSchema.parse)

  const db = useDrizzle()

  // Get plan details
  const [plan] = await db
    .select()
    .from(tables.mealPlans)
    .where(eq(tables.mealPlans.id, body.planId))
    .limit(1)

  if (!plan || !plan.isActive) {
    throw createError({
      statusCode: 404,
      message: 'Plan not found or inactive'
    })
  }

  // Check if user already has an active subscription
  const existingSubscription = await db
    .select()
    .from(tables.userMealSubscriptions)
    .where(
      and(
        eq(tables.userMealSubscriptions.userId, user.id),
        inArray(tables.userMealSubscriptions.status, ['active', 'trialing'])
      )
    )
    .limit(1)

  if (existingSubscription.length > 0) {
    throw createError({
      statusCode: 400,
      message: 'User already has an active subscription. Please cancel or modify existing subscription first.'
    })
  }

  // Calculate pricing
  const basePrice = body.frequency === 'weekly'
    ? parseFloat(plan.priceWeekly)
    : parseFloat(plan.priceMonthly)

  const discount = body.isTrial
    ? basePrice * (plan.trialDiscountPercent / 100)
    : 0

  const total = basePrice - discount

  // MercadoPago checkout
  const config = useRuntimeConfig()

  if (!config.mercadoPagoAccessToken) {
    throw createError({
      statusCode: 500,
      message: 'MercadoPago not configured. Contact support.'
    })
  }

  const client = new MercadoPagoConfig({
    accessToken: config.mercadoPagoAccessToken,
    options: {
      timeout: 5000
    }
  })

  const preference = new Preference(client)

  const items = [{
    id: plan.id,
    title: `${plan.name} - ${body.frequency === 'weekly' ? 'Semanal' : 'Mensual'}`,
    description: plan.description || '',
    category_id: 'food',
    quantity: 1,
    currency_id: 'ARS',
    unit_price: total
  }]

  // Create preference
  const preferenceData = {
    items,
    payer: {
      name: user.name || '',
      email: user.email,
      phone: user.phone ? { number: user.phone } : undefined,
      address: user.deliveryAddress
        ? {
            street_name: user.deliveryAddress,
            street_number: '',
            zip_code: ''
          }
        : undefined
    },
    back_urls: {
      success: `${config.public.baseUrl}/app/subscription/success`,
      failure: `${config.public.baseUrl}/app/subscription/failure`,
      pending: `${config.public.baseUrl}/app/subscription/pending`
    },
    auto_return: 'approved' as const,
    notification_url: `${config.public.baseUrl}/api/webhooks/mercadopago`,
    metadata: {
      userId: user.id,
      planId: plan.id,
      frequency: body.frequency,
      isTrial: body.isTrial
    },
    statement_descriptor: 'DECOMER',
    expires: true,
    expiration_date_from: new Date().toISOString(),
    expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
  }

  try {
    const response = await preference.create({ body: preferenceData })

    return {
      success: true,
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point
    }
  } catch (error) {
    console.error('MercadoPago preference creation failed:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create payment preference'
    })
  }
})
