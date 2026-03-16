import { asSitemapUrl, defineSitemapEventHandler } from '#imports'
import { eq } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { stores } from '../../database/schema'

export default defineSitemapEventHandler(async () => {
  try {
    const db = getDb()

    // Get all active stores for dynamic sitemap
    const activeStores = await db
      .select({
        slug: stores.slug,
        updatedAt: stores.updatedAt
      })
      .from(stores)
      .where(eq(stores.isActive, true))

    return activeStores.map(store =>
      asSitemapUrl({
        loc: `/${store.slug}`,
        lastmod: store.updatedAt?.toISOString(),
        changefreq: 'weekly',
        priority: 0.7
      })
    )
  } catch {
    // Return empty array if DB is unavailable (_e.g., during build/prerender)
    return []
  }
})
