import { _eq, count, inArray } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { products, stores } from '../../database/schema'

const FREE_TIER_PRODUCT_LIMIT = 100

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const db = getDb()

  // Get user's stores first
  const userStores = await db
    .select({ id: stores.id })
    .from(stores)
    .where(_eq(stores.ownerId, user.id))

  const storeIds = userStores.map(s => s.id)

  let productCount = 0
  if (storeIds.length > 0) {
    const [result] = await db
      .select({ count: count() })
      .from(products)
      .where(inArray(products.storeId, storeIds))
    productCount = result?.count ?? 0
  }

  const limit = FREE_TIER_PRODUCT_LIMIT
  const remaining = Math.max(0, limit - productCount)
  const canAddProduct = productCount < limit

  return {
    plan: 'free',
    products: {
      current: productCount,
      limit,
      remaining
    },
    canAddProduct,
    message: canAddProduct
      ? `${productCount} de ${limit} productos utilizados`
      : `Has alcanzado el limite de ${limit} productos`
  }
})
