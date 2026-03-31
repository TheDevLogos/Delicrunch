# 🔄 Cambios en Migración SQL - Compatible con tu Estructura

## Fecha: 9 de Febrero 2026
## Versión: 3.0

---

## ✅ CAMBIOS REALIZADOS (Compatible con tu migración actual)

### 1. **Eliminadas referencias a Stripe**
- ❌ Removido: `stripe_account_id`, `stripe_customer_id`, `stripe_payment_intent_id`, `stripe_transfer_id`
- ✅ Mantenido: Solo columnas de **MercadoPago**

### 2. **Idioma 100% en Español**
- ❌ Removido: valores mixtos en CHECK (`'buyer'`, `'seller'`, `'comprador'`)
- ✅ Ahora solo: `'cliente'`, `'comercio'`, `'admin'`
- ✅ Columnas en español: `cantidad`, `precio_unitario`, `codigo_recogida`, `rol`, `nombre`

### 3. **Estructura de Verificación Compatible**
- ✅ Usa `IF NOT EXISTS` en lugar de `ADD COLUMN IF NOT EXISTS`
- ✅ Bloques `DO $$ BEGIN ... END $$` como en tu migración
- ✅ Verificación de constraints antes de crear FKs

### 4. **Índice UNIQUE en codigo_recogida**
- ✅ Cambiado de índice normal a **UNIQUE INDEX**
- ✅ Con condición `WHERE codigo_recogida IS NOT NULL AND codigo_recogida != ''`
- ✅ Igual que en tu migración original

### 5. **Columnas de Reviews con Imágenes (NUEVA FUNCIONALIDAD)**
- ✅ `images JSONB DEFAULT '[]'` - Array de imágenes
- ✅ `calidad_comida`, `valor_precio`, `experiencia_recogida` - Calificaciones detalladas
- ✅ `is_verified BOOLEAN` - Reseñas verificadas
- ✅ `rating` y `comment` - Alias para compatibilidad con frontend

---

## 📋 TABLAS VERIFICADAS Y COMPATIBLES

### 1. **USERS**
```sql
✅ nombre VARCHAR(255)
✅ email VARCHAR(255) UNIQUE
✅ rol VARCHAR(50) DEFAULT 'cliente'
✅ password_hash VARCHAR(255)
```

### 2. **STORES**
```sql
✅ mercadopago_user_id VARCHAR(255)
✅ mercadopago_public_key TEXT
✅ mercadopago_access_token TEXT
✅ mercadopago_onboarding_complete BOOLEAN
✅ comision_plataforma NUMERIC(5,2) DEFAULT 25.00
```

### 3. **ORDERS**
```sql
✅ codigo_recogida VARCHAR(10)
✅ mercadopago_preference_id VARCHAR(255)
✅ mercadopago_payment_id VARCHAR(255)
✅ comision_plataforma DECIMAL(10,2) DEFAULT 0.00
✅ estado VARCHAR(50) DEFAULT 'pendiente'
```

### 4. **ORDER_ITEMS**
```sql
✅ cantidad INTEGER NOT NULL DEFAULT 1
✅ precio_unitario NUMERIC(10,2) NOT NULL
✅ subtotal DECIMAL(10,2) NOT NULL
```

### 5. **PRODUCTS**
```sql
✅ store_id BIGINT REFERENCES stores(id)
✅ rating DECIMAL(3,2) DEFAULT 0.00
✅ reviews_count INTEGER DEFAULT 0
✅ activo BOOLEAN DEFAULT TRUE
✅ destacado BOOLEAN DEFAULT FALSE
✅ producto_listo BOOLEAN DEFAULT FALSE
```

### 6. **REVIEWS (CON IMÁGENES)**
```sql
✅ images JSONB DEFAULT '[]'  -- NUEVA
✅ calidad_comida INTEGER      -- NUEVA
✅ valor_precio INTEGER        -- NUEVA
✅ experiencia_recogida INTEGER -- NUEVA
✅ is_verified BOOLEAN         -- NUEVA
✅ rating INTEGER (alias)      -- NUEVA
✅ comment TEXT (alias)        -- NUEVA
✅ product_id BIGINT           -- NUEVA
```

### 7. **PROFILES**
```sql
✅ total_xp INTEGER DEFAULT 0
✅ total_packs_saved INTEGER DEFAULT 0
✅ unlocked_badges JSONB DEFAULT '[]'
✅ mercadopago_customer_id VARCHAR(255)
```

---

