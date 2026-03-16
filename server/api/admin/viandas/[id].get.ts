import { eq } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { viandas } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  // TODO: Add admin auth middleware
  const db = getDb()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Vianda ID is required'
    })
  }

  const vianda = await db.query.viandas.findFirst({
    where: eq(viandas.id, id)
  })

  if (!vianda) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Vianda not found'
    })
  }

  return vianda
})
