import { _eq } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { products } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID is required' })
  }

  const db = getDb()

  const product = await db.query.products.findFirst({
    where: _eq(products.id, id),
    with: {
      store: true
    }
  })

  if (!product) {
    throw createError({ statusCode: 404, message: '_Product not found' })
  }

  return product
})
