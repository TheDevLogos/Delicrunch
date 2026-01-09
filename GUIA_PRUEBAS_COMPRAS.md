# 🧪 GUÍA DE PRUEBAS - SISTEMA DE COMPRAS

Esta guía te ayudará a probar todo el flujo de compra paso a paso para verificar que funciona correctamente.

---

## 📱 PRUEBAS EN LA APP (Frontend)

### 1. Como Comprador - Hacer una Compra

#### Paso 1: Buscar y seleccionar producto
1. Abrir la app como comprador
2. Ir a la pantalla principal (BrowseScreen o HomeScreen)
3. Seleccionar un pack disponible
4. Ver `ProductDetailScreen`
   - ✅ Verificar que muestra stock disponible
   - ✅ Verificar precio original y precio con descuento

#### Paso 2: Confirmar compra
1. Presionar "Apartar este pack" o "Comprar"
2. Navega a `PaymentScreen`
   - ✅ Verificar resumen del pedido
   - ✅ Verificar horario de recogida
   - ✅ Verificar dirección del comercio
   - ✅ Verificar que muestra distribución (75% comercio, 25% plataforma)
3. Confirmar pago (usar tarjeta demo en Expo Go)

#### Paso 3: Ver confirmación
1. Navega a `OrderConfirmationScreen`
   - ✅ Verificar que aparece código de recogida (ej: AB-123)
   - ✅ Verificar que muestra información del comercio
   - ✅ Verificar horario de recogida
   - ✅ Verificar que muestra ahorro generado
   - ✅ Verificar que muestra CO2 ahorrado

#### Paso 4: Ver historial
1. Ir a perfil → "Mis pedidos" o `MyOrdersScreen`
   - ✅ Verificar que aparece la nueva orden
   - ✅ Verificar estado: "Confirmado"
   - ✅ Verificar código de recogida visible

---

### 2. Como Comercio - Gestionar Pedidos

#### Paso 1: Ver pedidos recibidos
1. Abrir la app como comercio
2. Ir a `MerchantOrdersScreen` (Pedidos o Dashboard)
   - ✅ Verificar que aparece la orden del paso anterior
   - ✅ Verificar que muestra:
     - Código de recogida
     - Nombre del comprador
     - Nombre del producto
     - Cantidad
     - Estado: "Confirmado"

#### Paso 2: Marcar como listo
1. Presionar botón "Listo para recoger"
   - ✅ Debe aparecer confirmación
   - ✅ El estado debe cambiar a "Listo"
   - ✅ Debe cambiar el botón a "Marcar entregado"

#### Paso 3: Marcar como entregado
1. Cuando el cliente llega a recoger
2. Verificar código de recogida del cliente
3. Presionar botón "Marcar entregado"
   - ✅ Debe aparecer confirmación
   - ✅ El estado debe cambiar a "Entregado"
   - ✅ Los botones de acción deben desaparecer

#### Paso 4: Ver métricas del comercio
1. Ir a Dashboard o Métricas del comercio
2. Debería ver (si hay endpoint en frontend):
   - Total de ventas
   - Comisiones pagadas (25%)
   - Ingresos netos (75%)
   - Número de órdenes

---

## 🔧 PRUEBAS CON API (Backend)

### Preparación:
```bash
# Asegurarse de que el backend está corriendo
cd /workspaces/Delicrunch/Backend
node server.js

# En otra terminal, preparar variables
export API_URL="http://localhost:5000/api"
export ADMIN_TOKEN="tu_token_admin"
export COMERCIO_TOKEN="tu_token_comercio"
export COMPRADOR_TOKEN="tu_token_comprador"
```

---

### 1. Prueba: Crear Orden

```bash
# POST /api/orders
curl -X POST $API_URL/orders \
  -H "Authorization: Bearer $COMPRADOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "cantidad": 1,
    "stripePaymentIntentId": "pi_demo_123"
  }'
```

**Respuesta esperada:**
```json
{
  "id": 123,
  "codigo_recogida": "AB-123",
  "subtotal": 50.00,
  "comision_plataforma": 12.50,
  "total": 50.00,
  "estado": "confirmado",
  "nombre_comercio": "Delicias Mexicanas",
  "nombre_producto": "Pack Sorpresa",
  ...
}
```

**Verificaciones:**
- ✅ `codigo_recogida` es único y tiene formato correcto
- ✅ `comision_plataforma` es 25% del `total`
- ✅ `estado` es "confirmado"
- ✅ Stock del producto se redujo en 1

---

### 2. Prueba: Ver Órdenes del Comercio

```bash
# GET /api/orders/mystoreorders
curl -X GET $API_URL/orders/mystoreorders \
  -H "Authorization: Bearer $COMERCIO_TOKEN"
```

