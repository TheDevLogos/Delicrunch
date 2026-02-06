# Integración Completa de Mercado Pago Checkout Pro
## Sistema Delicrunch - Base de Datos y Configuración

---

## 📋 Resumen de la Integración

El sistema Delicrunch está completamente configurado para usar **Mercado Pago Checkout Pro** como método de pago principal, con soporte para:

- ✅ Split de pagos (marketplace)
- ✅ Comisiones de plataforma configurables
- ✅ Tracking completo de pagos
- ✅ Estadísticas y métricas financieras
- ✅ Webhooks para notificaciones
- ✅ Vistas consolidadas para reportes

---

## 🗄️ Estructura de Base de Datos

### 1. Tablas Principales

#### **STORES** - Tiendas/Comercios
```sql
mercadopago_email VARCHAR(255)          -- Email de la cuenta MP del comercio
mercadopago_configured BOOLEAN          -- Si completó configuración
mercadopago_collector_id VARCHAR(255)   -- ID del collector en MP
comision_plataforma DECIMAL(5,2)        -- % comisión (default 25%)
```

#### **ORDERS** - Órdenes/Pedidos
```sql
payment_method VARCHAR(50) DEFAULT 'mercadopago'
payment_status VARCHAR(50) DEFAULT 'pending'
mp_preference_id VARCHAR(255)           -- ID de preferencia MP
mp_payment_id VARCHAR(255)              -- ID del pago en MP
mp_merchant_order_id VARCHAR(255)       -- ID de orden de comercio
mp_external_reference VARCHAR(255)      -- Referencia externa
platform_fee_amount DECIMAL(10,2)       -- Comisión plataforma
merchant_amount DECIMAL(10,2)           -- Monto para comercio
```

#### **PAYMENTS** - Registro de Pagos
```sql
mp_payment_id VARCHAR(255) UNIQUE       -- ID del pago en MP
mp_preference_id VARCHAR(255)           -- ID de preferencia
amount DECIMAL(10,2)                    -- Monto total
status VARCHAR(50)                      -- approved, rejected, pending
payment_type VARCHAR(50)                -- credit_card, debit_card, etc
payment_method_id VARCHAR(50)           -- visa, master, etc
mp_response JSONB                       -- Respuesta completa de MP
webhook_data JSONB                      -- Datos del webhook
```

#### **PAYMENT_PREFERENCES** - Preferencias Creadas
```sql
mercadopago_preference_id VARCHAR(255)  -- ID de preferencia
amount DECIMAL(10,2)                    -- Monto
platform_fee_amount DECIMAL(10,2)       -- Comisión plataforma
merchant_amount DECIMAL(10,2)           -- Monto comercio
status VARCHAR(50)                      -- pending, paid, expired
init_point TEXT                         -- URL de checkout
metadata JSONB                          -- Datos adicionales
```

#### **FINANCIAL_METRICS** - Métricas Financieras
```sql
store_id INTEGER                        -- ID de la tienda
fecha DATE                              -- Fecha de la métrica
total_ventas DECIMAL(10,2)              -- Total vendido
comision_plataforma DECIMAL(10,2)       -- Comisión cobrada
ingreso_comercio DECIMAL(10,2)          -- Ingreso del comercio
mercadopago_fees DECIMAL(10,2)          -- Comisiones de MP
numero_ordenes INTEGER                  -- Número de órdenes
ordenes_completadas INTEGER             -- Órdenes completadas
```

---

## 📊 Vistas para Reportes y Estadísticas

### 1. **payment_details_view**
Vista consolidada de todos los pagos con información completa.

```sql
SELECT * FROM payment_details_view;
```

**Columnas:**
- Información del pago (id, monto, estado)
- Información del usuario (nombre, email)
- Información del comercio (nombre, email MP)
- Cálculos (comisión plataforma, pago a comercio)

### 2. **store_revenue_summary**
Resumen de ingresos y comisiones por tienda.

```sql
SELECT * FROM store_revenue_summary WHERE store_id = 1;
```

**Métricas:**
- Total de órdenes
- Órdenes pagadas
- Ingresos totales
- Comisiones de plataforma
- Pagos a comercio
- Porcentaje promedio de comisión

### 3. **daily_metrics**
Métricas diarias de la plataforma.

```sql
SELECT * FROM daily_metrics 
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
```

**Métricas:**
- Órdenes totales y pagadas
- Clientes únicos
- Tiendas activas
- Ingresos brutos
- Ingresos de plataforma
- Pagos a comercios
- Valor promedio de orden

### 4. **monthly_store_performance**
Rendimiento mensual detallado por tienda.

```sql
SELECT * FROM monthly_store_performance 
WHERE store_id = 1 
ORDER BY month DESC 
LIMIT 12;
```

### 5. **payment_method_statistics**
Estadísticas por método de pago.

```sql
SELECT * FROM payment_method_statistics;
```

---

## 🔄 Flujo de Pago

### 1. **Crear Preferencia de Pago**
```
POST /api/payments/create-preference
Body: {
  productId: 123,
  cantidad: 1,
  coupon_discount: 0
}
```

**Proceso:**
1. Valida producto y disponibilidad
2. Calcula montos (subtotal, comisión, monto comercio)
3. Crea preferencia en Mercado Pago
4. Guarda en `payment_preferences`
5. Devuelve `preferenceId` e `initPoint`

### 2. **Usuario Paga en MP Checkout**
El usuario es redirigido a Mercado Pago donde completa el pago.

