import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { existsSync } from 'fs'
import { resolve } from 'path'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('[migrate] ERROR: DATABASE_URL not set')
    process.exit(1)
  }

  const maxRetries = 5
  let lastError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = postgres(databaseUrl, {
        max: 1,
        connect_timeout: 30,
        idle_timeout: 20,
        max_lifetime: 60 * 30
      })

      const db = drizzle(client)

      const migrationsFolder = process.env.RAILWAY_ENVIRONMENT
        ? '/app/drizzle/migrations'
        : './drizzle/migrations'

      const resolvedPath = resolve(migrationsFolder)

      if (!existsSync(resolvedPath)) {
        console.error(`[migrate] ERROR: Migrations folder not found at ${resolvedPath}`)
        process.exit(1)
      }

      await migrate(db, { migrationsFolder })

      console.log('[migrate] ✅ Migrations completed')

      await client.end()
      process.exit(0)
    } catch (error) {
      lastError = error

      if (attempt < maxRetries) {
        const delay = attempt * 2000
        await sleep(delay)
      }
    }
  }

  console.error('[migrate] ERROR: All connection attempts failed')
  if (lastError) console.error('[migrate]', lastError.message)
  process.exit(1)
}

runMigrations()
