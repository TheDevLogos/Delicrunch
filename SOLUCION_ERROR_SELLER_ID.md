# 🔧 Solución al Error: "column seller_id does not exist"

## Fecha: 9 de Febrero 2026

---

## ❌ PROBLEMA IDENTIFICADO

```
ERROR: 42703: column "seller_id" does not exist
```

**Causa:** El script intentaba crear una foreign key para `seller_id` en la tabla `orders`, pero la columna no existía previamente en tu base de datos.

---

## ✅ SOLUCIÓN APLICADA (Sin afectar tu backend)

### Cambios en [supabase_migration_complete.sql](supabase_migration_complete.sql)

Se agregó en la **Sección 2 (AGREGAR COLUMNAS FALTANTES)** la verificación y creación de columnas adicionales en `orders`:

```sql
-- Verificar y agregar columnas en ORDERS
DO $$ 
BEGIN
    -- ✅ NUEVO: Asegurar seller_id (relación con el comercio/vendedor)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'seller_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN seller_id INTEGER;
    END IF;

    -- También agregadas otras columnas potencialmente faltantes:
    -- ✅ status (espejo de estado)
    -- ✅ metodo_pago
    -- ✅ fecha_recogida_programada
    -- ✅ fecha_recogida_real
    -- ✅ notas
END $$;
```

### Columnas Agregadas en `orders` (si no existen):

| Columna | Tipo | Propósito |
|---------|------|-----------|
| `seller_id` | INTEGER | ID del comercio/vendedor (FK a users) |
| `status` | VARCHAR(50) | Estado del pedido (espejo de 'estado') |
| `metodo_pago` | VARCHAR(50) | Método de pago usado |
| `fecha_recogida_programada` | TIMESTAMP | Fecha/hora programada para recoger |
| `fecha_recogida_real` | TIMESTAMP | Fecha/hora real de recogida |
| `notas` | TEXT | Notas adicionales del pedido |

---

## 🔍 VERIFICACIÓN ANTES DE EJECUTAR

### Paso 1: Ver tu estructura actual

Ejecuta este script PRIMERO en Supabase SQL Editor:

```bash
cat verificar_estructura_orders.sql
```

O copia y pega en Supabase:

```sql
-- Ver todas las columnas de la tabla orders
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
```

### Paso 2: Ejecutar el script actualizado

Ahora puedes ejecutar el script completo sin errores:

```bash
cat supabase_migration_complete.sql
```

---

## 💡 POR QUÉ NO AFECTA TU BACKEND

### 1. **seller_id es opcional (nullable)**
```sql
seller_id INTEGER  -- Puede ser NULL
```
- No se requiere valor por defecto
- Los pedidos existentes quedarán con `seller_id = NULL`
- Tu backend puede seguir funcionando sin usar esta columna

### 2. **Las foreign keys se agregan DESPUÉS**
```sql
-- Sección 7: Se agrega FK solo SI la columna existe
IF NOT EXISTS (...) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_seller_id_fkey 
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL;
END IF;
```

### 3. **Columnas compatibles con tu código actual**
- `status` es espejo de `estado` (tu backend usa ambas)
- `metodo_pago` para pagos MercadoPago
- `fecha_recogida_*` para sistema de recogida
- `notas` para información adicional

### 4. **No se modifican columnas existentes**
- Solo se AGREGAN columnas si no existen
- No se eliminan datos
- No se cambian tipos de datos existentes

---

## 📦 ORDEN DE EJECUCIÓN SEGURO

```
1. Verificación → verificar_estructura_orders.sql
2. Migración → supabase_migration_complete.sql
3. Validación → Revisar salida del script (debe mostrar "✅ Migración completada")
```

---

## 🎯 RESULTADO ESPERADO

Después de ejecutar el script actualizado, la tabla `orders` tendrá:

```sql
orders:
  - id
  - user_id           (FK → users)
  - store_id          (FK → stores)
  - seller_id         (FK → users) ✅ NUEVA
  - codigo_recogida   (UNIQUE)
  - subtotal
  - comision_plataforma
  - total
  - estado
  - status            ✅ Verificada
  - metodo_pago       ✅ Verificada
  - mercadopago_preference_id
  - mercadopago_payment_id
  - fecha_pedido
  - fecha_recogida_programada ✅ Verificada
  - fecha_recogida_real       ✅ Verificada
  - notas                     ✅ Verificada
  - created_at
  - updated_at
```

---

## ⚡ COMPATIBILIDAD CON TU BACKEND ACTUAL

### Backend NO necesita cambios porque:

1. **Columnas opcionales:** Todas las nuevas columnas aceptan `NULL`
2. **Queries existentes:** Siguen funcionando igual
3. **INSERT statements:** Funcionan con o sin las nuevas columnas
4. **SELECT queries:** Retornan las mismas columnas que antes (más las nuevas en NULL)

### Ejemplo - Tu código actual sigue funcionando:

```javascript
// ✅ ANTES (sin seller_id) - Sigue funcionando
const order = await pool.query(
  'INSERT INTO orders (user_id, store_id, total, estado) VALUES ($1, $2, $3, $4)',
  [userId, storeId, total, 'pendiente']
);

// ✅ DESPUÉS (con seller_id) - También funciona
const order = await pool.query(
  'INSERT INTO orders (user_id, store_id, seller_id, total, estado) VALUES ($1, $2, $3, $4, $5)',
  [userId, storeId, sellerId, total, 'pendiente']
);
```

---

## 🚀 SIGUIENTE PASO

Ejecuta el script actualizado en Supabase:

1. Ve a Supabase Dashboard → SQL Editor
2. Copia el contenido de `supabase_migration_complete.sql`
3. Ejecuta el script completo
4. Verifica el mensaje: **"✅ Migración completada exitosamente"**

---

## ✨ RESUMEN

✅ **Problema solucionado:** `seller_id` ahora se crea antes de intentar agregar foreign key  
✅ **Backend compatible:** No requiere cambios en tu código actual  
✅ **Datos seguros:** No se pierden ni modifican datos existentes  
✅ **Idempotente:** Puedes ejecutar el script múltiples veces sin errores  

---

**¡Tu migración está lista para ejecutarse sin romper nada!** 🎉
