import { _eq, and, like, or, count } from 'drizzle-orm'
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
  const conditions = [_eq(viandas.isAvailable, true)]

  if (search) {
    conditions.push(or(
      like(viandas.name, `%${search}%`),
      like(viandas.description, `%${search}%`)
    ))
  }

  if (vegetarian) conditions.push(_eq(viandas.isVegetarian, true))
  if (vegan) conditions.push(_eq(viandas.isVegan, true))
  if (glutenFree) conditions.push(_eq(viandas.isGlutenFree, true))
  if (lowCarb) conditions.push(_eq(viandas.isLowCarb, true))
  if (highProtein) conditions.push(_eq(viandas.isHighProtein, true))

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