### 3. **Webhook Recibe Notificación**
```
POST /api/payments/webhook
```

**Proceso:**
1. Recibe notificación de MP (`type: payment`)
2. Obtiene detalles del pago
3. Crea/actualiza registro en `payments`
4. Actualiza estado de la orden
5. Trigger actualiza `financial_metrics` automáticamente

### 4. **Callback Redirección**
```
GET /api/payments/callback/success
GET /api/payments/callback/failure
GET /api/payments/callback/pending
```

Redirige al usuario a la app con deep link según resultado.

---

## 🎯 Endpoints de la API

### Pagos
- `POST /api/payments/create-preference` - Crear preferencia de pago
- `POST /api/payments/webhook` - Webhook de Mercado Pago
- `GET /api/payments/callback/:status` - Callbacks de redirección
- `GET /api/payments/:paymentId/status` - Estado de un pago

### Configuración de Comercio
- `POST /api/payments/merchant-setup` - Configurar cuenta MP del comercio
- `GET /api/payments/merchant-status` - Estado de configuración MP
- `GET /api/payments/merchant-balance` - Saldo del comercio
- `GET /api/payments/merchant-payouts` - Historial de pagos

---

## 📱 Integración con Pantallas de la App

### 1. **Pantalla de Compra (CheckoutScreen)**
```javascript
// Crear preferencia
const { preferenceId, initPoint } = await api.post('/payments/create-preference', {
  productId,
  cantidad,
  coupon_discount
});

// Abrir Mercado Pago Checkout
await WebBrowser.openBrowserAsync(initPoint);
```

### 2. **Pantalla de Órdenes (OrdersScreen)**
```javascript
// Obtener órdenes con información de pago
const orders = await api.get('/orders/my-orders');
// Incluye: payment_status, mp_payment_id, platform_fee_amount, etc.
```

### 3. **Pantalla de Comercio - Ganancias (StoreEarningsScreen)**
```javascript
// Obtener resumen de ingresos
const revenue = await api.get('/payments/merchant-balance');
// Devuelve: total_revenue, platform_fees, merchant_earnings, etc.

// Obtener métricas diarias
const metrics = await api.get('/stores/metrics/daily');
```

### 4. **Pantalla Admin - Dashboard**
```javascript
// Métricas globales de la plataforma
const platformMetrics = await api.get('/admin/metrics/overview');
// Incluye: total_revenue, platform_revenue, active_stores, etc.

// Métricas por ciudad
const cityMetrics = await api.get('/admin/metrics/by-city');
```

---

## 🔧 Configuración del Backend

### Variables de Entorno (.env)
```env
# Mercado Pago
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxx
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx

# URLs
BACKEND_URL=https://your-backend-url.com
FRONTEND_DEEP_LINK=delicrunch://
```

### Configuración en paymentController.js
```javascript
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    options: { timeout: 5000 }
});
```

---

## 🛠️ Triggers Automáticos

### 1. **update_financial_metrics_after_payment**
Se ejecuta automáticamente cuando un pago es aprobado:
- Actualiza `financial_metrics` para la tienda
- Incrementa contadores de órdenes
- Suma ventas, comisiones e ingresos

---

## 📈 Consultas Útiles para Reportes

### Ingresos del día por tienda
```sql
SELECT * FROM financial_metrics 
WHERE fecha = CURRENT_DATE 
ORDER BY total_ventas DESC;
```

### Top 10 tiendas del mes
```sql
SELECT store_id, nombre_comercio, monthly_revenue
FROM monthly_store_performance
WHERE month = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY monthly_revenue DESC
LIMIT 10;
```

### Tasa de aprobación de pagos
```sql
SELECT 
    COUNT(*) as total_payments,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
    ROUND(100.0 * COUNT(CASE WHEN status = 'approved' THEN 1 END) / COUNT(*), 2) as approval_rate
FROM payments
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
```

### Ingresos de la plataforma por mes
```sql
SELECT 
    DATE_TRUNC('month', date) as month,
    SUM(platform_revenue) as total_platform_revenue,
    SUM(gross_revenue) as total_gross_revenue,
    SUM(paid_orders) as total_orders
FROM daily_metrics
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;
```

---

## ✅ Validación del Sistema

### Verificar tablas creadas
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%payment%' 
OR tablename LIKE '%mercadopago%';
```

### Verificar vistas creadas
```sql
SELECT viewname FROM pg_views 
WHERE schemaname = 'public';
```

### Verificar columnas de Mercado Pago
```sql
-- En stores
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND column_name LIKE '%mercadopago%';

-- En orders
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND (column_name LIKE '%mp_%' OR column_name LIKE '%mercadopago%');
```

---

## 🚀 Próximos Pasos

1. ✅ **Base de datos configurada** - Tablas, vistas y triggers listos
2. ✅ **Backend configurado** - PaymentController implementado
3. 🔄 **Testing necesario**:
   - Probar flujo completo de pago
   - Verificar webhooks
   - Validar cálculos de comisiones
4. 📱 **Integración Frontend**:
   - Implementar botón "Pagar con Mercado Pago"
   - Manejar respuestas de callbacks
   - Mostrar estados de pago correctamente

---

## 📞 Soporte y Documentación

- [Mercado Pago Checkout Pro](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/landing)
- [SDK de Mercado Pago](https://github.com/mercadopago/sdk-nodejs)
- [Webhooks de Mercado Pago](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/additional-content/your-integrations/notifications/webhooks)

---

**Última actualización:** 23 de enero de 2026
**Versión:** 1.0.0
