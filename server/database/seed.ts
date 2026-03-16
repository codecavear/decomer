import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
const db = drizzle(client, { schema })

const categories = [
  { name: 'Almacén Vegano', slug: 'almacen-vegano', icon: 'i-lucide-store', description: 'Productos veganos variados' },
  { name: 'Restaurante', slug: 'restaurante', icon: 'i-lucide-utensils', description: 'Restaurantes y cafeterías' },
  { name: 'Pastelería', slug: 'pasteleria', icon: 'i-lucide-cake', description: 'Dulces y postres veganos' },
  { name: 'Comida Rápida', slug: 'comida-rapida', icon: 'i-lucide-sandwich', description: 'Fast food vegano' },
  { name: 'Heladería', slug: 'heladeria', icon: 'i-lucide-ice-cream-cone', description: 'Helados veganos' },
  { name: 'Verdulería', slug: 'verduleria', icon: 'i-lucide-carrot', description: 'Frutas y verduras orgánicas' },
  { name: 'Panadería', slug: 'panaderia', icon: 'i-lucide-croissant', description: 'Pan y productos de panadería' },
  { name: 'Cosmética', slug: 'cosmetica', icon: 'i-lucide-sparkles', description: 'Cosmética cruelty-free' },
  { name: 'Suplementos', slug: 'suplementos', icon: 'i-lucide-pill', description: 'Vitaminas y suplementos' },
  { name: 'Delivery', slug: 'delivery', icon: 'i-lucide-truck', description: 'Servicios de delivery vegano' },
  { name: 'Wine Bar', slug: 'wine-bar', icon: 'i-lucide-wine', description: 'Bares y vinotecas vegan friendly' }
]

const sampleStores = [
  {
    name: 'Cardeno Vinoteca & Wine Bar',
    slug: 'cardeno',
    description: 'Un espacio único para los amantes del buen vino. Vinoteca, wine bar y tabaquería con ambiente acogedor. Vegan friendly con opciones plant-based en todo el menú.',
    status: 'active',
    type: 'catalog',
    address: 'Deán Funes 610',
    city: 'Córdoba',
    latitude: -31.4135,
    longitude: -64.1831,
    contacts: [
      { type: 'whatsapp', value: '+5493518069544', isPrimary: true },
      { type: 'instagram', value: '@cardeno.bar', isPrimary: false },
      { type: 'instagram', value: '@cardeno.vinos', isPrimary: false }
    ],
    schedules: [
      { dayOfWeek: 0, isClosed: true }, // Sunday closed? Actually open
      { dayOfWeek: 1, isClosed: true }, // Monday closed
      { dayOfWeek: 2, openTime: '19:00', closeTime: '02:00', isClosed: false },
      { dayOfWeek: 3, openTime: '19:00', closeTime: '02:00', isClosed: false },
      { dayOfWeek: 4, openTime: '19:00', closeTime: '02:00', isClosed: false },
      { dayOfWeek: 5, openTime: '19:00', closeTime: '02:00', isClosed: false },
      { dayOfWeek: 6, openTime: '19:00', closeTime: '02:00', isClosed: false }
    ]
  },
  {
    name: 'Green Garden',
    slug: 'green-garden',
    description: 'El mejor almacén vegano de Córdoba. Productos importados y locales.',
    status: 'active',
    type: 'catalog',
    address: 'Av. Colón 1234',
    city: 'Córdoba',
    latitude: -31.4201,
    longitude: -64.1888
  },
  {
    name: 'Vegan House',
    slug: 'vegan-house',
    description: 'Restaurante 100% plant-based con opciones gourmet.',
    status: 'active',
    type: 'pickup_delivery',
    address: 'Belgrano 567',
    city: 'Córdoba',
    latitude: -31.4167,
    longitude: -64.1833
  },
  {
    name: 'Natural Bakery',
    slug: 'natural-bakery',
    description: 'Panadería artesanal con harinas orgánicas y sin gluten.',
    status: 'active',
    type: 'pickup',
    address: 'Obispo Trejo 890',
    city: 'Córdoba',
    latitude: -31.4234,
    longitude: -64.1901
  },
  {
    name: 'Vida Verde',
    slug: 'vida-verde',
    description: 'Verdulería orgánica con productos de huerta local.',
    status: 'active',
    type: 'pickup_delivery',
    address: 'San Martín 456',
    city: 'Villa Carlos Paz',
    latitude: -31.4242,
    longitude: -64.4978
  },
  {
    name: 'Sweet Vegan',
    slug: 'sweet-vegan',
    description: 'Pastelería vegana con tortas para ocasiones especiales.',
    status: 'active',
    type: 'pickup',
    address: 'Rivera Indarte 123',
    city: 'Córdoba',
    latitude: -31.4156,
    longitude: -64.1812
  },
  {
    name: 'Roots Café',
    slug: 'roots-cafe',
    description: 'Café acogedor con opciones veganas y vegetarianas.',
    status: 'active',
    type: 'pickup',
    address: 'Caseros 789',
    city: 'Córdoba',
    latitude: -31.4189,
    longitude: -64.1845
  }
]

