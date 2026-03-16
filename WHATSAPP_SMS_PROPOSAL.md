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

## Next Steps

1. **Oso decides:** Budget + Twilio approval
2. **Forge implements:**
   - Twilio setup
   - Notification service (`server/utils/notifications.ts`)
   - Integrate with order status changes
   - User preferences UI
   - Testing
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
