# Dominio DeComer - Checklist

## Estado Actual
- **Dominio temporal:** decomer.codecave.ar (Railway + Cloudflare)
- **Dominio objetivo:** decomer.com.ar
- **Registrar:** NIC.ar

## Pasos para Migración

### 1. Registro en NIC.ar
**⚠️ BLOCKER — Requiere acceso manual de Oso**

```bash
# Ir a https://nic.ar
# Login con cuenta de Oso
# Registrar "decomer.com.ar"
# Costo: ~$500-800 ARS/año
```

### 2. Configurar DNS en Cloudflare
Una vez registrado el dominio en NIC.ar:

```bash
# Variables
export CF_TOKEN="owbdqOSdXPtDpjBGddlGKI0fHCcTINGRldMx-hJV"
export ZONE_ID="4809a5cd9d6f96fe6a6949d62bd52af8"  # codecave.ar

# CNAME para Railway
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CNAME",
    "name": "decomer",
    "content": "decomer.up.railway.app",
    "proxied": true
  }'
```

### 3. Railway Custom Domain
```bash
cd /root/clawd/decomer
railway service link DeComer
railway domain add decomer.com.ar
```

### 4. Actualizar App Config
Actualizar variables de entorno en Railway:
- `NUXT_PUBLIC_SITE_URL=https://decomer.com.ar`
- `NUXT_PUBLIC_API_URL=https://decomer.com.ar/api`

### 5. SSL
Railway + Cloudflare manejan SSL automáticamente. Verificar con:
```bash
curl -I https://decomer.com.ar
```

## Testing Post-Migración
- [ ] Verificar redirect de www → apex
- [ ] Validar SSL certificate
- [ ] Probar todas las rutas críticas
- [ ] Verificar OG tags con dominio nuevo
- [ ] Actualizar sitemap.xml
- [ ] Google Search Console — agregar propiedad nueva

## Referencias
- NIC.ar: https://nic.ar
- Cloudflare DNS: https://dash.cloudflare.com/4809a5cd9d6f96fe6a6949d62bd52af8
- Railway: https://railway.app/project/mvps
