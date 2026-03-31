# 🔄 Guía de Migración SQL - Supabase

## 📋 Descripción General

Esta migración asegura que todas las tablas en Supabase tienen las columnas correctas en español y las relaciones apropiadas para el sistema de pagos con MercadoPago.

## ⚠️ PRE-REQUISITOS

- **Acceso a Supabase Dashboard**: https://app.supabase.com
- **Proyecto Delicrunch**: Asegúrate de estar en el proyecto correcto
- **Backup**: Recomendado hacer backup antes de aplicar

## 📝 PASOS PARA APLICAR LA MIGRACIÓN

### Paso 1: Acceder a Supabase SQL Editor

1. Ve a https://app.supabase.com
2. Selecciona el proyecto **Delicrunch**
3. En el menú lateral, haz clic en **"SQL Editor"**
4. Haz clic en **"New Query"**

### Paso 2: Copiar el SQL de Migración

1. Abre el archivo: `/workspaces/Delicrunch/Backend/db/migrations/supabase-complete-migration.sql`
2. Copia **TODO** el contenido del archivo
3. Pégalo en el editor SQL de Supabase

### Paso 3: Ejecutar la Migración

1. Haz clic en el botón **"Run"** o presiona `Ctrl + Enter`
2. Espera a que se ejecute (puede tardar 10-30 segundos)
3. Revisa la salida para confirmar éxito

### Paso 4: Verificar Resultado

Deberías ver al final:
```
status: "Migración completada exitosamente"
```

Y una tabla con el resumen de todas las tablas y sus columnas.

## ✅ VERIFICACIÓN POST-MIGRACIÓN

### Opción 1: Usar Script de Verificación

```bash
cd /workspaces/Delicrunch/Backend
node verify-migration.js
```

### Opción 2: Verificación Manual en Supabase

Ejecuta estas queries en el SQL Editor:

#### 1. Verificar tabla `orders`
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;
```

**Columnas esperadas:**
- `codigo_recogida` (VARCHAR)
- `mercadopago_preference_id` (VARCHAR)
- `mercadopago_payment_id` (VARCHAR)
- `estado` (VARCHAR)
- `metodo_pago` (VARCHAR)
- `comision_plataforma` (NUMERIC)
- `store_id` (BIGINT)
- `user_id` (INTEGER)

#### 2. Verificar tabla `products`
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('nombre', 'precio_descuento', 'cantidad_disponible', 'store_id')
ORDER BY column_name;
```

**Columnas esperadas:**
- `nombre` (VARCHAR)
- `precio_descuento` (NUMERIC)
- `cantidad_disponible` (INTEGER)
- `store_id` (BIGINT)

#### 3. Verificar tabla `stores`
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND column_name LIKE '%mercadopago%'
ORDER BY column_name;
```

**Columnas esperadas:**
- `mercadopago_user_id` (VARCHAR)
- `mercadopago_public_key` (TEXT)
- `mercadopago_access_token` (TEXT)
- `mercadopago_onboarding_complete` (BOOLEAN)

#### 4. Verificar tabla `payment_preferences`
```sql
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'payment_preferences'
) AS tabla_existe;
```

**Resultado esperado:** `true`

#### 5. Verificar Foreign Keys
```sql
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('orders', 'products', 'order_items', 'reviews')
ORDER BY tc.table_name, kcu.column_name;
```

**Relaciones esperadas:**
- `orders.store_id` → `stores.id`
- `orders.user_id` → `users.id`
- `products.store_id` → `stores.id`
- `order_items.order_id` → `orders.id`
- `order_items.product_id` → `products.id`

## 🔍 ÍNDICES CREADOS

La migración crea los siguientes índices para mejorar el rendimiento:

### Orders
- `idx_orders_user_id`
- `idx_orders_store_id`
- `idx_orders_estado`
- `idx_orders_created_at`
- `idx_orders_mp_preference`
- `idx_orders_mp_payment`
- `idx_orders_codigo_recogida` (UNIQUE)

### Products
- `idx_products_store_id`
- `idx_products_activo`
- `idx_products_categoria`
- `idx_products_destacado`

### Stores
- `idx_stores_user_id`
- `idx_stores_activo`

### Order Items
- `idx_order_items_order_id`
- `idx_order_items_product_id`

### Payment Preferences
- `idx_payment_preferences_user`
- `idx_payment_preferences_product`
- `idx_payment_preferences_store`
- `idx_payment_preferences_status`

## ⚙️ QUÉ HACE ESTA MIGRACIÓN

### 1. ✅ Asegura columnas en español
- `nombre` en lugar de `name`
- `precio_descuento` en lugar de `price`
- `cantidad_disponible` en lugar de `stock`
- `codigo_recogida` en lugar de `order_number`
- `estado` en lugar de `status`

### 2. ✅ Agrega columnas de MercadoPago
- `orders.mercadopago_preference_id`
- `orders.mercadopago_payment_id`
- `stores.mercadopago_user_id`
- `stores.mercadopago_public_key`
- `stores.mercadopago_access_token`
- `stores.mercadopago_onboarding_complete`

### 3. ✅ Crea tabla payment_preferences
- Registro de todas las preferencias de pago creadas
- Vinculación con users, products y stores
- Tracking de montos y comisiones

### 4. ✅ Asegura Foreign Keys correctas
- `products.store_id` → `stores.id`
- `orders.store_id` → `stores.id`
- `orders.user_id` → `users.id`

### 5. ✅ Crea índices de rendimiento
- Optimiza queries de órdenes por usuario
- Optimiza búsqueda de productos por tienda
- Mejora filtrado por estado

## 🚨 TROUBLESHOOTING

### Error: "column already exists"
**Causa:** La columna ya existe en la BD.  
**Solución:** La migración usa `IF NOT EXISTS`, así que esto no debería ocurrir. Si ocurre, es seguro continuar.

### Error: "foreign key constraint violation"
**Causa:** Hay datos huérfanos (productos sin store_id válido).  
**Solución:** Ejecuta primero:
```sql
-- Encontrar productos sin tienda válida
SELECT id, nombre FROM products 
WHERE store_id IS NULL OR store_id NOT IN (SELECT id FROM stores);

