import { like, or, and, count } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { viandas } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  // TODO: Add admin auth middleware
  const db = getDb()
  const query = getQuery(event)

  const limit = Math.min(parseInt(query.limit as string) || 100, 500)
  const offset = parseInt(query.offset as string) || 0
  const search = query.q as string | undefined

  // Build where conditions (admin sees all, including unavailable)
  const conditions = []

  if (search) {
    conditions.push(or(
      like(viandas.name, `%${search}%`),
      like(viandas.description, `%${search}%`)
    ))
  }

  // Fetch viandas
  const items = await db.query.viandas.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    limit,
    offset,
    orderBy: (viandas, { desc }) => [desc(viandas.createdAt)]
  })

  // Get total count
  const total = await db.select({ count: count() })
    .from(viandas)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .then(([{ count }]) => count)

  return {
    viandas: items,
    total,
    limit,
    offset
  }
})
