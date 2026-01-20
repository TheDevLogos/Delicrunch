# 📚 ÍNDICE: Documentación del Sistema de Pagos

## 🎯 OBJETIVO
Documentación completa del sistema de cobro con split automático 75/25 usando Stripe Connect.

---

## 📖 DOCUMENTOS PRINCIPALES

### 1. 📋 [PAYMENT_SPLIT_IMPLEMENTATION_SUMMARY.md](PAYMENT_SPLIT_IMPLEMENTATION_SUMMARY.md)
**Empieza aquí** - Resumen ejecutivo de todo el trabajo

**Contiene:**
- ✅ Trabajo completado (8 mejoras)
- 📊 Comparativa antes/después
- 🎯 Modelo Stripe Connect usado
- 📂 Archivos modificados/creados
- ✅ Checklist final
- 🚀 Próximos pasos

**Audiencia:** PM, Tech Lead, cualquier persona que quiera entender qué se hizo

**Tiempo de lectura:** 10 minutos

---

### 2. 💰 [PAYMENT_SPLIT_ANALYSIS.md](PAYMENT_SPLIT_ANALYSIS.md)
**Análisis técnico detallado**

**Contiene:**
- 📊 Estado actual del sistema (80% implementado)
- ✅ Lo que YA existe y funciona
- ❌ Lo que faltaba (idempotencia, logging, validaciones)
- 📋 Endpoint actual vs mejorado (con código completo)
- 🗄️ Tabla payment_intents necesaria
- 📊 Comparativa de mejoras

**Audiencia:** Desarrolladores backend

**Tiempo de lectura:** 20 minutos

---

### 3. 🔌 [STRIPE_CONNECT_MODEL.md](STRIPE_CONNECT_MODEL.md)
**Documentación del modelo de Stripe Connect**

**Contiene:**
- 🎯 Decisión arquitectural (Destination Charges)
- ✅ Por qué este modelo vs alternativas
- 📊 Comparativa de 3 modelos de Connect
- 🔍 Detalles técnicos (flujo de dinero, timing, fees)
- 🛡️ Seguridad y compliance
- 🚀 Implementación en Delicrunch
- 📈 Métricas y reporting
- 🔄 Webhooks

**Audiencia:** Arquitectos, Tech Leads, Desarrolladores senior

**Tiempo de lectura:** 25 minutos

---

### 4. 🧪 [PAYMENT_SPLIT_TESTING.md](PAYMENT_SPLIT_TESTING.md)
**Guía completa de pruebas**

**Contiene:**
- 🔐 Configuración previa (env vars, Stripe Dashboard)
- 🧪 10 casos de prueba detallados:
  1. Pago exitoso básico
  2. Pago con cupón
  3. Múltiples unidades
  4. Idempotencia (doble click)
  5. Validación mínimo ($10)
  6. Validación máximo ($500k)
  7. Merchant sin configurar
  8. Merchant con charges disabled
  9. Tarjeta declinada
  10. Sin conexión a Stripe
- 🃏 Tarjetas de prueba Stripe
- 📊 Validación en Dashboard
- 🚨 Errores comunes y soluciones
- ✅ Checklist de pruebas

**Audiencia:** QA Engineers, Desarrolladores que van a probar

**Tiempo de lectura:** 30 minutos

---

## 💻 CÓDIGO MODIFICADO

### 1. [Backend/controllers/paymentController.js](Backend/controllers/paymentController.js)
**Función principal:** `createPaymentIntent` (líneas 110-350)

**Mejoras:**
- ✅ Idempotency key único: `pi_${userId}_${productId}_${cantidad}_${timestamp}`
- ✅ Validación de merchant account (`charges_enabled`)
- ✅ Validaciones de monto (min $10, max $500k)
- ✅ Validación de cantidad (1-10)
- ✅ Validación de producto activo
- ✅ Logging estructurado con emojis
- ✅ Manejo de errores por tipo Stripe (7 casos)
- ✅ Metadata completo (12 campos)
- ✅ Auditoría en BD (INSERT INTO payment_intents)
- ✅ Respuesta mejorada al frontend

**Modelo Stripe:**
```javascript
application_fee_amount: Math.round(priceInCents * 0.25), // 25%
transfer_data: {
    destination: merchantStripeAccountId, // 75%
}
```

---

## 🗄️ BASE DE DATOS

### 1. [Backend/db/schema.sql](Backend/db/schema.sql)
**Tabla nueva:** `payment_intents`

**Columnas:**
- `stripe_payment_intent_id` - ID de Stripe (UNIQUE)
- `user_id` - Comprador
- `product_id` - Producto comprado
- `store_id` - Comercio
- `amount` - Monto total (centavos)
- `application_fee_amount` - Comisión plataforma (centavos)
- `status` - Estado (succeeded, failed, etc.)
- `metadata` - JSONB con detalles
- `created_at`, `updated_at` - Auditoría

