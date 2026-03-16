/**
 * One-off script to check stores in DB. Run with: railway run bun run scripts/check-stores.ts
 * (Link to Postgres first: railway service link Postgres)
 */
import postgres from 'postgres'

const connectionString
  = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL

if (!connectionString) {
  console.error('No DATABASE_URL or DATABASE_PUBLIC_URL')
  process.exit(1)
}

const sql = postgres(connectionString)

async function main() {
  console.log('Checking decomer_stores...\n')

  const all = await sql`
    SELECT id, name, slug, status
    FROM decomer_stores
    ORDER BY slug
  `
  console.log(`Total stores: ${all.length}`)
  all.forEach((s: { slug: string, status: string, name: string }) =>
    console.log(`  - ${s.slug} (${s.status}): ${s.name}`)
  )

  const cardeno = await sql`
    SELECT * FROM decomer_stores WHERE slug = 'cardeno'
  `
  console.log('\nStore with slug "cardeno":', cardeno.length ? cardeno[0] : 'NOT FOUND')

  await sql.end()
}

main().catch((_e) => {
  console.error(_e)
  process.exit(1)
})
