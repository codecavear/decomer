import { MercadoPagoConfig, Payment } from 'mercadopago'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  console.log('[MercadoPago Webhook]', JSON.stringify(body, null, 2))

  // MercadoPago sends different notification types
  // We're interested in 'payment' type
  if (body.type !== 'payment') {
    return { received: true }
  }

  const paymentId = body.data?.id

  if (!paymentId) {
    console.warn('[MercadoPago] No payment ID in webhook')
    return { received: true }
  }

  const config = useRuntimeConfig()

  if (!config.mercadoPagoAccessToken) {
    console.error('[MercadoPago] Access token not configured')
    return { received: false, error: 'not_configured' }
  }

  const client = new MercadoPagoConfig({
    accessToken: config.mercadoPagoAccessToken
  })

  const payment = new Payment(client)
  const db = useDrizzle()

  try {
    // Fetch payment details from MercadoPago
    const paymentData = await payment.get({ id: paymentId })

    const metadata = paymentData.metadata
    const userId = metadata?.user_id as string | undefined
    const planId = metadata?.plan_id as string | undefined
    const frequency = metadata?.frequency as 'weekly' | 'monthly' | undefined
    const isTrial = metadata?.is_trial as boolean | undefined

    if (!userId || !planId || !frequency) {
      console.error('[MercadoPago] Missing metadata in payment:', paymentData.id)
      return { received: true, error: 'invalid_metadata' }
    }

    // Payment approved - create subscription
    if (paymentData.status === 'approved') {
      const now = new Date()
      const periodEnd = new Date(now)

      if (frequency === 'weekly') {
        periodEnd.setDate(periodEnd.getDate() + 7)
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1)
      }

      const trialEnd = isTrial ? new Date(periodEnd) : null

      // Create user subscription
      await db.insert(tables.userMealSubscriptions).values({
        userId,
        planId,
        status: isTrial ? 'trialing' : 'active',
        frequency,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        isTrialPeriod: isTrial || false,
        trialStart: isTrial ? now : null,
        trialEnd,
        mercadopagoCustomerId: paymentData.payer?.id?.toString(),
        lastPaymentId: paymentData.id?.toString(),
        lastPaymentStatus: paymentData.status
      })

      console.log(`[MercadoPago] ✅ Subscription created for user ${userId}, plan ${planId}`)

      // TODO: Send welcome email/notification
      // TODO: Create subscription history entry
    } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
      console.log(`[MercadoPago] ❌ Payment ${paymentData.status} for user ${userId}`)
      // TODO: Handle failed payment (notify user, retry logic, etc.)
    } else {
      console.log(`[MercadoPago] ⏳ Payment pending: ${paymentData.status}`)
    }

    return { received: true }
  } catch (error) {
    console.error('[MercadoPago] Webhook processing failed:', error)
    return { received: false, error: 'processing_failed' }
  }
})
