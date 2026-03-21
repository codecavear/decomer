import { z } from 'zod'

const manageSchema = z.object({
  action: z.enum(['pause', 'resume', 'cancel', 'change_plan']),
  subscriptionId: z.string().uuid(),
  newPlanId: z.string().uuid().optional(),
  reason: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readValidatedBody(event, manageSchema.parse)

  const db = useDrizzle()

  // Get subscription
  const [subscription] = await db
    .select()
    .from(tables.userMealSubscriptions)
    .where(
      and(
        eq(tables.userMealSubscriptions.id, body.subscriptionId),
        eq(tables.userMealSubscriptions.userId, user.id)
      )
    )
    .limit(1)

  if (!subscription) {
    throw createError({
      statusCode: 404,
      message: 'Subscription not found'
    })
  }

  const now = new Date()

  switch (body.action) {
    case 'pause': {
      if (subscription.status !== 'active') {
        throw createError({
          statusCode: 400,
          message: 'Can only pause active subscriptions'
        })
      }

      await db
        .update(tables.userMealSubscriptions)
        .set({
          status: 'paused',
          pausedAt: now,
          pauseReason: body.reason,
          updatedAt: now
        })
        .where(eq(tables.userMealSubscriptions.id, body.subscriptionId))

      await db.insert(tables.subscriptionHistory).values({
        subscriptionId: body.subscriptionId,
        action: 'paused',
        notes: body.reason
      })

      return { success: true, message: 'Subscription paused' }
    }

    case 'resume': {
      if (subscription.status !== 'paused') {
        throw createError({
          statusCode: 400,
          message: 'Can only resume paused subscriptions'
        })
      }

      await db
        .update(tables.userMealSubscriptions)
        .set({
          status: 'active',
          pausedAt: null,
          pauseReason: null,
          updatedAt: now
        })
        .where(eq(tables.userMealSubscriptions.id, body.subscriptionId))

      await db.insert(tables.subscriptionHistory).values({
        subscriptionId: body.subscriptionId,
        action: 'resumed',
        notes: 'Subscription resumed'
      })

      return { success: true, message: 'Subscription resumed' }
    }

    case 'cancel': {
      if (subscription.status === 'cancelled') {
        throw createError({
          statusCode: 400,
          message: 'Subscription already cancelled'
        })
      }

      // Cancel at end of period (user keeps access until period ends)
      await db
        .update(tables.userMealSubscriptions)
        .set({
          willCancelAt: subscription.currentPeriodEnd,
          cancelReason: body.reason,
          updatedAt: now
        })
        .where(eq(tables.userMealSubscriptions.id, body.subscriptionId))

      await db.insert(tables.subscriptionHistory).values({
        subscriptionId: body.subscriptionId,
        action: 'cancelled',
        notes: `Scheduled cancellation at ${subscription.currentPeriodEnd.toISOString()}. Reason: ${body.reason || 'none provided'}`
      })

      return {
        success: true,
        message: 'Subscription will be cancelled at end of period',
        cancelAt: subscription.currentPeriodEnd
      }
    }

    case 'change_plan': {
      if (!body.newPlanId) {
        throw createError({
          statusCode: 400,
          message: 'newPlanId required for plan change'
        })
      }

      if (subscription.status !== 'active' && subscription.status !== 'trialing') {
        throw createError({
          statusCode: 400,
          message: 'Can only change plan for active or trialing subscriptions'
        })
      }

      const [newPlan] = await db
        .select()
        .from(tables.mealPlans)
        .where(eq(tables.mealPlans.id, body.newPlanId))
        .limit(1)

      if (!newPlan || !newPlan.isActive) {
        throw createError({
          statusCode: 404,
          message: 'New plan not found or inactive'
        })
      }

      await db
        .update(tables.userMealSubscriptions)
        .set({
          planId: body.newPlanId,
          updatedAt: now
        })
        .where(eq(tables.userMealSubscriptions.id, body.subscriptionId))

      await db.insert(tables.subscriptionHistory).values({
        subscriptionId: body.subscriptionId,
        action: subscription.planId < body.newPlanId ? 'upgraded' : 'downgraded',
        fromPlanId: subscription.planId,
        toPlanId: body.newPlanId,
        notes: `Changed from ${subscription.planId} to ${body.newPlanId}`
      })

      return {
        success: true,
        message: 'Plan changed successfully',
        newPlan: newPlan.name
      }
    }

    default:
      throw createError({
        statusCode: 400,
        message: 'Invalid action'
      })
  }
})
