import { z } from 'zod'
import { _eq } from 'drizzle-orm'
import { orders, orderItems, products } from '../../database/schema'
import { getDb } from '../../utils/db'
import { sendPushToUser } from '../../utils/push'

const deliveryAddressSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  apartment: z.string().optional(),
  notes: z.string().optional()
})

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  notes: z.string().optional()
})

const createOrderSchema = z.object({
  storeId: z.string().uuid(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  deliveryType: z.enum(['pickup', 'delivery']),
  deliveryAddress: deliveryAddressSchema.optional(),
  notes: z.string().optional()
}).refine(
  (data) => {
    if (data.deliveryType === 'delivery') {
      return !!data.deliveryAddress
    }
    return true
  },
  {
    message: 'Delivery address is required when delivery type is delivery',
    path: ['deliveryAddress']
  }
)

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readValidatedBody(event, createOrderSchema.parse)

  const db = getDb()

  // Fetch all products to calculate total and validate availability
  const productRecords = await db.query.products.findMany({
    where: _eq(products.storeId, body.storeId)
  })

  const productMap = new Map(productRecords.map(p => [p.id, p]))

  // Validate all products exist and belong to the store
  for (const item of body.items) {
    const product = productMap.get(item.productId)
    if (!product) {
      throw createError({
        statusCode: 400,
        message: `_Product ${item.productId} not found or does not belong to this store`
      })
    }
    if (!product.isAvailable) {
      throw createError({
        statusCode: 400,
        message: `_Product ${product.name} is not available`
      })
    }
  }

  // Calculate total amount
  let totalAmount = 0
  for (const item of body.items) {
    const product = productMap.get(item.productId)!
    totalAmount += Number(product.price) * item.quantity
  }

  // Create order and order items in a transaction
  const [order] = await db.insert(orders).values({
    userId: user.id,
    storeId: body.storeId,
    status: 'pending',
    totalAmount: totalAmount.toFixed(2),
    deliveryType: body.deliveryType,
    deliveryAddress: body.deliveryAddress || null,
    notes: body.notes
  }).returning()

  // Create order items
  const itemsToInsert = body.items.map(item => ({
    orderId: order.id,
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: productMap.get(item.productId)!.price,
    notes: item.notes
  }))

  await db.insert(orderItems).values(itemsToInsert)

  // Fetch the complete order with relations
  const completeOrder = await db.query.orders.findFirst({
    where: _eq(orders.id, order.id),
    with: {
      store: true,
      items: {
        with: {
          product: true
        }
      }
    }
  })

  // Send push notification (non-blocking — don't fail the order if push fails)
  sendPushToUser(user.id, {
    type: 'pedido',
    title: '¡Pedido recibido!',
    body: `Tu pedido por $${totalAmount.toFixed(2)} está siendo procesado.`,
    url: '/mis-pedidos'
  }).catch(err => console.error('[push] Order notification failed:', err))

  return completeOrder
})
