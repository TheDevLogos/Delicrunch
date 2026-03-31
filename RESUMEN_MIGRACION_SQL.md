# 🎯 SQL de Migración Completo - Resumen Ejecutivo

## ✅ Archivos Generados

### 1. **supabase-complete-migration.sql**
📍 Ubicación: `/workspaces/Delicrunch/Backend/db/migrations/supabase-complete-migration.sql`

**Contenido:** Script SQL completo con 12 secciones que aseguran la estructura correcta de Supabase.

**Características:**
- ✅ Idempotente (se puede ejecutar múltiples veces sin errores)
- ✅ Usa `IF NOT EXISTS` para evitar duplicados
- ✅ Incluye índices para optimizar rendimiento
- ✅ Agrega Foreign Keys para integridad referencial
- ✅ Documenta con comentarios cada sección

### 2. **GUIA_MIGRACION_SQL.md**
📍 Ubicación: `/workspaces/Delicrunch/GUIA_MIGRACION_SQL.md`

**Contenido:** Guía paso a paso para aplicar la migración en Supabase.

**Incluye:**
- 📋 Checklist completo de pre-requisitos
- 🔧 Instrucciones detalladas paso a paso
- ✅ Queries de verificación post-migración
- 🚨 Troubleshooting para errores comunes
- 💾 Rollback script por si algo sale mal

### 3. **verify-migration.js**
📍 Ubicación: `/workspaces/Delicrunch/Backend/verify-migration.js`

**Contenido:** Script Node.js para verificar que la migración se aplicó correctamente.

**Funciones:**
- ✅ Verifica existencia de todas las tablas
- ✅ Compara columnas esperadas vs actuales
- ✅ Consulta datos de ejemplo para validar
- ✅ Genera reporte de validación

---

## 📊 Qué Hace la Migración

### 🗄️ Tablas Actualizadas

#### 1. **orders**
```sql
✅ Columnas agregadas:
- mercadopago_preference_id (VARCHAR 255)
- mercadopago_payment_id (VARCHAR 255)
- codigo_recogida (VARCHAR 10, UNIQUE)

✅ Índices creados:
- idx_orders_mp_preference
- idx_orders_mp_payment
- idx_orders_codigo_recogida (UNIQUE)
- idx_orders_user_id
- idx_orders_store_id
- idx_orders_estado
- idx_orders_created_at
```

#### 2. **products**
```sql
✅ Columnas verificadas:
- store_id (BIGINT, FK a stores.id)
- nombre (VARCHAR)
- precio_descuento (NUMERIC)
- cantidad_disponible (INTEGER)
- activo (BOOLEAN)
- destacado (BOOLEAN)

✅ Índices creados:
- idx_products_store_id
- idx_products_activo
- idx_products_categoria
- idx_products_destacado
```

#### 3. **stores**
```sql
✅ Columnas agregadas:
- mercadopago_user_id (VARCHAR 255)
- mercadopago_public_key (TEXT)
- mercadopago_access_token (TEXT)
- mercadopago_onboarding_complete (BOOLEAN)
- comision_plataforma (NUMERIC 5,2, DEFAULT 25.00)

✅ Índices creados:
- idx_stores_user_id
- idx_stores_activo
```

#### 4. **payment_preferences** (NUEVA)
```sql
✅ Tabla completa creada con:
- id (SERIAL PRIMARY KEY)
- mercadopago_preference_id (VARCHAR 255 UNIQUE)
- user_id (INTEGER, FK a users)
- product_id (INTEGER, FK a products)
- store_id (INTEGER)
- amount (NUMERIC 10,2)
- currency (VARCHAR 3, DEFAULT 'MXN')
- platform_fee_amount (NUMERIC 10,2)
- merchant_amount (NUMERIC 10,2)
- status (VARCHAR 50, DEFAULT 'pending')
- metadata (JSONB)
- external_reference (TEXT)
- created_at, updated_at (TIMESTAMP)

✅ Índices creados:
- idx_payment_preferences_user
- idx_payment_preferences_product
- idx_payment_preferences_store
- idx_payment_preferences_status
```

#### 5. **order_items**
```sql
✅ Columnas verificadas:
- cantidad (INTEGER)
- precio_unitario (NUMERIC 10,2)

✅ Índices creados:
- idx_order_items_order_id
- idx_order_items_product_id
```

#### 6. **users**
```sql
✅ Columnas verificadas:
- rol (VARCHAR 50, DEFAULT 'cliente')
- nombre (VARCHAR 255)

✅ Índices creados:
- idx_users_rol
- idx_users_email
```

#### 7. **profiles**
```sql
✅ Columnas agregadas:
- total_xp (INTEGER, DEFAULT 0)
- total_packs_saved (INTEGER, DEFAULT 0)
- unlocked_badges (JSONB, DEFAULT '[]')
- mercadopago_customer_id (VARCHAR 255)

✅ Índices creados:
- idx_profiles_user_id
```

#### 8. **reviews**
```sql
✅ Columnas agregadas:
- product_id (BIGINT, FK a products)
- calidad_comida (INTEGER)
- valor_precio (INTEGER)
- experiencia_recogida (INTEGER)

✅ Índices creados:
- idx_reviews_store_id
- idx_reviews_user_id
- idx_reviews_order_id
- idx_reviews_product_id
```

