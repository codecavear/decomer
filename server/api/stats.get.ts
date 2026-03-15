import { sql } from 'drizzle-orm'
import { getDb } from '../utils/db'
import { stores, products, reviews } from '../database/schema'

export default defineEventHandler(async () => {
  try {
    const db = getDb()

    const [storeCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(stores)
      .where(sql`${stores.status} = 'active'`)

    const [productCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(sql`${products.isAvailable} = true`)

    const [reviewCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reviews)

    return {
      stores: storeCount?.count ?? 0,
      products: productCount?.count ?? 0,
      reviews: reviewCount?.count ?? 0
    }
  } catch {
    // During build or when DB is unavailable, return zeros
    return { stores: 0, products: 0, reviews: 0 }
  }
})
