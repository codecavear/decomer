export default defineEventHandler(async () => {
  const db = useDrizzle()

  const plans = await db
    .select()
    .from(tables.mealPlans)
    .where(eq(tables.mealPlans.isActive, true))
    .orderBy(asc(tables.mealPlans.displayOrder))

  return plans
})
