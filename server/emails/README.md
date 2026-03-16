# DeComer Emails (Resend Integration)

Transactional email system for DeComer using Resend API.

## Configuration

Add to `.env`:
```bash
RESEND_API_KEY=re_xxxxx
```

**Configured:**
- **From:** `DeComer <noreply@codecave.ar>`
- **Reply-To:** `ventas@mail.codecave.ar`
- **Domain:** codecave.ar (verified)

## Available Templates

### 1. Bienvenida (Welcome)
Send after user registration.

```typescript
import { sendBienvenida } from '~/server/emails/send'

await sendBienvenida('user@example.com', {
  nombre: 'Juan Pérez',
  menuUrl: 'https://decomer.codecave.ar/menu' // optional
})
```

### 2. Pedido Confirmado (Order Confirmed)
Send after order is placed.

```typescript
import { sendPedidoConfirmado } from '~/server/emails/send'

await sendPedidoConfirmado('user@example.com', {
  nombre: 'Juan Pérez',
  numeroPedido: 'DEC-001',
  items: [
    { nombre: 'Pollo al horno con papas', cantidad: 2 },
    { nombre: 'Milanesas de carne', cantidad: 3 }
  ],
  total: 8500,
  fechaEntrega: 'Lunes 18/03',
  direccion: 'Av. Colón 1234, Córdoba',
  pedidoUrl: 'https://decomer.codecave.ar/mis-pedidos' // optional
})
```

### 3. Pedido en Camino (Out for Delivery)
Send when order is dispatched.

```typescript
import { sendPedidoEnCamino } from '~/server/emails/send'

await sendPedidoEnCamino('user@example.com', {
  nombre: 'Juan Pérez',
  numeroPedido: 'DEC-001',
  direccion: 'Av. Colón 1234, Córdoba',
  horarioEstimado: '12:30 - 13:00' // optional
})
```

### 4. Pedido Entregado (Delivered)
Send after delivery confirmation.

```typescript
import { sendPedidoEntregado } from '~/server/emails/send'

await sendPedidoEntregado('user@example.com', {
  nombre: 'Juan Pérez',
  numeroPedido: 'DEC-001',
  feedbackUrl: 'https://decomer.codecave.ar/feedback' // optional
})
```

### 5. Recordatorio Elegir (Reminder to Choose Meals)
Send to users who haven't selected meals for the week.

```typescript
import { sendRecordatorioElegir } from '~/server/emails/send'

await sendRecordatorioElegir('user@example.com', {
  nombre: 'Juan Pérez',
  deadline: 'mañana a las 18hs', // optional
  menuUrl: 'https://decomer.codecave.ar/menu' // optional
})
```

### 6. Menú Nuevo (New Menu Available)
Send when new weekly menu is published.

```typescript
import { sendMenuNuevo } from '~/server/emails/send'

await sendMenuNuevo('user@example.com', {
  nombre: 'Juan Pérez',
  viandasDestacadas: [
    { nombre: 'Pollo al horno con papas' },
    { nombre: 'Milanesas de carne' }
  ], // optional
  menuUrl: 'https://decomer.codecave.ar/menu' // optional
})
```

## Testing

### Test Endpoint
```bash
curl -X POST https://decomer.codecave.ar/api/emails/test \
  -H "Content-Type: application/json" \
  -d '{
    "type": "bienvenida",
    "to": "test@example.com"
  }'
```

Available types:
- `bienvenida`
- `pedido-confirmado`
- `pedido-en-camino`
- `pedido-entregado`
- `recordatorio-elegir`
- `menu-nuevo`

### Manual Testing
```bash
cd /root/clawd/decomer
bun run dev
```

Then in another terminal:
```bash
curl -X POST http://localhost:3000/api/emails/test \
  -H "Content-Type: application/json" \
  -d '{"type": "bienvenida", "to": "canasconrado@gmail.com"}'
```

## Architecture

```
server/emails/
├── resend.ts              # Resend API client
├── send.ts                # High-level email utilities
├── README.md              # This file
└── templates/
    ├── index.ts           # Template exports
    ├── base.ts            # Base HTML template
    ├── bienvenida.ts
    ├── pedido-confirmado.ts
    ├── pedido-en-camino.ts
    ├── pedido-entregado.ts
    ├── recordatorio-elegir.ts
    └── menu-nuevo.ts
```

## Logging

Emails are logged to console with Resend message ID:
```
[Resend] Email sent: abc123-xyz456
```

Errors are logged with details:
```
[Resend] API error: 401 Invalid API key
[Resend] Send failed: Error: Resend API error: 401
```

## Integration Points

### User Registration
```typescript
// server/api/auth/register.post.ts
import { sendBienvenida } from '~/server/emails/send'

// After user is created
await sendBienvenida(user.email, { nombre: user.name })
```

### Order Created
```typescript
// server/api/orders/index.post.ts
import { sendPedidoConfirmado } from '~/server/emails/send'

// After order is saved
await sendPedidoConfirmado(user.email, {
  nombre: user.name,
  numeroPedido: order.id,
  items: order.items,
  total: order.total,
  fechaEntrega: formatDate(order.deliveryDate),
  direccion: order.deliveryAddress
})
```

### Order Status Updates
```typescript
// server/api/orders/[id]/status.patch.ts
import { sendPedidoEnCamino, sendPedidoEntregado } from '~/server/emails/send'

if (newStatus === 'en-camino') {
  await sendPedidoEnCamino(user.email, { ... })
} else if (newStatus === 'entregado') {
  await sendPedidoEntregado(user.email, { ... })
}
```

### Scheduled Reminders (Cron)
```typescript
// server/tasks/weekly-reminder.ts
import { sendRecordatorioElegir } from '~/server/emails/send'

// For users who haven't ordered yet
for (const user of usersWithoutOrders) {
  await sendRecordatorioElegir(user.email, {
    nombre: user.name,
    deadline: 'mañana a las 18hs'
  })
}
```

### Menu Published
```typescript
// server/api/weekly-menu/publish.post.ts
import { sendMenuNuevo } from '~/server/emails/send'

// For all active subscribers
for (const user of activeUsers) {
  await sendMenuNuevo(user.email, {
    nombre: user.name,
    viandasDestacadas: menu.featured
  })
}
```

## Error Handling

All email functions throw on failure. Wrap in try/catch:

```typescript
try {
  await sendBienvenida(user.email, { nombre: user.name })
} catch (error) {
  console.error('Failed to send welcome email:', error)
  // Don't block user flow - email is non-critical
}
```

## Rate Limits

Resend Free Tier:
- **100 emails/day**
- **3,000 emails/month**

Consider:
- Batch sends for marketing emails
- Upgrade to paid plan for production
- Queue system for high volume

## Security

- **API Key:** Never commit `RESEND_API_KEY` to git
- **Email validation:** All functions validate email format
- **Reply-To:** Set to `ventas@mail.codecave.ar` (forwards to Oso's Gmail)
- **Unsubscribe:** TODO - Add unsubscribe handling

## TODO

- [ ] Add more templates (suscripción, pago fallido, etc.)
- [ ] Unsubscribe link functionality
- [ ] Email preview in dev mode
- [ ] Queue system for batch sends
- [ ] Analytics tracking (opens, clicks)
- [ ] A/B testing infrastructure
- [ ] Plain text versions (auto-generated for now)

---

**Forge 🔧**  
*2026-03-16 — DECOMER-8*
