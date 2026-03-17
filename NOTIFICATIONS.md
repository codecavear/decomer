# DeComer — Sistema de Notificaciones

Sistema de notificaciones multi-canal (WhatsApp, SMS, Email, Push) con tracking completo.

## Configuración

### Variables de Entorno (Twilio)

Agregar en Railway:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890           # Para SMS
TWILIO_WHATSAPP_NUMBER=+14155238886       # Para WhatsApp (Twilio Sandbox o número verificado)
```

### Obtener Credenciales de Twilio

1. Crear cuenta en [Twilio](https://www.twilio.com/)
2. Ir a Console → Account Info:
   - **Account SID**: `ACxxxxxxxxxx`
   - **Auth Token**: Click "Show" y copiar
3. Para SMS: Comprar un número en "Phone Numbers"
4. Para WhatsApp:
   - **Sandbox (testing)**: Console → Messaging → Try it out → Send a WhatsApp message
   - **Producción**: Verificar número en WhatsApp Business API

## Uso

### API Endpoint

**POST `/api/notifications/send`** (requiere rol admin)

```json
{
  "userId": "uuid",
  "channel": "whatsapp",
  "type": "order_confirmed",
  "to": "+5493515551234",
  "message": "✅ Pedido confirmado...",
  "metadata": {
    "orderId": "uuid"
  }
}
```

**Canales soportados:**
- `whatsapp` — WhatsApp via Twilio ✅
- `sms` — SMS via Twilio ✅
- `email` — Por implementar
- `push` — Push web notifications (ya implementado en otra parte)

### Notificaciones Automáticas

Se envían automáticamente al cambiar estado de orden:

| Estado | Trigger | Canal |
|--------|---------|-------|
| `confirmed` | Orden confirmada | WhatsApp |
| `en_route` | Pedido en camino (solo delivery) | WhatsApp |
| `delivered` | Pedido entregado | WhatsApp |

### Templates

Ver `server/utils/notifications.ts` para templates predefinidos:

- ✅ `OrderNotificationTemplates.orderConfirmed()`
- 🚴 `OrderNotificationTemplates.orderEnRoute()`
- 📦 `OrderNotificationTemplates.orderDelivered()`
- 📋 `OrderNotificationTemplates.reminderSelectMeals()`
- 🍽️ `OrderNotificationTemplates.newMenuAvailable()`
- ⚠️ `OrderNotificationTemplates.paymentFailed()`
- 📅 `OrderNotificationTemplates.subscriptionRenewal()`

### Tracking

Todas las notificaciones se guardan en la tabla `notifications`:

```sql
SELECT * FROM notifications 
WHERE user_id = 'uuid' 
ORDER BY created_at DESC;
```

**Estados:**
- `pending` — Creada pero no enviada
- `sent` — Enviada exitosamente
- `failed` — Falló el envío
- `delivered` — Confirmada entrega (webhook de Twilio)

## Migración de Base de Datos

La tabla `notifications` se crea automáticamente en el siguiente deploy.

Para aplicar manualmente:

```bash
railway run -- npx drizzle-kit generate
railway run -- npx drizzle-kit migrate
```

## Desarrollo Local

Sin credenciales de Twilio, las notificaciones se marcarán como `failed` pero no romperán el flujo de órdenes.

Para testing con Twilio Sandbox (WhatsApp):
1. Ir a Twilio Console → Messaging → Try WhatsApp
2. Seguir instrucciones para conectar tu número
3. Usar el número sandbox en `TWILIO_WHATSAPP_NUMBER`

## Próximos Pasos

- [ ] Webhooks de Twilio para actualizar estado `delivered`
- [ ] Templates personalizables desde admin panel
- [ ] Soporte para Email (Resend o similar)
- [ ] Rate limiting para evitar spam
- [ ] Preferencias de notificación por usuario
- [ ] Horarios de envío (no molestar de noche)

## Referencias

- Copy de mensajes: `/copy/06-sms-whatsapp.md`
- Service: `server/utils/notifications.ts`
- Order hooks: `server/utils/order-notifications.ts`
- Schema: `server/database/schema/notifications.ts`
