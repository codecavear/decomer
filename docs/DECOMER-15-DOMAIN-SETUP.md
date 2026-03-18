# DECOMER-15: Dominio decomer.com.ar + SSL

**Status:** Awaiting name confirmation
**Date:** 2026-03-18 04:18 UTC
**Assigned:** Forge

## Current State

- **Live URL:** https://decomer.codecave.ar
- **Railway:** Project "MVPs" / Service "DeComer"
- **Domain Status:** `decomer.com.ar` NOT registered ❌

## Steps to Complete (Pending Approval)

### 1. Register Domain at NIC.ar
```bash
# Manual process - needs Oso to:
# 1. Go to https://nic.ar/
# 2. Search "decomer.com.ar"
# 3. Register with codeCave business info
# 4. Update nameservers to Cloudflare:
#    - NS1: isla.ns.cloudflare.com
#    - NS2: tim.ns.cloudflare.com
```

### 2. Configure Cloudflare DNS
```bash
export CF_TOKEN="owbdqOSdXPtDpjBGddlGKI0fHCcTINGRldMx-hJV"
export ZONE_ID="4809a5cd9d6f96fe6a6949d62bd52af8"  # codecave.ar zone

# Get Railway service URL
cd /root/clawd/decomer
railway status

# Add CNAME record pointing to Railway
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CNAME",
    "name": "decomer.com.ar",
    "content": "<railway-service-url>.up.railway.app",
    "proxied": true
  }'
```

**Note:** If registering new zone (decomer.com.ar), need to create new Cloudflare zone first.

### 3. Add Custom Domain to Railway
```bash
cd /root/clawd/decomer
railway domain decomer.com.ar
```

Railway will automatically provision SSL via Let's Encrypt.

### 4. Test & Verify
```bash
# Wait for DNS propagation (can take up to 48h, usually <1h)
dig +short decomer.com.ar
curl -I https://decomer.com.ar

# Verify SSL
openssl s_client -connect decomer.com.ar:443 -servername decomer.com.ar < /dev/null
```

### 5. Update Environment & Docs
- Update `nuxt.config.ts` if baseURL is hardcoded
- Update README.md with new production URL
- Update any API endpoints or CORS configs

## Blockers

- ⏸️ **Awaiting confirmation:** Is "DeComer" the final name?
- If name changes, register different domain

## Next Actions

Once approved:
1. Coordinate with Oso for NIC.ar registration
2. Configure Cloudflare DNS
3. Add domain to Railway
4. Test deployment
5. Move task to `in_review`
