import { _eq, and, desc } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { products } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const storeId = query.storeId as string
  const limit = Math.min(Number(query.limit) || 20, 100)
  const offset = Number(query.offset) || 0
  const available = query.available !== 'false'

  // Dietary filters
  const isVegan = query.vegan === 'true'
  const isGlutenFree = query.glutenFree === 'true'
  const isLowCarb = query.lowCarb === 'true'
  const isHighProtein = query.highProtein === 'true'
  const isVegetarian = query.vegetarian === 'true'

  if (!storeId) {
    throw createError({ statusCode: 400, message: 'storeId is required' })
  }

  const db = getDb()

  // Build where clause
  const whereConditions = [_eq(products.storeId, storeId)]

  if (available) {
    whereConditions.push(_eq(products.isAvailable, true))
  }

  // Apply dietary filters
  if (isVegan) whereConditions.push(_eq(products.isVegan, true))
  if (isGlutenFree) whereConditions.push(_eq(products.isGlutenFree, true))
  if (isLowCarb) whereConditions.push(_eq(products.isLowCarb, true))
  if (isHighProtein) whereConditions.push(_eq(products.isHighProtein, true))
  if (isVegetarian) whereConditions.push(_eq(products.isVegetarian, true))

  const productList = await db.query.products.findMany({
    where: and(...whereConditions),
    orderBy: [desc(products.createdAt)],
    limit,
    offset
  })

  return { products: productList, limit, offset }
})
