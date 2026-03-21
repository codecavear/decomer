export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = useDrizzle()

  const subscriptions = await db
    .select()
    .from(tables.userMealSubscriptions)
    .where(eq(tables.userMealSubscriptions.userId, user.id))
    .orderBy(desc(tables.userMealSubscriptions.createdAt))

  if (subscriptions.length === 0) {
    return { subscription: null }
  }

  // Get active subscription
  const activeSubscription = subscriptions.find(
    s => s.status === 'active' || s.status === 'trialing'
  ) || subscriptions[0]

  // Get plan details
  const [plan] = await db
    .select()
    .from(tables.mealPlans)
    .where(eq(tables.mealPlans.id, activeSubscription.planId))
    .limit(1)

  // Get subscription history
  const history = await db
    .select()
    .from(tables.subscriptionHistory)
    .where(eq(tables.subscriptionHistory.subscriptionId, activeSubscription.id))
    .orderBy(desc(tables.subscriptionHistory.createdAt))
    .limit(10)

  return {
    subscription: activeSubscription,
    plan,
    history
  }
})
