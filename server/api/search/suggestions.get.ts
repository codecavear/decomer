import { ilike, or, _eq, and } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { stores, products } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = (query.q as string || '').trim()

  if (!q || q.length < 2) {
    return { stores: [], products: [] }
  }

  const db = getDb()
  const searchPattern = `%${q}%`

  // Search stores (only active)
  const storeResults = await db
    .select({
      id: stores.id,
      name: stores.name,
      slug: stores.slug,
      type: stores.type,
      logoUrl: stores.logoUrl
    })
    .from(stores)
    .where(
      and(
        _eq(stores.status, 'active'),
        or(
          ilike(stores.name, searchPattern),
          ilike(stores.slug, searchPattern)
        )
      )
    )
    .limit(5)

  // Search products
  const productResults = await db
    .select({
      id: products.id,
      name: products.name,
      storeId: products.storeId,
      price: products.price,
      imageUrl: products.imageUrl
    })
    .from(products)
    .where(
      or(
        ilike(products.name, searchPattern),
        ilike(products.description, searchPattern)
      )
    )
    .limit(5)

  return {
    stores: storeResults,
    products: productResults
  }
})
