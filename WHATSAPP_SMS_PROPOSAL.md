# WhatsApp / SMS Notifications - Technical Proposal

## Current Status
✅ Copy ready (`copy/06-sms-whatsapp.md`)  
❌ Provider not selected  
❌ API credentials not configured  
❌ Templates not approved (WhatsApp requirement)

## Provider Options

### 1. Twilio (Recommended)
**Pros:**
- SMS + WhatsApp unified API
- Simple integration
- Good pricing for Argentina
- Excellent docs

**Pricing (Argentina):**
- SMS: ~$0.05 USD per message
- WhatsApp: $0.005 USD per session (24h window)
- Monthly cost estimate (100 users, 5 msg/week): ~$10-20 USD/month

**Implementation:**
```bash
npm install twilio
```

**API Example:**
```typescript
const twilio = require('twilio')(accountSid, authToken)

await twilio.messages.create({
  from: 'whatsapp:+14155238886',
  to: 'whatsapp:+5493515123456',
  body: '✅ Pedido #1234 confirmado...'
})
```

### 2. WhatsApp Business API (Direct)
**Pros:**
- No intermediary fees
- Official Meta solution

**Cons:**
- Complex setup (requires business verification)
- Template approval process (2-3 days)
- More development work

**Not recommended** for MVP phase.

### 3. Vonage (Alternative)
**Similar to Twilio but:**
- Less common in LATAM
- Slightly higher pricing
- Fewer community resources

## Implementation Plan

### Phase 1: SMS Only (Simpler)
1. Setup Twilio account
2. Verify phone number
3. Implement `sendSMS(phone, template, data)` utility
4. Integrate with order status changes
5. Test with 5-10 users

**Timeline:** 1-2 days  
**Cost:** ~$5-10 USD/month initial

### Phase 2: WhatsApp (Richer)
1. Apply for WhatsApp Business API via Twilio
2. Submit templates for approval
3. Implement `sendWhatsApp(phone, template, data)` utility
4. Add fallback to SMS if WhatsApp fails
5. Enable auto-responses (chatbot)

**Timeline:** 3-5 days (includes approval wait)  
**Cost:** ~$10-20 USD/month

## Technical Requirements

### Environment Variables
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
NOTIFICATIONS_ENABLED=true
```

### Database Schema (Already exists)
```typescript
// users table has phone field
users.phone // e.g., "+5493515123456"
```

### Notification Preferences
Add to user settings:
```typescript
{
  notificationPreferences: {
    sms: boolean,
    whatsApp: boolean,
    push: boolean,
    email: boolean
  }
}
```

## Triggers (From DECOMER-9)

1. **Pedido confirmado** → SMS/WhatsApp
2. **En camino** → SMS/WhatsApp
3. **Entregado** → SMS/WhatsApp
4. **Recordatorio viandas** → WhatsApp (interactive)
5. **Renovación plan** → WhatsApp/SMS

## Copy Templates (Ready)
All templates exist in `copy/06-sms-whatsapp.md`:
- ✅ Order confirmed
- ✅ En route
- ✅ Delivered
- ✅ Reminder to choose meals
- ✅ New menu available
- ✅ Payment failed
- ✅ Subscription renewal
- ✅ Auto-responses (chatbot)

## Blockers for Implementation

### Business Decisions Needed (Oso):
1. **Budget approval** (~$10-20 USD/month)
2. **Provider choice** (recommend Twilio)
3. **Phone number** (Twilio provides one, or use own)
4. **Notification frequency limits** (avoid spam)
5. **Opt-out flow** (GDPR/privacy compliance)

### Technical Blockers:
- None (ready to implement once approved)

## Implementation Roadmap (Post-Approval)

### Step 1: Provider Setup (30 min)
1. Create Twilio account at https://www.twilio.com/
2. Verify business (docs, tax ID)
3. Purchase phone number (Argentina +54 recommended)
4. Get Account SID + Auth Token
5. Add credentials to Railway env vars

### Step 2: Database Migration (15 min)
```sql
-- Add phone to users (if not exists)
ALTER TABLE decomer_users
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add notification preferences
ALTER TABLE decomer_users
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"sms": true, "whatsapp": true, "push": true, "email": true}';

