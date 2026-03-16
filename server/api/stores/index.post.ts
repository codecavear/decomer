import { z } from 'zod'
import { _eq, inArray } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import {
  stores,
  storeTypeEnum,
  storeLocations,
  storeSchedules,
  storeContacts,
  storeCategories,
  categories,
  contactTypeEnum
} from '../../database/schema'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'tienda'
}

const locationSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  latitude: z.union([z.number(), z.string()]).optional().nullable(),
  longitude: z.union([z.number(), z.string()]).optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  apartment: z.string().optional().nullable()
}).optional()

const scheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  openTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  isClosed: z.boolean().default(false)
})

const contactSchema = z.object({
  type: z.enum(contactTypeEnum),
  value: z.string().min(1),
  isPrimary: z.boolean().optional().default(false)
})

const createStoreSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  type: z.enum(storeTypeEnum).default('catalog'),
  logoUrl: z.union([z.string().url(), z.literal('')]).optional().nullable(),
  bannerUrl: z.union([z.string().url(), z.literal('')]).optional().nullable(),
  location: locationSchema,
  schedules: z.array(scheduleSchema).optional(),
  contacts: z.array(contactSchema).optional(),
  categories: z.array(z.string()).optional()
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readValidatedBody(event, createStoreSchema.parse)

  const db = getDb()

  let slug = body.slug?.toLowerCase().trim() || slugify(body.name)
  let attempt = 0
  while (true) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt + 1}`
    const existing = await db.query.stores.findFirst({
      where: _eq(stores.slug, candidate)
    })
    if (!existing) {
      slug = candidate
      break
    }
    attempt++
  }

  const [store] = await db
    .insert(stores)
    .values({
      name: body.name,
      slug,
      description: body.description ?? null,
      type: body.type,
      logoUrl: (body.logoUrl && body.logoUrl !== '') ? body.logoUrl : null,
      bannerUrl: (body.bannerUrl && body.bannerUrl !== '') ? body.bannerUrl : null,
      ownerId: user.id,
      status: 'pending'
    })
    .returning()

  if (!store) throw createError({ statusCode: 500, message: 'Failed to create store' })

  const storeId = store.id

  if (body.location?.address) {
    const latRaw = body.location.latitude != null ? Number(body.location.latitude) : 0
    const lngRaw = body.location.longitude != null ? Number(body.location.longitude) : 0
    const lat = Number.isFinite(latRaw) ? latRaw : 0
    const lng = Number.isFinite(lngRaw) ? lngRaw : 0
    await db.insert(storeLocations).values({
      storeId,
      address: body.location.address,
      city: body.location.city,
      country: body.location.country,
      latitude: String(lat),
      longitude: String(lng),
      neighborhood: body.location.neighborhood ?? null,
      apartment: body.location.apartment ?? null,
      isPrimary: true
    })
  }

  if (body.schedules?.length) {
    await db.insert(storeSchedules).values(
      body.schedules.map(s => ({
        storeId,
        dayOfWeek: s.dayOfWeek,
        openTime: s.openTime ?? null,
        closeTime: s.closeTime ?? null,
        isClosed: s.isClosed ?? false
      }))
    )
  }

  if (body.contacts?.length) {
    await db.insert(storeContacts).values(
      body.contacts.map((c, i) => ({
        storeId,
        type: c.type,
        value: c.value,
        isPrimary: i === 0 || (c.isPrimary ?? false)
      }))
    )
  }

  if (body.categories?.length) {
    const cats = await db.query.categories.findMany({
      where: inArray(categories.slug, body.categories),
      columns: { id: true }
    })
    if (cats.length) {
      await db.insert(storeCategories).values(
        cats.map(c => ({ storeId, categoryId: c.id }))
      )
    }
  }

  return store
})
