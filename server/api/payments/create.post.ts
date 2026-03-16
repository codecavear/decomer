/**
 * Create MercadoPago Payment Preference
 * POST /api/payments/create
 */

import { MercadoPagoConfig, Preference } from 'mercadopago'
import { z } from 'zod'

const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  buyerEmail: z.string().email().optional(),
  buyerName: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required'
    })
  }

  const db = useDrizzle()
  const config = useRuntimeConfig()

  try {
    // Validate body
    const body = await readValidatedBody(event, createPaymentSchema.parse)

    // Get order
    const order = await db.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, body.orderId),
      with: {
        store: true,
        items: {
          with: {
            product: true
          }
        }
      }
    })

    if (!order) {
      throw createError({
        statusCode: 404,
        message: 'Order not found'
      })
    }

    // Verify order belongs to user
    if (order.userId !== session.user.id) {
      throw createError({
        statusCode: 403,
        message: 'Order does not belong to user'
      })
    }

    // Check if order already has a pending payment
    const existingPayment = await db.query.payments.findFirst({
      where: (payments, { eq, and }) => and(
        eq(payments.orderId, body.orderId),
        eq(payments.status, 'pending')
      )
    })

    if (existingPayment?.initPoint) {
      return {
        success: true,
        data: {
          paymentId: existingPayment.id,
          preferenceId: existingPayment.preferenceId,
          initPoint: existingPayment.initPoint,
          sandboxInitPoint: existingPayment.sandboxInitPoint
        }
      }
    }

    // Get MercadoPago token
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || ''

    if (!mpToken || mpToken === 'placeholder') {
      throw createError({
        statusCode: 500,
        message: 'MercadoPago not configured'
      })
    }

    // Build items for preference
    const items = order.items.map(item => ({
      id: item.productId,
      title: item.product.name,
      description: item.notes || item.product.description || undefined,
      quantity: item.quantity,
      unit_price: Number(item.unitPrice),
      currency_id: 'ARS'
    }))

    // Generate external reference
    const externalReference = `order_${order.id}_${Date.now()}`

    // Build back URLs
    const baseUrl = config.public.appUrl || 'http://localhost:3000'
    const backUrls = {
      success: `${baseUrl}/orders/${order.id}/payment/success`,
      failure: `${baseUrl}/orders/${order.id}/payment/failure`,
      pending: `${baseUrl}/orders/${order.id}/payment/pending`
    }

    // Create MercadoPago preference
    const client = new MercadoPagoConfig({ accessToken: mpToken })
    const preference = new Preference(client)

    const response = await preference.create({
      body: {
        items,
        external_reference: externalReference,
        back_urls: backUrls,
        auto_return: 'approved',
        payer: {
          email: body.buyerEmail || session.user.email,
          name: body.buyerName || session.user.name
        }
      }
    })

    // Store payment in database
    const [payment] = await db.insert(tables.payments).values({
      orderId: order.id,
      userId: session.user.id,
      storeId: order.storeId,
      preferenceId: response.id,
      externalReference,
      amount: body.amount.toString(),
      currency: 'ARS',
      status: 'pending',
      provider: 'mercadopago',
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point,
      buyerEmail: body.buyerEmail || session.user.email,
      buyerName: body.buyerName || session.user.name
    }).returning()

    // Update order status
    await db
      .update(tables.orders)
      .set({
        status: 'pending',
        updatedAt: new Date()
      })
      .where(eq(tables.orders.id, order.id))

    return {
      success: true,
      data: {
        paymentId: payment.id,
        preferenceId: response.id,
        initPoint: response.init_point,
        sandboxInitPoint: response.sandbox_init_point
      }
    }
  } catch {
    console.error('Error creating payment:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to create payment'
    })
  }
})
