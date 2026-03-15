import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../database/schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn('DATABASE_URL is not set. Database operations will fail.')
}

const client = connectionString ? postgres(connectionString) : null

export const db = client ? drizzle(client, { schema }) : null

export function getDb() {
  if (!db) {
    throw new Error('Database not configured. Please set DATABASE_URL in your environment.')
  }
  return db
}