-- Create notifications log table
CREATE TABLE decomer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES decomer_users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'sms' | 'whatsapp' | 'email' | 'push'
  template VARCHAR(100) NOT NULL, -- 'order_confirmed' | 'en_route' | etc.
  status VARCHAR(20) NOT NULL, -- 'sent' | 'failed' | 'delivered'
  provider VARCHAR(50), -- 'twilio' | 'vonage'
  external_id VARCHAR(100), -- Twilio message SID
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX notifications_user_idx ON decomer_notifications(user_id);
CREATE INDEX notifications_type_idx ON decomer_notifications(type);
CREATE INDEX notifications_created_idx ON decomer_notifications(created_at);
```

### Step 3: Notification Service Utility (2 hours)
Create `server/utils/notifications.ts`:

```typescript
import twilio from 'twilio'
import { getDb } from './db'
import { notifications } from '../database/schema/notifications'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

interface NotificationData {
  userId: string
  phone: string
  template: string
  data: Record<string, any>
}

export async function sendSMS(params: NotificationData) {
  const { userId, phone, template, data } = params
  const message = renderTemplate(template, data, 'sms')
  
  try {
    const result = await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
      body: message
    })
    
    await logNotification({
      userId,
      type: 'sms',
      template,
      status: 'sent',
      provider: 'twilio',
      externalId: result.sid,
      metadata: { phone, messageLength: message.length }
    })
    
    return { success: true, messageId: result.sid }
  } catch (error) {
    await logNotification({
      userId,
      type: 'sms',
      template,
      status: 'failed',
      provider: 'twilio',
      metadata: { error: error.message, phone }
    })
    
    throw error
  }
}

export async function sendWhatsApp(params: NotificationData) {
  const { userId, phone, template, data } = params
  const message = renderTemplate(template, data, 'whatsapp')
  
  try {
    const result = await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${phone}`,
      body: message
    })
    
    await logNotification({
      userId,
      type: 'whatsapp',
      template,
      status: 'sent',
      provider: 'twilio',
      externalId: result.sid,
      metadata: { phone }
    })
    
    return { success: true, messageId: result.sid }
  } catch (error) {
    // Fallback to SMS
    console.warn('WhatsApp failed, falling back to SMS:', error.message)
    return await sendSMS(params)
  }
}

function renderTemplate(template: string, data: Record<string, any>, channel: 'sms' | 'whatsapp'): string {
  const templates = {
    order_confirmed: {
      sms: `✅ Pedido #${data.orderNumber} confirmado\nEntrega: ${data.deliveryDate} 9-14hs\nViandas: ${data.quantity}\nTotal: $${data.total}`,
      whatsapp: `✅ *Pedido #${data.orderNumber} confirmado*\n\n📦 Entrega: ${data.deliveryDate} 9-14hs\n🍱 Viandas: ${data.quantity}\n💰 Total: $${data.total}\n\nVer detalles: ${data.orderUrl}`
    },
    en_route: {
      sms: `🚴 Tu pedido está en camino\nLlega en aprox ${data.eta}\nDirección: ${data.address}`,
      whatsapp: `🚴 *Tu pedido está en camino*\n\n⏱️ Llega en aprox ${data.eta}\n📍 ${data.address}\n\nSeguir pedido: ${data.trackingUrl}`
    },
    delivered: {
      sms: `📦 Pedido entregado\nGuardá las viandas en la heladera. Duran 4-5 días.`,
      whatsapp: `📦 *Pedido entregado*\n\nGuardá las viandas en la heladera 🧊\nDuran 4-5 días.\n\n¿Todo bien? Respondé este mensaje si hubo algún problema.`
    }
    // ... más templates según copy/06-sms-whatsapp.md
  }
  
  return templates[template]?.[channel] || 'Notificación de DeComer'
}

async function logNotification(log: any) {
  const db = getDb()
  await db.insert(notifications).values(log)
}
```

### Step 4: Integrate with Order Status (30 min)
Update `server/api/admin/kitchen/orders/[id].patch.ts`:

```typescript
// After order status update
if (updatedOrder.status === 'confirmed' || updatedOrder.status === 'en_route' || updatedOrder.status === 'delivered') {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, updatedOrder.userId))
    
    if (user.phone && user.notificationPreferences?.sms !== false) {
      await sendWhatsApp({
        userId: user.id,
        phone: user.phone,
        template: `order_${updatedOrder.status}`,
        data: {
          orderNumber: updatedOrder.id.slice(0, 8),
          deliveryDate: formatDate(updatedOrder.createdAt),
          quantity: updatedOrder.items.length,
          total: updatedOrder.totalAmount,
          orderUrl: `${process.env.APP_URL}/orders/${updatedOrder.id}`,
          address: updatedOrder.deliveryAddress?.street,
          eta: '20-30 min'
        }
      })
    }
  } catch (error) {
    console.error('SMS/WhatsApp notification failed:', error)
    // Don't block order update
  }
}
```

### Step 5: User Preferences UI (1 hour)
Create `app/pages/settings/notifications.vue`:

```vue
<script setup>
const { data: user, refresh } = await useFetch('/api/profile')
const toast = useToast()

