# Subscription System - DeComer

Sistema de suscripciones para viandas con MercadoPago.

## Features

- ✅ 3 planes: Básico (5 meals/week), Full (10 meals/week), Premium (14 meals/week)
- ✅ Frecuencia: semanal o mensual
- ✅ Trial period con 20% descuento
- ✅ Pausar/reanudar suscripción
- ✅ Cambiar plan (upgrade/downgrade)
- ✅ Cancelar al final del período
- ✅ MercadoPago checkout integration
- ✅ Webhook handler para payment notifications

## Schema

### Tables

**`decomer_meal_plans`**
- Plans disponibles (basico, full, premium)
- Pricing semanal/mensual
- Features (canCustomize, priorityDelivery, etc.)

**`decomer_user_meal_subscriptions`**
- Suscripciones activas de usuarios
- Status: active, paused, cancelled, trialing
- Period dates, trial info
- MercadoPago IDs

**`decomer_subscription_history`**
- Historial de cambios (created, upgraded, paused, etc.)

**`decomer_subscription_orders`**
- Pedidos tanto de suscripción como one-time
- Delivery info, payment status
- MercadoPago payment tracking

**`decomer_subscription_order_items`**
- Viandas en cada pedido
- Snapshot de datos de vianda (para histórico)

## API Endpoints

### GET `/api/subscriptions/plans`
Lista planes disponibles (públicos, no requiere auth).

**Response:**
```json
[
  {
    "id": "uuid",
    "type": "basico",
    "name": "Plan Básico",
    "description": "5 viandas semanales...",
    "priceWeekly": "2500.00",
    "priceMonthly": "9000.00",
    "mealsPerWeek": 5,
    "canCustomize": false,
    "priorityDelivery": false
  }
]
```

### GET `/api/subscriptions/me`
Obtiene suscripción activa del usuario autenticado.

**Response:**
```json
{
  "subscription": {
    "id": "uuid",
    "planId": "uuid",
    "status": "active",
    "frequency": "weekly",
    "currentPeriodStart": "2026-03-21T00:00:00Z",
    "currentPeriodEnd": "2026-03-28T00:00:00Z",
    "isTrialPeriod": true
  },
  "plan": { /* plan details */ },
  "history": [ /* subscription history */ ]
}
```

### POST `/api/subscriptions/checkout`
Crea checkout de MercadoPago para nueva suscripción.

**Body:**
```json
{
  "planId": "uuid",
  "frequency": "weekly",
  "isTrial": true
}
```

**Response:**
```json
{
  "success": true,
  "preferenceId": "123456789-abc",
  "initPoint": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "sandboxInitPoint": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=..."
}
```

Frontend debe redirigir al usuario a `initPoint` (producción) o `sandboxInitPoint` (testing).

### POST `/api/subscriptions/manage`
Gestiona suscripción existente (pause, resume, cancel, change_plan).

**Body (pause):**
```json
{
  "action": "pause",
  "subscriptionId": "uuid",
  "reason": "De vacaciones por 2 semanas"
}
```

**Body (resume):**
```json
{
  "action": "resume",
  "subscriptionId": "uuid"
}
```

**Body (cancel):**
```json
{
  "action": "cancel",
  "subscriptionId": "uuid",
  "reason": "Ya no necesito el servicio"
}
```

**Body (change_plan):**
```json
{
  "action": "change_plan",
  "subscriptionId": "uuid",
  "newPlanId": "uuid"
}
```

### POST `/api/webhooks/mercadopago`
Webhook para recibir notificaciones de pagos de MercadoPago.

**Configuración en MercadoPago:**
- URL: `https://decomer.codecave.ar/api/webhooks/mercadopago`
- Eventos: `payment` (approved, rejected, cancelled)

**Proceso:**
1. MercadoPago envía notificación cuando cambia estado de pago
2. Webhook valida payment ID
3. Fetch payment details desde MercadoPago API
4. Si payment approved → create subscription
5. Log evento para debugging

## Environment Variables

Agregar a `.env`:

```bash
MERCADOPAGO_ACCESS_TOKEN=APP_USR-your-access-token
NUXT_PUBLIC_BASE_URL=https://decomer.codecave.ar
```

**Obtener Access Token:**
1. Login en https://www.mercadopago.com.ar/developers
2. Ir a "Tus aplicaciones" → Crear aplicación
3. Copiar Access Token (Producción o Sandbox)

## Testing

### Test con Sandbox

1. Usar `MERCADOPAGO_ACCESS_TOKEN` de **Sandbox**
2. Redirigir a `sandboxInitPoint` en lugar de `initPoint`
3. Usar tarjetas de prueba: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards

**Tarjetas de prueba (Argentina):**
- **Aprobado:** 5031 7557 3453 0604 (cualquier CVV, fecha futura)
- **Rechazado:** 5031 4332 1540 6351
- **Pendiente:** 5031 4418 2691 6980

## Workflow Completo

1. **User selects plan:**
   - Frontend muestra planes (GET `/api/subscriptions/plans`)
   - User elige plan y frecuencia

2. **Checkout:**
   - POST `/api/subscriptions/checkout` con `{ planId, frequency, isTrial }`
   - Backend crea MercadoPago preference
   - Frontend redirige a `initPoint`

3. **Payment:**
   - User completa pago en MercadoPago
   - MercadoPago redirect a success/failure/pending URL

4. **Webhook notification:**
   - MercadoPago envía webhook a `/api/webhooks/mercadopago`
   - Backend crea subscription si payment approved
   - User ve subscription activa en `/api/subscriptions/me`

5. **Gestión:**
   - User puede pause/resume/cancel/change_plan via `/api/subscriptions/manage`

## TODO (Next Steps)

- [ ] Frontend UI para selección de planes
- [ ] Frontend checkout flow (redirect a MercadoPago)
- [ ] Frontend subscription management page
- [ ] Email notifications (welcome, payment success, cancellation)
- [ ] Cron job para renovar suscripciones al final de período
- [ ] Retry logic para failed payments
- [ ] Admin panel para gestionar suscripciones

## Notes

- Trial discount (20%) se aplica solo al primer pago
- Cancelación ocurre al **final del período** — user mantiene acceso hasta `currentPeriodEnd`
- Pause no detiene billing — user debe **cancel** si no quiere cobro
- Change plan aplica **inmediatamente** pero proration pendiente de implementar