## 🆕 TABLAS ADICIONALES (Opcionales - Ya en tu migración anterior)

### 8. **FAVORITES**
```sql
- id, user_id, store_id
- UNIQUE(user_id, store_id)
```

### 9. **NOTIFICATIONS**
```sql
- id, user_id, tipo, titulo, mensaje
- leido BOOLEAN DEFAULT FALSE
```

### 10. **PAYMENT_PREFERENCES**
```sql
- mercadopago_preference_id VARCHAR(255) UNIQUE
- amount, currency, platform_fee_amount
- status VARCHAR(50) DEFAULT 'pending'
```

### 11. **SAVED_CARDS**
```sql
- mercadopago_card_id, brand, last4
- exp_month, exp_year
- is_default BOOLEAN
```

---

## 🔍 DIFERENCIAS CLAVE con tu Migración Original

| Aspecto | Tu Migración Original | Nueva Versión Compatible |
|---------|----------------------|---------------------------|
| **Enfoque** | Solo agregar columnas faltantes | Crear tablas + agregar columnas |
| **Stripe** | ❌ No menciona | ❌ Eliminado completamente |
| **reviews.images** | ❌ No incluye | ✅ Incluido con soporte completo |
| **codigo_recogida** | ✅ UNIQUE INDEX | ✅ UNIQUE INDEX (compatible) |
| **Idioma** | ✅ 100% español | ✅ 100% español |
| **BEGIN/COMMIT** | ❌ No usa transacción | ❌ No usa transacción |
| **Tablas nuevas** | Solo actualiza existentes | Crea: favorites, notifications, saved_cards, payment_preferences |

---

## 📦 NUEVAS FUNCIONALIDADES AGREGADAS

### 1. **Sistema de Imágenes en Reviews**
```sql
-- Permite hasta 3 imágenes por reseña
images JSONB DEFAULT '[]'
-- Estructura: [{url: string, filename: string, size: number, mimetype: string}]
```

### 2. **Calificaciones Detalladas**
```sql
calidad_comida INTEGER (1-5)
valor_precio INTEGER (1-5)
experiencia_recogida INTEGER (1-5)
```

### 3. **Verificación de Compras**
```sql
is_verified BOOLEAN DEFAULT FALSE
-- Se marca como TRUE si la reseña proviene de una compra verificada
```

---

## ⚠️ NOTAS IMPORTANTES

### ✅ **SEGURO EJECUTAR**
- Este script NO borrará datos existentes
- Solo **AGREGA** columnas que faltan
- Usa `IF NOT EXISTS` para evitar duplicados
- Compatible con tu estructura actual en español

### 🔄 **IDEMPOTENCIA**
- Puedes ejecutarlo múltiples veces sin errores
- No creará columnas duplicadas
- No afectará datos existentes

### 📝 **COMPATIBILIDAD**
- ✅ Compatible con MercadoPago Checkout Pro
- ✅ Compatible con tu backend actual (express + pg)
- ✅ Compatible con tu frontend (React Native + Expo)
- ✅ Mantiene todas tus columnas existentes

---

## 🚀 PRÓXIMOS PASOS

1. **Revisar el script actualizado:**
   ```bash
   cat supabase_migration_complete.sql
   ```

2. **Ejecutar en Supabase:**
   - Ir a Dashboard → SQL Editor
   - Copiar contenido de `supabase_migration_complete.sql`
   - Ejecutar script completo

3. **Verificar resultado:**
   - Revisar tablas creadas/actualizadas
   - Verificar que columnas en español están presentes
   - Confirmar índices creados

4. **Continuar con deployment:**
   - Seguir pasos en `DEPLOYMENT_GUIDE_SUPABASE_RENDER.md`

---

## 📄 RESUMEN DE ARCHIVOS

1. **supabase_migration_complete.sql** ← Script SQL actualizado (compatible)
2. **CAMBIOS_MIGRACION_ACTUALIZADA.md** ← Este documento
3. **DEPLOYMENT_GUIDE_SUPABASE_RENDER.md** ← Guía de deployment
4. **verify-deployment-ready.sh** ← Verificación automática

---

## ✨ TODO LISTO PARA PRODUCCIÓN

✅ Estructura en español verificada
✅ Sin referencias a Stripe
✅ Compatible con tu migración actual
✅ Sistema de imágenes en reviews implementado
✅ Idempotente y seguro de ejecutar
✅ Documentación completa

---

**¡Tu migración está lista para ejecutarse en Supabase sin afectar tu estructura actual!** 🎉