const preferences = ref(user.value?.notificationPreferences || {
  sms: true,
  whatsapp: true,
  push: true,
  email: true
})

async function savePreferences() {
  await $fetch('/api/profile', {
    method: 'PATCH',
    body: { notificationPreferences: preferences.value }
  })
  toast.add({ title: 'Preferencias guardadas', color: 'green' })
  refresh()
}
</script>

<template>
  <UContainer>
    <div class="py-8 space-y-6">
      <h1 class="text-2xl font-bold">Notificaciones</h1>
      
      <UCard>
        <div class="space-y-4">
          <UFormGroup label="SMS">
            <UToggle v-model="preferences.sms" />
          </UFormGroup>
          
          <UFormGroup label="WhatsApp">
            <UToggle v-model="preferences.whatsapp" />
            <template #hint>
              <p class="text-sm text-gray-500">
                Responde mensajes para hablar con nosotros
              </p>
            </template>
          </UFormGroup>
          
          <UFormGroup label="Push (navegador)">
            <UToggle v-model="preferences.push" />
          </UFormGroup>
          
          <UFormGroup label="Email">
            <UToggle v-model="preferences.email" />
          </UFormGroup>
        </div>
        
        <template #footer>
          <UButton @click="savePreferences">
            Guardar cambios
          </UButton>
        </template>
      </UCard>
      
      <UCard>
        <template #header>
          <h3 class="font-semibold">Tu número de teléfono</h3>
        </template>
        
        <UFormGroup label="Teléfono" hint="+54 9 351 123 4567">
          <UInput v-model="user.phone" placeholder="+54 9 351 123 4567" />
        </UFormGroup>
        
        <template #footer>
          <UButton @click="updatePhone">
            Actualizar teléfono
          </UButton>
        </template>
      </UCard>
    </div>
  </UContainer>
</template>
```

### Step 6: Admin Test Endpoint (30 min)
Create `server/api/admin/notifications/test.post.ts`:

```typescript
export default defineEventHandler(async (event) => {
  await requireAdminRole(event)
  
  const { phone, template } = await readBody(event)
  
  const result = await sendWhatsApp({
    userId: 'test',
    phone,
    template,
    data: {
      orderNumber: 'TEST123',
      deliveryDate: 'Mañana',
      quantity: 5,
      total: 2500,
      orderUrl: 'https://decomer.ar/orders/test'
    }
  })
  
  return { success: true, ...result }
})
```

### Step 7: Testing (1-2 hours)
1. Test SMS to own phone
2. Test WhatsApp to own phone
3. Test fallback (WhatsApp → SMS)
4. Test opt-out flow
5. Test rate limiting
6. Verify logs in DB

### Step 8: Deploy (15 min)
1. Set env vars in Railway
2. Run migration
3. Deploy
4. Monitor logs for 24h

## Total Estimated Time: 6-8 hours
**Breakdown:**
- Setup: 1h
- Code: 4h
- Testing: 2h
- Deploy: 1h

## Next Steps

1. **Oso decides:** Budget + Twilio approval
2. **Forge implements:** (following roadmap above)
3. **Docta QA:** Test with real phone numbers
4. **Launch:** Enable for all users

## Estimated Timeline
- SMS only: **2 days** (after approval)
- SMS + WhatsApp: **5 days** (after approval + template approval)

## Files to Create

```
server/utils/notifications.ts       # sendSMS, sendWhatsApp, sendEmail
server/api/notifications/test.post.ts  # Admin endpoint to test
app/pages/settings/notifications.vue   # User preferences
```

## Security & Privacy

- Phone numbers encrypted at rest
- Opt-out link in every message
- Rate limiting (max 5 msg/day per user)
- Compliance with Argentina's DNU 70/2023 (data protection)

---

**Status:** Ready to implement pending business approval.  
**Owner:** Forge (backend)  
**Blocker:** Oso decision on budget + provider
