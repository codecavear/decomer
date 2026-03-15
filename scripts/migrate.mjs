import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('[migrate] ERROR: DATABASE_URL environment variable is not set')
    process.exit(1)
  }

  console.log('[migrate] Starting database migrations...')

  const maxRetries = 5
  let lastError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[migrate] Connection attempt ${attempt}/${maxRetries}...`)

      const client = postgres(databaseUrl, {
        max: 1,
        connect_timeout: 30,
        idle_timeout: 20,
        max_lifetime: 60 * 30
      })

      const db = drizzle(client)

      await migrate(db, { migrationsFolder: './drizzle/migrations' })

      console.log('[migrate] Migrations completed successfully!')

      await client.end()
      process.exit(0)
    } catch (error) {
      lastError = error
      console.error(`[migrate] Attempt ${attempt} failed:`, error.message)

      if (attempt < maxRetries) {
        const delay = attempt * 2000 // 2s, 4s, 6s, 8s
        console.log(`[migrate] Retrying in ${delay / 1000} seconds...`)
        await sleep(delay)
      }
    }
  }

  console.error('[migrate] All connection attempts failed')
  console.error('[migrate] Last error:', lastError)
  process.exit(1)
}

runMigrations()