-- Opción 1: Asignarles una tienda por defecto
UPDATE products SET store_id = 1 WHERE store_id IS NULL;

-- Opción 2: Eliminarlos (si son datos de prueba)
DELETE FROM products WHERE store_id IS NULL;
```

### Error: "permission denied"
**Causa:** No tienes permisos de admin en Supabase.  
**Solución:** Asegúrate de estar logueado con la cuenta correcta que tiene acceso al proyecto.

## 📊 DESPUÉS DE LA MIGRACIÓN

### 1. Actualizar Backend en Render
```bash
# Desde tu workspace
cd /workspaces/Delicrunch/Backend
git add .
git commit -m "feat: actualizar queries a columnas en español"
git push origin main
```

Render detectará el push y desplegará automáticamente.

### 2. Probar Endpoints

```bash
# Probar health check
curl https://delicrunch.onrender.com/api/health

# Probar creación de payment preference (con token válido)
curl -X POST https://delicrunch.onrender.com/api/payments/create-preference \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "productId": 1,
    "quantity": 1
  }'
```

### 3. Verificar Logs en Render
1. Ve a https://dashboard.render.com
2. Selecciona el servicio **delicrunch**
3. Haz clic en **"Logs"**
4. Busca errores relacionados con SQL

## 💾 ROLLBACK (Si algo sale mal)

Si necesitas revertir la migración:

```sql
-- ADVERTENCIA: Esto eliminará las columnas agregadas

-- Eliminar columnas de MercadoPago en orders
ALTER TABLE orders DROP COLUMN IF EXISTS mercadopago_preference_id;
ALTER TABLE orders DROP COLUMN IF EXISTS mercadopago_payment_id;

-- Eliminar columnas de MercadoPago en stores
ALTER TABLE stores DROP COLUMN IF EXISTS mercadopago_user_id;
ALTER TABLE stores DROP COLUMN IF EXISTS mercadopago_public_key;
ALTER TABLE stores DROP COLUMN IF EXISTS mercadopago_access_token;
ALTER TABLE stores DROP COLUMN IF EXISTS mercadopago_onboarding_complete;

-- Eliminar tabla payment_preferences
DROP TABLE IF EXISTS payment_preferences CASCADE;
```

## 📞 SOPORTE

Si encuentras problemas:
1. Revisa los logs de Render
2. Ejecuta el script de verificación
3. Revisa las queries en los controllers

## ✅ CHECKLIST DE VALIDACIÓN

- [ ] Migración ejecutada sin errores en Supabase
- [ ] Todas las tablas tienen columnas en español
- [ ] Foreign Keys creadas correctamente
- [ ] Índices creados correctamente
- [ ] Tabla `payment_preferences` existe
- [ ] Backend actualizado en Render
- [ ] Endpoint `/api/health` responde
- [ ] Endpoint `/api/payments/create-preference` funciona
- [ ] No hay errores en logs de Render

---

**Última actualización:** 2026-02-07  
**Versión:** 1.0.0
