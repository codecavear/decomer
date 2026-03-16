import { _eq } from 'drizzle-orm'
import { subscriptionPlans } from '../../database/schema'

export default defineEventHandler(async () => {
  const db = getDb()

  const plans = await db
    .select()
    .from(subscriptionPlans)
    .where(_eq(subscriptionPlans.isActive, true))
    .orderBy(subscriptionPlans.displayOrder)

  return plans
})