**Índices:**
- `idx_payment_intents_user_id`
- `idx_payment_intents_stripe_id`
- `idx_payment_intents_status`
- `idx_payment_intents_store_id`

### 2. [Backend/db/migrate-payment-intents.js](Backend/db/migrate-payment-intents.js)
**Script de migración**

**Uso:**
```bash
cd Backend
node db/migrate-payment-intents.js
```

**Qué hace:**
1. Crea tabla `payment_intents`
2. Crea 4 índices
3. Maneja IF NOT EXISTS (idempotente)

---

## 🎯 FLUJO COMPLETO

### Frontend → Backend → Stripe → BD

```
1. Usuario selecciona producto
   ↓
2. PaymentScreen.js → initializePayment()
   ↓
3. POST /api/payments/create-payment-intent
   {
       productId: 123,
       cantidad: 2,
       coupon_discount: 10
   }
   ↓
4. Backend: paymentController.createPaymentIntent
   ├─ Valida producto existe y está activo
   ├─ Valida merchant tiene charges_enabled
   ├─ Calcula split (25% / 75%)
   ├─ Crea PaymentIntent con idempotency_key
   ├─ Guarda en tabla payment_intents
   └─ Retorna clientSecret
   ↓
5. Stripe procesa cargo
   ├─ Cobra al comprador: $100
   ├─ Application fee: $25 (plataforma)
   └─ Transfer: $75 (comercio)
   ↓
6. Frontend: presentPaymentSheet
   ↓
7. Usuario confirma pago
   ↓
8. Payment Sheet: success
   ↓
9. Frontend: onPaymentSuccess()
   ↓
10. POST /api/orders (crear orden)
    ↓
11. ✅ Orden creada, stock actualizado
```

---

## 📊 VALIDACIÓN

### En Stripe Dashboard
```
1. Login: https://dashboard.stripe.com/test
2. Payments → Buscar por fecha
3. Click en PaymentIntent reciente
4. Verificar:
   ✅ Amount: 10,000 centavos ($100.00)
   ✅ Application fee: 2,500 centavos ($25.00)
   ✅ Status: succeeded
   ✅ Transfer data: destination = acct_XXX
```

### En Base de Datos
```sql
SELECT 
    pi.stripe_payment_intent_id,
    pi.amount / 100.0 as total_mxn,
    pi.application_fee_amount / 100.0 as platform_mxn,
    (pi.amount - pi.application_fee_amount) / 100.0 as merchant_mxn,
    ROUND(pi.application_fee_amount * 100.0 / pi.amount, 2) as platform_pct,
    pi.status,
    s.nombre_comercio
FROM payment_intents pi
JOIN stores s ON pi.store_id = s.id
ORDER BY pi.created_at DESC
LIMIT 5;
```

**Output esperado:**
```
total_mxn | platform_mxn | merchant_mxn | platform_pct | status    | nombre_comercio
----------|--------------|--------------|--------------|-----------|----------------
100.00    | 25.00        | 75.00        | 25.00        | succeeded | Tacos El Paisa
```

---

## 🚀 INICIO RÁPIDO

### Para probar el sistema:

1. **Ejecutar migración:**
   ```bash
   cd /workspaces/Delicrunch/Backend
   node db/migrate-payment-intents.js
   ```

2. **Iniciar backend:**
   ```bash
   npm start
   ```

3. **Iniciar frontend:**
   ```bash
   cd /workspaces/Delicrunch/Frontend
   npm start
   ```

4. **Probar pago:**
   - Seleccionar producto
   - Click "Pagar ahora"
   - Tarjeta: `4242 4242 4242 4242`
   - CVC: `123`, Fecha: `12/34`
   - Confirmar

5. **Validar:**
   - ✅ Frontend navega a confirmación
   - ✅ Orden creada en BD
   - ✅ PaymentIntent en Stripe Dashboard
   - ✅ Split 75/25 visible
   - ✅ Registro en tabla payment_intents

---

## 🔧 PARA DESARROLLADORES

### Agregar un nuevo campo al PaymentIntent:

1. **Modificar paymentController.js:**
   ```javascript
   const paymentIntentData = {
       // ... campos existentes
       metadata: {
           // ... campos existentes
           nuevo_campo: 'valor',
       },
   };
   ```

2. **Actualizar tabla (opcional):**
   ```sql
   ALTER TABLE payment_intents 
   ADD COLUMN nuevo_campo VARCHAR(255);
   ```

3. **Probar:**
   - Crear nuevo pago
   - Verificar en Stripe Dashboard
   - Verificar en BD

---

## 🧪 PARA QA

### Ejecutar suite de pruebas:

