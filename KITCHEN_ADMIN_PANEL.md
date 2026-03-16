# Kitchen Admin Panel - DeComer

## Overview
Panel administrativo para gestión de cocina, preparación de viandas y control de pedidos en tiempo real.

## Deployed Route
`/admin/kitchen`

## Features Implemented ✅

### 1. Order Management Dashboard
**Kanban board** con 4 columnas de estados:
- **Confirmados** → Pedidos confirmados, listo para preparar
- **En Preparación** → Pedidos en proceso activo de cocina
- **Listos** → Pedidos completados, listos para entrega/pickup
- **En Camino** → Pedidos en delivery (solo para tipo `delivery`)

**Cada card muestra:**
- ID corto del pedido (#abcd1234)
- Nombre del cliente
- Monto total
- Items y cantidades
- Dirección de entrega (si aplica)
- Notas especiales
- Botones de acción según estado

**Acciones por estado:**
- Confirmado → "Comenzar" (pasa a `preparing`)
- En Preparación → "Marcar listo" (pasa a `ready`)
- Listo (delivery) → "En Camino" (pasa a `en_route`)
- Listo (pickup) → "Entregado" (pasa a `delivered`)
- En Camino → "Entregado" (pasa a `delivered`)

### 2. Grouped Products View
Vista de **viandas agrupadas** para planificación de cocina:
- Total de unidades a preparar por producto
- Cantidad de pedidos que incluyen cada producto
- Imagen del producto
- Ordenado por cantidad descendente

**Ejemplo:**
```
🍱 Pollo Grillado con Vegetales
   45 unidades | 18 pedidos
```

### 3. Weekly Menu Management
Gestión del catálogo de productos:
- Vista de grid con cards de productos
- Badges de disponibilidad
- Tags nutricionales (vegetariano, vegano, sin gluten, low carb)
- Información nutricional (calorías, proteína, carbos, grasa)
- Precio y descripción
- Imagen del producto
- Botones de edición/eliminación

### 4. Real-time Stats
Dashboard de métricas del día:
- **Pedidos hoy** → Total de pedidos creados hoy
- **Clientes activos** → Clientes con subscripciones activas
- **Facturación semanal** → Revenue de los últimos 7 días (solo pedidos pagados)
- **Pendientes** → Pedidos confirmados + en preparación

## API Endpoints

### GET `/api/admin/kitchen/orders`
Retorna pedidos activos del día (estados: `confirmed`, `preparing`, `ready`).

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "storeId": "uuid",
    "status": "confirmed",
    "paymentStatus": "paid",
    "totalAmount": "25.50",
    "deliveryType": "delivery",
    "deliveryAddress": {...},
    "notes": "Sin cebolla",
    "userName": "Juan Pérez",
    "userEmail": "juan@mail.com",
    "items": [...]
  }
]
```

### PATCH `/api/admin/kitchen/orders/:id`
Actualiza el estado de un pedido.

**Body:**
```json
{
  "status": "preparing" | "ready" | "en_route" | "delivered" | "cancelled"
}
```

**Side effects:**
- Envía push notification al usuario
- Actualiza `updatedAt`
- TODO: Notifica a partner de delivery (Rappi/PedidosYa) si aplica

### GET `/api/admin/kitchen/stats`
Retorna métricas del dashboard.

**Response:**
```json
{
  "todayOrders": 42,
  "pendingOrders": 8,
  "activeCustomers": 127,
  "weeklyRevenue": "$8,450.00"
}
```

### GET `/api/admin/kitchen/grouped-products`
Retorna productos agrupados con cantidades totales del día.

**Response:**
```json
[
  {
    "productId": "uuid",
    "productName": "Pollo Grillado",
    "productImage": "https://...",
    "totalQuantity": 45,
    "orderCount": 18
  }
]
```

### GET `/api/admin/menu/products`
Retorna todos los productos del menú con información completa.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Pollo Grillado",
    "description": "...",
    "price": "12.50",
    "imageUrl": "https://...",
    "categoryId": "uuid",
    "categoryName": "Carnes",
    "calories": 350,
    "protein": 45,
    "carbs": 15,
    "fat": 8,
    "isVegetarian": false,
    "isVegan": false,
    "isGlutenFree": true,
    "isLowCarb": true,
    "isAvailable": true
  }
]
```

## Authorization
Todos los endpoints requieren:
- Sesión autenticada (`requireUserSession`)
- Rol de usuario `admin` (`requireAdminRole`)

## Database Schema

### Orders
```typescript
status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'en_route' | 'delivered' | 'cancelled'
deliveryType: 'pickup' | 'delivery'
paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
```

## UI Components (Nuxt UI v4)
- `UCard` - Cards de pedidos, stats, productos
- `UBadge` - Estados, cantidades, tags
- `UButton` - Acciones de cambio de estado
- `UTabs` - Navegación entre vistas (Pedidos / Productos / Menú)
- `UContainer` - Layout wrapper
- `UToast` - Feedback de acciones

## Future Enhancements
- [ ] WebSocket real-time updates (no manual refresh)
- [ ] Rappi/PedidosYa API integration para notificaciones de delivery
- [ ] Filtros por fecha/rango
- [ ] Exportación de reportes (PDF/Excel)
- [ ] Notificaciones de sonido cuando llega un nuevo pedido
- [ ] Vista de preparación por estación (cocina caliente, fría, ensaladas, etc.)
- [ ] Timer tracking por pedido (tiempo en cada estado)
- [ ] Printer integration para tickets de cocina

## Related Tasks
- DECOMER-11 ✅ (this task)
- DECOMER-12 🔜 Delivery tracking básico (push notifications más profundas)
- DECOMER-9 🔜 WhatsApp/SMS notifications

## Testing
```bash
# Visit admin panel
open https://decomer.up.railway.app/admin/kitchen

# Mock order flow
1. Create test order as customer
2. Login as admin (role: 'admin' in DB)
3. Navigate to /admin/kitchen
4. Verify order appears in "Confirmados"
5. Click "Comenzar" → should move to "En Preparación"
6. Click "Marcar listo" → should move to "Listos"
7. Click "En Camino" or "Entregado" based on delivery type
```

---

**Author:** Forge 🔧  
**Date:** 2026-03-16  
**Status:** ✅ Complete
