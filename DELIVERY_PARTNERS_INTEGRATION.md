# Delivery Partners Integration — Future Enhancement

## Overview
Integración con plataformas de delivery (Rappi, PedidosYa) para automatizar el dispatch de pedidos cuando cambian a estado `en_route`.

## Workflow

```
Order status: ready → Admin clicks "En Camino"
                          ↓
                    Order status: en_route
                          ↓
                    Trigger delivery partner API
                          ↓
                 ┌────────┴────────┐
                 │                 │
              Rappi            PedidosYa
                 │                 │
                 └────────┬────────┘
                          ↓
              Get tracking link + courier info
                          ↓
         Store in orders.deliveryTracking (JSONB)
                          ↓
          Send push to user with tracking link
```

## APIs to Integrate

### Rappi Developer API
- **Docs:** https://developers.rappi.com/
- **Endpoints:**
  - `POST /v2/orders` — Create delivery order
  - `GET /v2/orders/{id}` — Get order status
  - `GET /v2/orders/{id}/tracking` — Get real-time tracking
- **Auth:** Bearer token (OAuth2)
- **Webhook:** Order status updates

### PedidosYa API
- **Contact:** Business partnerships (no public API)
- **Alternative:** WhatsApp Business API for manual coordination
- **Future:** Integration via PedidosYa Store platform

## Database Changes Needed

### Add `deliveryTracking` field to orders
```typescript
// server/database/schema/orders.ts
deliveryTracking: jsonb('delivery_tracking').$type<{
  provider: 'rappi' | 'pedidosya' | 'glovo' | 'uber_eats'
  orderId: string
  trackingUrl: string
  courierName?: string
  courierPhone?: string
  estimatedArrival?: string
  lastUpdate: string
}>()
```

### Migration
```sql
ALTER TABLE decomer_orders
ADD COLUMN delivery_tracking JSONB;
```

## Server Util Implementation

### `server/utils/delivery-partners.ts`
```typescript
import type { Order } from '../database/schema/orders'

interface DeliveryPartnerConfig {
  provider: 'rappi' | 'pedidosya'
  apiKey: string
  apiSecret: string
  storeId: string
}

export async function dispatchToDeliveryPartner(
  order: Order,
  config: DeliveryPartnerConfig
) {
  switch (config.provider) {
    case 'rappi':
      return await dispatchToRappi(order, config)
    case 'pedidosya':
      return await dispatchToPedidosYa(order, config)
    default:
      throw new Error(`Unknown provider: ${config.provider}`)
  }
}

async function dispatchToRappi(order: Order, config: DeliveryPartnerConfig) {
  // TODO: Implement Rappi API call
  const response = await $fetch('https://api.rappi.com/v2/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: {
      store_id: config.storeId,
      order_id: order.id,
      delivery_address: order.deliveryAddress,
      products: order.items.map(item => ({
        name: item.productName,
        quantity: item.quantity,
        price: Number(item.unitPrice)
      })),
      total: Number(order.totalAmount)
    }
  })

  return {
    provider: 'rappi',
    orderId: response.order_id,
    trackingUrl: response.tracking_url,
    courierName: response.courier?.name,
    courierPhone: response.courier?.phone,
    estimatedArrival: response.estimated_arrival,
    lastUpdate: new Date().toISOString()
  }
}

async function dispatchToPedidosYa(order: Order, config: DeliveryPartnerConfig) {
  // TODO: When API is available
  throw new Error('PedidosYa API not yet available')
}
```

## Environment Variables

```env
# Rappi
RAPPI_API_KEY=your_rappi_key
RAPPI_API_SECRET=your_rappi_secret
RAPPI_STORE_ID=your_store_id

# PedidosYa (future)
PEDIDOSYA_API_KEY=your_pedidosya_key
PEDIDOSYA_STORE_ID=your_store_id

# Preferred provider
DELIVERY_PROVIDER=rappi
```

## Update Order Status Endpoint

### `server/api/admin/kitchen/orders/[id].patch.ts`

Add delivery dispatch logic:

```typescript
if (status === 'en_route' && updatedOrder.deliveryType === 'delivery') {
  try {
    const deliveryConfig = {
      provider: process.env.DELIVERY_PROVIDER as 'rappi',
      apiKey: process.env.RAPPI_API_KEY!,
      apiSecret: process.env.RAPPI_API_SECRET!,
      storeId: process.env.RAPPI_STORE_ID!
    }

    const trackingInfo = await dispatchToDeliveryPartner(
      updatedOrder,
      deliveryConfig
    )

    await db
      .update(orders)
      .set({ deliveryTracking: trackingInfo })
      .where(eq(orders.id, orderId))

    // Send enhanced push with tracking link
    await sendOrderStatusNotification(
      updatedOrder.userId,
      updatedOrder.id,
      status,
      { trackingUrl: trackingInfo.trackingUrl }
    )
  } catch (error) {
    console._error('Delivery dispatch failed:', error)
    // Don't block order status update
  }
}
```

## Enhanced Push Notification

Update `server/utils/push-notifications.ts`:

```typescript
export async function sendOrderStatusNotification(
  userId: string,
  orderId: string,
  status: OrderStatus,
  extra?: { trackingUrl?: string }
) {
  // ... existing code ...

  const payload = JSON.stringify({
    title: message.title,
    body: message.body,
    icon: message.icon,
    badge: '/icon-badge.png',
    data: {
      orderId,
      status,
      url: extra?.trackingUrl || `/orders/${orderId}`,
      trackingUrl: extra?.trackingUrl
    },
    actions: extra?.trackingUrl
      ? [{ action: 'track', title: 'Ver ubicación' }]
      : []
  })

  // ... rest of code ...
}
```

## Order Detail Page

### `app/pages/orders/[id].vue`

Show tracking info when available:

```vue
<UCard v-if="order.deliveryTracking">
  <template #header>
    <h3>Seguimiento de Entrega</h3>
  </template>
  
  <div class="space-y-3">
    <div v-if="order.deliveryTracking.courierName">
      <p class="text-sm text-gray-500">Repartidor</p>
      <p class="font-semibold">{{ order.deliveryTracking.courierName }}</p>
      <p v-if="order.deliveryTracking.courierPhone" class="text-sm">
        📞 {{ order.deliveryTracking.courierPhone }}
      </p>
    </div>
    
    <div v-if="order.deliveryTracking.estimatedArrival">
      <p class="text-sm text-gray-500">Llegada estimada</p>
      <p class="font-semibold">{{ formatTime(order.deliveryTracking.estimatedArrival) }}</p>
    </div>
    
    <UButton
      v-if="order.deliveryTracking.trackingUrl"
      :to="order.deliveryTracking.trackingUrl"
      external
      icon="i-lucide-map-pin"
      block
    >
      Ver ubicación en tiempo real
    </UButton>
  </div>
</UCard>
```

## Testing Plan

1. **Mock Rappi API** (development):
   - Create test endpoint `/api/test/rappi-mock`
   - Return fake tracking data
   - Verify deliveryTracking is stored

2. **Staging with Rappi Sandbox**:
   - Use Rappi test credentials
   - Create test order → ready → en_route
   - Verify dispatch + tracking URL

3. **Production**:
   - Monitor error logs
   - Track dispatch success rate
   - User feedback on tracking accuracy

## Costs & Business Considerations

- **Rappi commission:** ~15-25% per order
- **PedidosYa commission:** ~20-30% per order
- **Alternative:** In-house delivery fleet with Google Maps API
- **Hybrid:** Use partners only during peak hours

## Future Enhancements

- [ ] Multi-provider routing (choose cheapest/fastest)
- [ ] In-app map view with courier location
- [ ] ETA updates via webhook
- [ ] Automatic courier rating after delivery
- [ ] Delivery zone optimization (closest courier)

---

**Status:** 📝 Spec ready, implementation pending  
**Priority:** Medium (after core MVP launch)  
**Estimated effort:** 2-3 days (Rappi only), 1 week (multi-provider)