1. **Leer:** [PAYMENT_SPLIT_TESTING.md](PAYMENT_SPLIT_TESTING.md)
2. **Preparar:** Configurar variables de entorno
3. **Ejecutar:** Los 10 casos de prueba
4. **Documentar:** Resultados en spreadsheet
5. **Reportar:** Bugs encontrados

**Checklist mínimo:**
- [ ] Pago exitoso básico ✅
- [ ] Validación mínimo ($10) ✅
- [ ] Validación máximo ($500k) ✅
- [ ] Idempotencia (doble click) ✅
- [ ] Tarjeta declinada ✅

---

## 📞 SOPORTE

### Problemas comunes:

#### "No such account: acct_XXX"
- **Causa:** stripe_account_id inválido
- **Solución:** Volver a hacer onboarding del comercio
- **Doc:** [PAYMENT_SPLIT_TESTING.md](PAYMENT_SPLIT_TESTING.md#errores-comunes)

#### "Amount must be at least $0.50"
- **Causa:** Monto muy pequeño
- **Solución:** Verificar que total >= $10 MXN
- **Doc:** [PAYMENT_SPLIT_ANALYSIS.md](PAYMENT_SPLIT_ANALYSIS.md#validaciones)

#### "Idempotent key already used"
- **Causa:** Reusar key con datos diferentes
- **Solución:** El sistema genera key único con timestamp
- **Doc:** [STRIPE_CONNECT_MODEL.md](STRIPE_CONNECT_MODEL.md#idempotencia)

---

## 🎓 APRENDIZAJE

### Para entender Stripe Connect:

1. **Leer:** [STRIPE_CONNECT_MODEL.md](STRIPE_CONNECT_MODEL.md)
2. **Comparar:** Los 3 modelos (Direct, Destination, Separate)
3. **Entender:** Por qué elegimos Destination Charges
4. **Probar:** En Stripe Dashboard test mode

### Para entender el código:

1. **Leer:** [PAYMENT_SPLIT_ANALYSIS.md](PAYMENT_SPLIT_ANALYSIS.md)
2. **Comparar:** Código antes vs después
3. **Ver:** [paymentController.js](Backend/controllers/paymentController.js)
4. **Probar:** Hacer un pago de prueba

---

## 📈 MÉTRICAS

### Queries útiles:

```sql
-- Total de ventas hoy
SELECT 
    COUNT(*) as total_transacciones,
    SUM(amount) / 100.0 as total_ventas,
    SUM(application_fee_amount) / 100.0 as comisiones_plataforma
FROM payment_intents
WHERE status = 'succeeded'
  AND created_at >= CURRENT_DATE;

-- Top 5 comercios por ventas
SELECT 
    s.nombre_comercio,
    COUNT(*) as ventas,
    SUM(pi.amount - pi.application_fee_amount) / 100.0 as ingresos_netos
FROM payment_intents pi
JOIN stores s ON pi.store_id = s.id
WHERE pi.status = 'succeeded'
  AND pi.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY s.nombre_comercio
ORDER BY ingresos_netos DESC
LIMIT 5;

-- Promedio de comisión
SELECT 
    AVG(application_fee_amount * 100.0 / amount) as promedio_comision
FROM payment_intents
WHERE status = 'succeeded'
  AND amount > 0;
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [x] Idempotencia implementada
- [x] Validaciones completas
- [x] Logging estructurado
- [x] Manejo de errores específico
- [x] Verificación de merchant
- [x] Metadata completo
- [x] Auditoría en BD
- [x] Tabla payment_intents en schema
- [x] Script de migración

### Frontend
- [x] Payment Sheet integrado
- [x] Confirmación automática
- [x] Manejo de errores
- [ ] Mostrar desglose de comisión (opcional)

### Base de Datos
- [x] Tabla payment_intents definida
- [ ] Migración ejecutada (pendiente)
- [x] Índices creados

### Documentación
- [x] Análisis técnico
- [x] Guía de pruebas
- [x] Documentación de modelo
- [x] Resumen ejecutivo
- [x] Este índice

### Testing
- [ ] Ejecutar 10 casos de prueba
- [ ] Validar en Stripe Dashboard
- [ ] Validar en BD
- [ ] Documentar resultados

---

## 🎉 CONCLUSIÓN

**Todo está listo para usar:**
1. ✅ Código mejorado con idempotencia y validaciones
2. ✅ Tabla de auditoría diseñada
3. ✅ Documentación completa
4. ✅ Casos de prueba definidos

**Próximo paso:**
Ejecutar migración y pruebas siguiendo [PAYMENT_SPLIT_TESTING.md](PAYMENT_SPLIT_TESTING.md)

---

**Última actualización:** $(date)
**Modelo:** Destination Charges (Stripe Connect)
**Split:** 75% Comercio / 25% Plataforma
**Estado:** ✅ Listo para pruebas
