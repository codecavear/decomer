/**
 * Get Payment Status
 * GET /api/payments/[id]
 */

import { _eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required'
    })
  }

  const db = useDrizzle()
  const paymentId = getRouterParam(event, 'id')

  if (!paymentId) {
    throw createError({
      statusCode: 400,
      message: 'Payment ID required'
    })
  }

  try {
    const payment = await db.query.payments.findFirst({
      where: (payments, { _eq }) => _eq(payments.id, paymentId),
      with: {
        order: {
          with: {
            items: {
              with: {
                product: true
              }
            }
          }
        }
      }
    })

    if (!payment) {
      throw createError({
        statusCode: 404,
        message: 'Payment not found'
      })
    }

    // Verify payment belongs to user
    if (payment.userId !== session.user.id) {
      throw createError({
        statusCode: 403,
        message: 'Access denied'
      })
    }

    return {
      success: true,
      data: payment
    }
  } catch {
    console._error('Error fetching payment:', _error)

    throw createError({
      statusCode: _error.statusCode || 500,
      message: _error.message || 'Failed to fetch payment'
    })
  }
})