**Respuesta esperada:**
```json
[
  {
    "id": 123,
    "codigo_recogida": "AB-123",
    "estado": "confirmado",
    "nombre_comprador": "Juan Pérez",
    "email_comprador": "juan@example.com",
    "nombre_producto": "Pack Sorpresa",
    "cantidad": 1,
    "precio_unitario": 50.00,
    "total": 50.00,
    "comision_plataforma": 12.50,
    ...
  }
]
```

**Verificaciones:**
- ✅ Incluye información del comprador
- ✅ Incluye información del producto desde `order_items`
- ✅ Incluye `cantidad` correcta
- ✅ Ordenado por fecha descendente

---

### 3. Prueba: Actualizar Estado a "Listo"

```bash
# PATCH /api/orders/123
curl -X PATCH $API_URL/orders/123 \
  -H "Authorization: Bearer $COMERCIO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "listo"
  }'
```

**Respuesta esperada:**
```json
{
  "msg": "Estado actualizado exitosamente",
  "order": {
    "id": 123,
    "estado": "listo",
    ...
  }
}
```

**Verificaciones:**
- ✅ Estado cambió a "listo"
- ✅ `updated_at` se actualizó

---

### 4. Prueba: Marcar como Recogido

```bash
# PATCH /api/orders/123
curl -X PATCH $API_URL/orders/123 \
  -H "Authorization: Bearer $COMERCIO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "recogido"
  }'
```

**Respuesta esperada:**
```json
{
  "msg": "Estado actualizado exitosamente",
  "order": {
    "id": 123,
    "estado": "recogido",
    "fecha_recogida_real": "2026-01-03T19:00:00.000Z",
    ...
  }
}
```

**Verificaciones:**
- ✅ Estado cambió a "recogido"
- ✅ `fecha_recogida_real` se registró
- ✅ Se actualizó `financial_metrics` (verificar en BD)
- ✅ Se actualizó `admin_metrics` (verificar en BD)

---

### 5. Prueba: Métricas del Comercio

```bash
# GET /api/orders/store-metrics?days=30
curl -X GET "$API_URL/orders/store-metrics?days=30" \
  -H "Authorization: Bearer $COMERCIO_TOKEN"
```

**Respuesta esperada:**
```json
{
  "general": {
    "total_ordenes": 10,
    "ordenes_completadas": 8,
    "ordenes_canceladas": 1,
    "ordenes_pendientes": 1,
    "ventas_totales": 500.00,
    "comisiones_totales": 125.00,
    "ingresos_netos": 375.00
  },
  "daily": [
    {
      "fecha": "2026-01-03",
      "ordenes": 2,
      "ventas": 100.00,
      "ingresos": 75.00
    },
    ...
  ],
  "topProducts": [
    {
      "id": 1,
      "nombre": "Pack Sorpresa",
      "veces_vendido": 5,
      "unidades_vendidas": 8,
      "ingresos_totales": 400.00
    },
    ...
  ]
}
```

**Verificaciones:**
- ✅ `ingresos_netos` = `ventas_totales` - `comisiones_totales`
- ✅ `comisiones_totales` = 25% de `ventas_totales`
- ✅ `daily` está ordenado por fecha
- ✅ `topProducts` incluye productos más vendidos

---

### 6. Prueba: Métricas del Admin (Overview)

```bash
# GET /admin/metrics/overview
curl -X GET $API_URL/../admin/metrics/overview \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Respuesta esperada:**
```json
{
  "users": [
    { "rol": "comprador", "count": 50 },
    { "rol": "comercio", "count": 10 },
    { "rol": "admin", "count": 1 }
  ],
  "stores": {
    "total": 10,
    "active": 8
  },
  "products": {
    "total": 50,
    "available": 35
  },
  "orders": {
    "total": 100,
    "completadas": 85,
    "canceladas": 5,
    "revenue_total": 5000.00,
    "avg_value": 50.00,
    "comision_total": 1250.00
  },
  "financials_last_30_days": {
    "ventas_totales": 4500.00,
    "comisiones_totales": 1125.00,
    "ordenes_totales": 90
  }
}
```

**Verificaciones:**
- ✅ `orders.comision_total` existe
- ✅ `comision_total` ≈ 25% de `revenue_total`
- ✅ `financials_last_30_days` incluye datos agregados

---

### 7. Prueba: Métricas Financieras Detalladas (Admin)

```bash
# GET /admin/metrics/financial
curl -X GET "$API_URL/../admin/metrics/financial?startDate=2026-01-01&endDate=2026-01-31&groupBy=day" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Respuesta esperada:**
```json
{
  "summary": {
    "total_ordenes": 100,
    "ordenes_completadas": 85,
    "ordenes_canceladas": 5,
    "ventas_totales": 5000.00,
    "comisiones_totales": 1250.00,
    "pagos_a_comercios": 3750.00
  },
  "byStore": [
    {
      "store_id": 1,
      "nombre_comercio": "Delicias Mexicanas",
      "total_ordenes": 20,
      "ordenes_completadas": 18,
      "ventas_totales": 1000.00,
      "comisiones_generadas": 250.00,
      "pago_al_comercio": 750.00
    },
    ...
  ],
  "byDate": [
    {
      "periodo": "2026-01-03",
      "total_ordenes": 10,
      "ordenes_completadas": 8,
      "ventas": 500.00,
      "comisiones": 125.00
    },
    ...
  ]
}
```

