import { eq, and, like, or, count } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { viandas } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = getDb()
  const query = getQuery(event)

  const limit = Math.min(parseInt(query.limit as string) || 50, 100)
  const offset = parseInt(query.offset as string) || 0
  const search = query.q as string | undefined

  // Filters
  const vegetarian = query.vegetarian === 'true'
  const vegan = query.vegan === 'true'
  const glutenFree = query.glutenFree === 'true'
  const lowCarb = query.lowCarb === 'true'
  const highProtein = query.highProtein === 'true'

  // Build where conditions
  const conditions = [eq(viandas.isAvailable, true)]

  if (search) {
    conditions.push(or(
      like(viandas.name, `%${search}%`),
      like(viandas.description, `%${search}%`)
    ))
  }

  if (vegetarian) conditions.push(eq(viandas.isVegetarian, true))
  if (vegan) conditions.push(eq(viandas.isVegan, true))
  if (glutenFree) conditions.push(eq(viandas.isGlutenFree, true))
  if (lowCarb) conditions.push(eq(viandas.isLowCarb, true))
  if (highProtein) conditions.push(eq(viandas.isHighProtein, true))

  // Fetch viandas
  const items = await db.query.viandas.findMany({
    where: and(...conditions),
    limit,
    offset,
    orderBy: (viandas, { desc }) => [desc(viandas.createdAt)]
  })

  // Get total count
  const total = await db.select({ count: count() })
    .from(viandas)
    .where(and(...conditions))
    .then(([{ count }]) => count)

  return {
    viandas: items,
    total,
    limit,
    offset
  }
})