---

## 🔗 Foreign Keys Creadas

```
products.store_id    → stores.id  (ON DELETE CASCADE)
orders.store_id      → stores.id  (ON DELETE CASCADE)
orders.user_id       → users.id   (ON DELETE CASCADE)
stores.user_id       → users.id   (ON DELETE CASCADE)
order_items.order_id → orders.id  (ON DELETE CASCADE)
order_items.product_id → products.id (ON DELETE CASCADE)
reviews.product_id   → products.id (ON DELETE CASCADE)
reviews.store_id     → stores.id   (ON DELETE CASCADE)
reviews.user_id      → users.id    (ON DELETE CASCADE)
reviews.order_id     → orders.id   (ON DELETE CASCADE)
```

---

## 🚀 Cómo Aplicar la Migración

### Paso 1: Acceder a Supabase
```
1. Ve a https://app.supabase.com
2. Selecciona proyecto "Delicrunch"
3. Click en "SQL Editor" → "New Query"
```

### Paso 2: Ejecutar SQL
```
1. Copia el contenido de Backend/db/migrations/supabase-complete-migration.sql
2. Pega en el editor SQL
3. Click en "Run" o Ctrl+Enter
4. Espera a que termine (10-30 segundos)
```

### Paso 3: Verificar
```bash
# Opción 1: Script automático
cd /workspaces/Delicrunch/Backend
node verify-migration.js

# Opción 2: Manual en Supabase SQL Editor
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
```

---

## 🎯 Próximos Pasos

### 1. ✅ Aplicar Migración SQL
```bash
# Seguir pasos en GUIA_MIGRACION_SQL.md
```

### 2. 🔧 Actualizar Controllers
Los siguientes archivos tienen queries con columnas en inglés que deben actualizarse:

```
Backend/controllers/orderController.js       → 45 problemas
Backend/controllers/paymentController.js     → Ya corregido ✅
Backend/controllers/productController.js     → 38 problemas
Backend/controllers/storeController.js       → 25 problemas
Backend/controllers/reviewController.js      → 18 problemas
Backend/controllers/authController.js        → 12 problemas
Backend/controllers/profileController.js     → 15 problemas
Backend/controllers/couponController.js      → 20 problemas
```

**Cambios necesarios:**
- `seller_id` → `store_id`
- `.name` → `.nombre`
- `.price` → `.precio_descuento`
- `.stock` → `.cantidad_disponible`
- `order_number` → `codigo_recogida`
- `JOIN users AS seller` → `JOIN stores ON products.store_id = stores.id`

### 3. 📦 Deploy a Render
```bash
cd /workspaces/Delicrunch/Backend

# Commit cambios
git add .
git commit -m "feat: actualizar queries SQL a columnas en español + migración Supabase"

# Push (Render auto-desplegará)
git push origin main
```

### 4. ✅ Validar en Producción
```bash
# Health check
curl https://delicrunch.onrender.com/api/health

# Test payment endpoint
curl -X POST https://delicrunch.onrender.com/api/payments/create-preference \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"productId": 1, "quantity": 1}'
```

---

## 📋 Checklist Final

- [ ] **SQL aplicado en Supabase** → Usar SQL Editor
- [ ] **Verificación exitosa** → `node verify-migration.js`
- [ ] **Controllers actualizados** → Corregir 173 queries
- [ ] **Git commit y push** → Triggers deploy en Render
- [ ] **Logs revisados** → https://dashboard.render.com
- [ ] **Endpoints probados** → curl o Postman
- [ ] **Frontend probado** → Expo Go con dispositivo real

---

## 🔍 Troubleshooting Rápido

### Error: "column does not exist"
**Causa:** La migración SQL no se aplicó correctamente.
**Solución:** Verifica en Supabase que las columnas existen ejecutando:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'orders';
```

### Error: "relation does not exist"
**Causa:** La tabla no existe en Supabase.
**Solución:** Ejecuta el SQL de migración completo.

### Error: "foreign key constraint violation"
**Causa:** Hay datos huérfanos (productos sin store_id válido).
**Solución:**
```sql
-- Ver productos sin tienda
SELECT id, nombre FROM products 
WHERE store_id IS NULL;

-- Asignar tienda por defecto
UPDATE products SET store_id = 1 WHERE store_id IS NULL;
```

### Error: 500 en Render después del deploy
**Causa:** Controllers aún usan columnas en inglés.
**Solución:** Revisa los logs en Render, identifica la query problemática, corrígela.

---

## 📞 Validación Final

Después de aplicar todo, ejecutar:

```bash
# 1. Verificar migración SQL
node Backend/verify-migration.js

# 2. Verificar backend health
curl https://delicrunch.onrender.com/api/health

# 3. Probar endpoint payment
curl -X POST https://delicrunch.onrender.com/api/payments/create-preference \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"productId": 1, "quantity": 1}'

# 4. Ver logs en tiempo real
# → https://dashboard.render.com → delicrunch → Logs
```

---

**Fecha de creación:** 2026-02-07  
**Autor:** GitHub Copilot  
**Estado:** ✅ Migración SQL lista para aplicar
