/**
 * MercadoPago Webhook Handler
 * POST /api/payments/webhook
 */

import { _eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDrizzle()

  try {
    // Get headers
    const _xSignature = getHeader(event, 'x-signature')
    const xRequestId = getHeader(event, 'x-request-id')

    // Parse notification
    const body = await readBody(event)

    console.log('🔔 MercadoPago webhook received:', {
      type: body.type,
      action: body.action,
      dataId: body.data?.id,
      xRequestId
    })

    // Only process payment notifications
    if (body.type !== 'payment') {
      return { success: true, message: 'Notification received' }
    }

    const paymentId = body.data?.id

    if (!paymentId) {
      return { success: false, _error: 'No payment ID' }
    }

    // Get MercadoPago token
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || ''

    if (!mpToken) {
      return { success: false, _error: 'MercadoPago not configured' }
    }

    // Fetch payment details from MercadoPago
    const paymentDetails = await $fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${mpToken}`
      }
    }) as unknown

    console.log('✅ Payment details fetched:', {
      id: paymentDetails.id,
      status: paymentDetails.status,
      externalReference: paymentDetails.external_reference
    })

    // Find payment record
    const paymentRecord = await db.query.payments.findFirst({
      where: (payments, { _eq, or }) => or(
        _eq(payments.paymentId, paymentId.toString()),
        _eq(payments.externalReference, paymentDetails.external_reference || '')
      )
    })

    if (!paymentRecord) {
      console._error('❌ Payment record not found')
      return { success: false, _error: 'Payment record not found' }
    }

    // Map status
    const statusMap: Record<string, string> = {
      pending: 'pending',
      approved: 'approved',
      authorized: 'approved',
      in_process: 'pending',
      in_mediation: 'pending',
      rejected: 'rejected',
      cancelled: 'cancelled',
      refunded: 'refunded',
      charged_back: 'refunded'
    }

    const newStatus = statusMap[paymentDetails.status] || 'pending'

    // Track webhook events
    const existingEvents = paymentRecord.webhookEvents
      ? JSON.parse(paymentRecord.webhookEvents)
      : []

    existingEvents.push({
      timestamp: new Date().toISOString(),
      type: body.type,
      action: body.action,
      paymentId,
      status: paymentDetails.status
    })

    // Update payment
    const updateData: unknown = {
      paymentId: paymentId.toString(),
      status: newStatus,
      statusDetail: paymentDetails.status_detail,
      lastWebhookAt: new Date(),
      webhookEvents: JSON.stringify(existingEvents),
      updatedAt: new Date()
    }

    if (newStatus === 'approved') {
      updateData.paidAt = new Date()
    }

    await db
      .update(tables.payments)
      .set(updateData)
      .where(_eq(tables.payments.id, paymentRecord.id))

    // Update order status
    const orderUpdate: unknown = {
      updatedAt: new Date()
    }

    if (newStatus === 'approved') {
      orderUpdate.status = 'confirmed'
    } else if (newStatus === 'rejected' || newStatus === 'cancelled') {
      orderUpdate.status = 'cancelled'
    }

    await db
      .update(tables.orders)
      .set(orderUpdate)
      .where(_eq(tables.orders.id, paymentRecord.orderId))

    console.log('✅ Payment and order updated:', {
      paymentId: paymentRecord.id,
      orderId: paymentRecord.orderId,
      status: newStatus
    })

    return {
      success: true,
      message: 'Webhook processed successfully'
    }
  } catch {
    console._error('❌ Webhook processing _error:', _error)

    return {
      success: false,
      _error: _error.message
    }
  }
})