**Verificaciones:**
- ✅ `comisiones_totales` = 25% de `ventas_totales`
- ✅ `pagos_a_comercios` = `ventas_totales` - `comisiones_totales`
- ✅ `byStore` ordenado por `comisiones_generadas` DESC
- ✅ `byDate` ordenado por período ASC
- ✅ Suma de `byStore.comisiones_generadas` ≈ `summary.comisiones_totales`

---

## 🗄️ PRUEBAS EN LA BASE DE DATOS

### 1. Verificar que las tablas existen:

```sql
-- Conectarse a la base de datos
-- Desde Node.js ya funcionó, pero si quieres ver directamente:

-- Ver tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('financial_metrics', 'admin_metrics', 'orders', 'order_items');

-- Debería mostrar las 4 tablas
```

### 2. Verificar estructura de orders:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('codigo_recogida', 'subtotal', 'comision_plataforma', 
                       'fecha_recogida_programada', 'fecha_recogida_real', 'estado');

-- Debería mostrar las 6 columnas
```

### 3. Verificar datos en financial_metrics:

```sql
SELECT 
  s.nombre_comercio,
  fm.fecha,
  fm.total_ventas,
  fm.comision_plataforma,
  fm.ingreso_comercio,
  fm.ordenes_completadas
FROM financial_metrics fm
JOIN stores s ON s.id = fm.store_id
ORDER BY fm.fecha DESC
LIMIT 10;

-- Debería mostrar registros con distribución 75/25 correcta
```

### 4. Verificar la distribución 75/25:

```sql
SELECT 
  total,
  comision_plataforma,
  (comision_plataforma / total * 100) as porcentaje_comision,
  (total - comision_plataforma) as ingreso_comercio
FROM orders
WHERE estado = 'recogido' AND total > 0
LIMIT 5;

-- porcentaje_comision debería ser ≈ 25%
-- ingreso_comercio debería ser ≈ 75% del total
```

---

## ✅ CHECKLIST FINAL

Marcar cada ítem al probarlo:

### Flujo de Compra:
- [ ] Comprador puede ver productos disponibles
- [ ] Comprador puede apartar pack
- [ ] Se genera código de recogida único
- [ ] Stock se reduce correctamente
- [ ] Orden se crea con estado "confirmado"
- [ ] Comisión calculada correctamente (25%)
- [ ] Comprador ve confirmación con código

### Gestión del Comercio:
- [ ] Comercio ve la orden en su lista
- [ ] Comercio puede marcar como "listo"
- [ ] Comercio puede marcar como "recogido"
- [ ] Se registra fecha de recogida real
- [ ] Métricas del comercio se actualizan

### Métricas:
- [ ] financial_metrics se actualiza al completar orden
- [ ] admin_metrics se actualiza al completar orden
- [ ] Métricas del comercio muestran datos correctos
- [ ] Métricas del admin muestran distribución 75/25
- [ ] Endpoint /admin/metrics/financial funciona

### Seguridad:
- [ ] Solo comercio dueño puede actualizar sus órdenes
- [ ] Admin puede actualizar cualquier orden
- [ ] Comprador solo ve sus propias órdenes
- [ ] Transacciones son atómicas (todo o nada)

---

## 🎉 RESULTADO ESPERADO

Si todas las pruebas pasan:
- ✅ El sistema está funcionando correctamente
- ✅ No hay errores en el flujo de compra
- ✅ La distribución 75/25 es correcta
- ✅ Las métricas se actualizan automáticamente
- ✅ El inventario se gestiona correctamente
- ✅ Todo listo para producción

---

## 📞 TROUBLESHOOTING

### Problema: "Error al crear orden"
- Verificar que el producto existe y tiene stock
- Verificar que el usuario está autenticado
- Revisar logs del backend

### Problema: "No puedo actualizar estado"
- Verificar que eres el comercio dueño de esa orden
- Verificar que el estado es válido
- Verificar que la ruta PATCH existe

### Problema: "Métricas no se actualizan"
- Verificar que la orden está en estado "recogido"
- Revisar que las tablas financial_metrics y admin_metrics existen
- Ejecutar: `node Backend/db/migrate-metrics.js`

### Problema: "Comisión incorrecta"
- Debería ser siempre 25% del total
- Verificar campo `comision_plataforma` en stores (default: 25.00)
- Revisar cálculo en `calculatePlatformFee`

---

**✨ ¡Listo para probar! Si todas las pruebas pasan, el sistema está perfecto.**