async function seed() {
  console.log('🌱 Starting database seed...')

  try {
    // Insert categories
    console.log('📦 Seeding categories...')
    for (const category of categories) {
      await db.insert(schema.categories).values(category).onConflictDoNothing()
    }
    console.log(`✅ ${categories.length} categories seeded`)

    // Create a test user for store ownership
    console.log('👤 Seeding test user...')
    const [testUser] = await db.insert(schema.users).values({
      googleId: 'demo-seed-user-001',
      email: 'demo@decomer.ar',
      name: 'Demo User',
      role: 'store_owner'
    }).onConflictDoNothing().returning()

    // Get user ID (either new or existing)
    const userId = testUser?.id || (await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, 'demo@decomer.ar')
    }))?.id

    if (!userId) {
      throw new Error('Failed to create or find test user')
    }

    // Insert stores
    console.log('🏪 Seeding stores...')
    for (const storeData of sampleStores) {
      const { contacts, schedules, address, city, latitude, longitude, ...store } = storeData

      // Insert store
      const [insertedStore] = await db.insert(schema.stores).values({
        ...store,
        status: store.status as 'active' | 'pending' | 'suspended',
        type: store.type as 'catalog' | 'pickup' | 'delivery' | 'pickup_delivery',
        ownerId: userId
      }).onConflictDoNothing().returning()

      if (!insertedStore) {
        console.log(`  ⏭️  Store "${store.name}" already exists, skipping...`)
        continue
      }

      console.log(`  ✅ Created store: ${store.name}`)

      // Insert location
      await db.insert(schema.storeLocations).values({
        storeId: insertedStore.id,
        address,
        city,
        country: 'Argentina',
        latitude: latitude?.toString(),
        longitude: longitude?.toString(),
        isPrimary: true
      })

      // Insert contacts if any
      if (contacts && contacts.length > 0) {
        await db.insert(schema.storeContacts).values(
          contacts.map(c => ({
            storeId: insertedStore.id,
            type: c.type as 'email' | 'phone' | 'whatsapp' | 'instagram' | 'facebook' | 'twitter' | 'website',
            value: c.value,
            isPrimary: c.isPrimary
          }))
        )
      }

      // Insert schedules if any
      if (schedules && schedules.length > 0) {
        await db.insert(schema.storeSchedules).values(
          schedules.map(s => ({
            storeId: insertedStore.id,
            dayOfWeek: s.dayOfWeek,
            openTime: s.openTime || null,
            closeTime: s.closeTime || null,
            isClosed: s.isClosed
          }))
        )
      }
    }
    console.log(`✅ ${sampleStores.length} stores seeded`)

    console.log('✨ Seed completed successfully!')
  } catch {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

seed()
