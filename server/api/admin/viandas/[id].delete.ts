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

  const [deleted] = await db.delete(viandas)
    .where(eq(viandas.id, id))
    .returning()

  if (!deleted) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Vianda not found'
    })
  }

  return { success: true, deleted }
})
