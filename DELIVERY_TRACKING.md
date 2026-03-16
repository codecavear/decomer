# Delivery Tracking Implementation

## Overview
Sistema de tracking de pedidos con notificaciones push en cada cambio de estado.

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

## Notes

- Push subscriptions expiradas se eliminan automáticamente (status 410/404)
- Las notificaciones NO bloquean la actualización del pedido (try/catch)
- Múltiples dispositivos soportados por usuario
