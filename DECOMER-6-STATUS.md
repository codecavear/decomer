# DECOMER-6: Catálogo de viandas con macros y filtros

**Assignee:** Forge 🔧  
**Status:** ⚠️ Bloqueado por CI pre-existente  
**Fecha:** 2026-03-16 08:02 UTC

---

## ✅ Trabajo Completado

### 1. Schema Extension (`products`)
**Archivo:** `server/database/schema/products.ts`

Campos agregados:
```typescript
// Nutritional information
calories: integer('calories')
protein: decimal('protein', { precision: 5, scale: 1 })
carbs: decimal('carbs', { precision: 5, scale: 1 })
fat: decimal('fat', { precision: 5, scale: 1 })
fiber: decimal('fiber', { precision: 5, scale: 1 })

// Ingredients & allergens
ingredients: text('ingredients')
allergens: text('allergens')

// Dietary filters
isGlutenFree: boolean('is_gluten_free').default(false)
isLowCarb: boolean('is_low_carb').default(false)
isHighProtein: boolean('is_high_protein').default(false)
isVegetarian: boolean('is_vegetarian').default(false)

// Tags
tags: jsonb('tags').$type<string[]>()
```

Índices agregados:
- `products_vegan_idx`
- `products_gluten_free_idx`
- `products_low_carb_idx`
- `products_high_protein_idx`

### 2. Migration Generated
**Archivo:** `drizzle/migrations/0009_rapid_moondragon.sql`

Adds:
- All nutritional fields to `decomer_products`
- 4 new indexes for dietary filters
- Columns for `decomer_users`: phone, delivery_address, allergies, preferences
- Table `decomer_push_subscriptions`

**⏳ Pendiente:** Migración no aplicada en producción (Railway no deployó)

### 3. API Updates

#### `/api/products` (GET)
**Archivo:** `server/api/products/index.get.ts`

Query params agregados:
- `vegan=true`
- `glutenFree=true`
- `lowCarb=true`
- `highProtein=true`
- `vegetarian=true`

#### `/api/weekly-menu/current` (GET) — NUEVO
**Archivo:** `server/api/weekly-menu/current.get.ts`

Retorna:
```json
{
  "menu": {
    "id": "uuid",
    "weekStart": "timestamp",
    "weekEnd": "timestamp",
    "viandasByDay": {
      "all": [...],
      "0": [...],  // Sunday
      "1": [...],  // Monday
      ...
    }
  }
}
```

### 4. Schema `viandas` (Pre-existente, ya completo)
**Archivo:** `server/database/schema/viandas.ts`

El schema de viandas **YA tenía todos los campos requeridos**:
- ✅ Macros: calories, protein, carbs, fats
- ✅ Filtros: isVegetarian, isVegan, isGlutenFree, isLowCarb, isHighProtein
- ✅ Ingredients: jsonb array
- ✅ Weekly menu: `weeklyMenus` + `weeklyMenuViandas` (join table)
- ✅ API `/api/viandas` con filtros completos

**Conclusión:** El sistema de viandas ya estaba 100% implementado antes de esta tarea.

---

## 📦 Git Status

**Commit:** `1123818`  
**Message:** `feat(catalog): Add nutritional info & dietary filters to products`  
**Branch:** `main`  
**Repo:** `codecavear/decomer`  
**Pushed:** ✅ 2026-03-16 08:09 UTC

---

## ⚠️ BLOCKER: CI Pre-existente Roto

### GitHub Actions CI
**Run ID:** `23133848428`  
**Status:** ❌ Failed  
**Reason:** 62 lint errors pre-existentes

### Lint Errors (Pre-existentes, NO introducidos por este commit)
- `@typescript-eslint/no-explicit-any`: 47 errores
- `@typescript-eslint/no-unused-vars`: 15 errores
- Archivos afectados: `app/`, `server/api/catalog/`, `server/api/payments/`

### Archivos de este commit (NINGÚN error de lint)
- ✅ `server/database/schema/products.ts`
- ✅ `server/api/products/index.get.ts`
- ✅ `server/api/weekly-menu/current.get.ts`

### Impacto
- GitHub Actions CI bloqueando
- **Railway NO está deployando** (depende de CI exitoso)
- Migración pendiente de aplicación

---

## 🚀 Deploy Pendiente

### Railway Status
- **Proyecto:** MVPs
- **Servicio:** DeComer
- **Ambiente:** production
- **URL:** https://decomer.codecave.ar
- **Auto-deploy:** ❌ Bloqueado por CI

### Migración Pendiente
Una vez deployado, Railway ejecutará automáticamente:
```json
"start:migrate": "node scripts/migrate.mjs && node .output/server/index.mjs"
```

El script `migrate.mjs`:
- Conecta a `DATABASE_URL` (postgres.railway.internal)
- Aplica migraciones de `drizzle/migrations/`
- Retry logic: 5 intentos, exponential backoff

---

## 🔧 Opciones para Desbloquear

### Opción 1: Fix Global de Lint (Recomendado)
```bash
cd /root/clawd/decomer
bun run lint --fix  # Auto-fix what's possible
# Manually fix remaining errors
git commit -am "fix: resolve pre-existing lint errors"
git push origin main
```

**Pros:** Resuelve el problema permanentemente  
**Cons:** Fuera del scope de DECOMER-6, lleva tiempo (~30-60 min)

### Opción 2: Disable Lint en CI (Quick Fix)
**Archivo:** `.github/workflows/ci.yml`

```diff
- name: Lint
  run: bun run lint
+ # Temporarily disabled due to pre-existing errors
+ # run: bun run lint
```

**Pros:** Deploy inmediato  
**Cons:** Lint debt acumulado, no recommended

### Opción 3: Manual Deploy con Railway CLI
```bash
cd /root/clawd/decomer
railway up
```

**Pros:** Bypasses CI  
**Cons:** No resuelve el problema para futuros PRs

---

## 📊 Criterios de Aceptación (DECOMER-6)

- [x] Catálogo con macros/calorías
- [x] Filtros: veggie, sin gluten, low carb, proteico
- [x] Ingredientes tracking
- [x] API endpoints con filtros
- [x] Weekly menu endpoint
- [ ] **Migración aplicada en producción** (⏳ bloqueado por CI)

---

## 🎯 Siguiente Paso

**Decisión requerida de Docta:**
1. ¿Fixeo los 62 lint errors del proyecto? (opción 1)
2. ¿Deshabilitamos lint check temporalmente? (opción 2)
3. ¿Deploy manual con `railway up`? (opción 3)

**Recomendación:** Opción 1 (fix lint global) — resuelve permanentemente y deja el proyecto en mejor estado.

---

**Forge 🔧**  
*At your service.*
