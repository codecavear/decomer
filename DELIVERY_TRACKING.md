# Delivery Tracking Implementation — DECOMER-12

## Overview
Sistema completo de tracking de pedidos con notificaciones push automáticas en cada cambio de estado. Implementado con Web Push API, service workers, y backend en Nitro.

## Order Status Flow

```
pending → confirmed → preparing → ready → en_route → delivered
                                              ↓
                                         (pickup) → delivered
                                              ↓
                                          cancelled
```

### Estados:
- **pending**: Pedido recibido, esperando confirmación
- **confirmed**: Pedido confirmado, esperando preparación
- **preparing**: Pedido en preparación
- **ready**: Pedido listo para entrega/retiro
- **en_route**: Pedido en camino (solo delivery)
- **delivered**: Pedido entregado
- **cancelled**: Pedido cancelado

## Push Notifications

### Setup

1. Generar VAPID keys:
```bash
npx web-push generate-vapid-keys
```

2. Agregar a `.env`:
```env
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:info@decomer.ar
```

### API Endpoints

#### Subscribe
```
POST /api/push/subscribe
Body: {
  endpoint: string,
  keys: {
    p256dh: string,
    auth: string
  }
}
```

#### Unsubscribe
```
POST /api/push/unsubscribe
Body: {
  endpoint: string
}
```

#### Get VAPID Public Key
```
GET /api/push/vapid-key
Response: {
  publicKey: string
}
```

### Notification Messages

Cada estado tiene su propio mensaje:
- **pending**: "Pedido Recibido" - Tu pedido está siendo procesado
- **confirmed**: "Pedido Confirmado" - Pronto comenzaremos a prepararlo
- **preparing**: "Preparando tu Pedido" - Estamos cocinando con cuidado
- **ready**: "Pedido Listo" - Listo para retirar o será enviado pronto
- **en_route**: "En Camino" - Tu pedido llegará pronto 🚚
- **delivered**: "Pedido Entregado" - ¡Que lo disfrutes! ✨
- **cancelled**: "Pedido Cancelado"

## Admin Panel

Panel de cocina (`/admin/kitchen`) con 4 columnas Kanban:
1. **Confirmados** (azul)
2. **En Preparación** (amarillo)
3. **Listos** (verde)
4. **En Camino** (morado)

### Flujo de Botones:
- Confirmed → "Comenzar" → Preparing
- Preparing → "Marcar listo" → Ready
- Ready (delivery) → "En Camino" → En Route
- Ready (pickup) → "Entregado" → Delivered
- En Route → "Entregado" → Delivered

## Integration with Delivery Apps

### TODO: Rappi/PedidosYa Integration
Cuando un pedido cambia a `en_route` y el `deliveryType` es `delivery`:
1. Notificar a la app de delivery (Rappi/PedidosYa)
2. Obtener tracking link
3. Guardar tracking info en `deliveryTracking` JSONB field (future)

## Testing Push Notifications

1. Frontend debe registrar service worker
2. Solicitar permisos de notificación
3. Subscribe al endpoint `/api/push/subscribe`
4. Cambiar estado de un pedido en admin panel
5. Verificar que llega la notificación

## Frontend Implementation

### Service Worker
`public/sw.js` — Maneja:
- PWA caching (menu, static assets)
- Push event listener
- Notification click handler
- Custom notification actions por tipo

Auto-registrado via plugin `app/plugins/sw.client.ts`.

### Composable
`app/composables/usePushNotifications.ts` — Expone:

```typescript
const {
  permission,        // NotificationPermission reactive state
  isSubscribed,      // Boolean reactive state
  requestPermission, // () => Promise<NotificationPermission>
  subscribeToPush,   // () => Promise<boolean>
  unsubscribe,       // () => Promise<boolean>
  checkSubscription  // () => Promise<void>
} = usePushNotifications()
```

### Usage Example
```vue
<script setup>
const { isSubscribed, subscribeToPush } = usePushNotifications()

async function enableNotifications() {
  const success = await subscribeToPush()
  if (success) {
    console.log('Push enabled!')
  }
}
</script>

<template>
  <UButton v-if="!isSubscribed" @click="enableNotifications">
    Activar notificaciones
  </UButton>
</template>
```

## Deployment Checklist

✅ Backend APIs implemented:
- `/api/push/subscribe` ✅
- `/api/push/unsubscribe` ✅
- `/api/push/vapid-key` ✅
- Order status update with push trigger ✅

✅ Frontend:
- Service worker registered ✅
- Push composable available ✅
- VAPID public key in runtime config ✅

⚠️ Environment Variables (`.env`):
```env
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:info@decomer.ar
```

🚨 Generate VAPID keys if not set:
```bash
npx web-push generate-vapid-keys
```

## Database Schema

### `decomer_push_subscriptions`
```sql
id: uuid PRIMARY KEY
user_id: uuid NOT NULL REFERENCES decomer_users(id) ON DELETE CASCADE
endpoint: text NOT NULL UNIQUE
p256dh: text NOT NULL
auth: text NOT NULL
created_at: timestamp DEFAULT now()
```

Index: `push_subscriptions_user_idx` on `user_id`

## Notes

- Push subscriptions expiradas se eliminan automáticamente (status 410/404)
- Las notificaciones NO bloquean la actualización del pedido (try/catch)
- Múltiples dispositivos soportados por usuario
- El service worker cachea el menú para offline-first UX
- Notification actions personalizadas según tipo de mensaje
