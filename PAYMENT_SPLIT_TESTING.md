# 🧪 PRUEBAS: Sistema de Pagos con Split 75/25

## 📋 CASOS DE PRUEBA

### 🎯 OBJETIVO
Validar que el split de pagos funciona correctamente:
- ✅ 75% llega al comercio (connected account)
- ✅ 25% se queda en la plataforma (Delicrunch)
- ✅ Idempotencia previene duplicados
- ✅ Validaciones funcionan correctamente

---

## 🔐 CONFIGURACIÓN PREVIA

### 1. Variables de Entorno
```bash
# Backend/.env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Frontend/.env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 2. Stripe Dashboard
1. Ir a: https://dashboard.stripe.com/test/connect/accounts/overview
2. Verificar que el comercio tenga una cuenta Express
3. Verificar que `charges_enabled: true`

### 3. Base de Datos
```bash
# Ejecutar migración
cd Backend
node db/migrate-payment-intents.js
```

---

## 🧪 CASOS DE PRUEBA

### Caso 1: Pago Exitoso Básico

**Descripción:** Comprador paga un pack, se divide automáticamente

**Setup:**
```javascript
{
    productId: 1,
    cantidad: 1,
    coupon_discount: 0,
}
```

**Pasos:**
1. Usuario selecciona producto de $100.00 MXN
2. Presiona "Pagar ahora"
3. Ingresa tarjeta de prueba: `4242 4242 4242 4242`
4. CVC: `123`, Fecha: `12/34`
5. Confirma pago

**Resultado Esperado:**
- ✅ PaymentIntent creado exitosamente
- ✅ Status: `succeeded`
- ✅ Stripe Dashboard muestra:
  - Total cargo: $100.00 MXN
  - Application fee: $25.00 MXN (25%)
  - Transfer al merchant: $75.00 MXN (75%)
- ✅ Orden creada en BD
- ✅ Frontend navega a confirmación

**Validación en Dashboard:**
```
Stripe → Payments → Buscar PaymentIntent ID
- Amount: 10,000 centavos ($100.00)
- Application fee amount: 2,500 centavos ($25.00)
- Transfer data: { destination: "acct_XXX", amount: 7,500 }
```

---

### Caso 2: Pago con Cupón

**Descripción:** Descuento del 20% aplicado antes del split

**Setup:**
```javascript
{
    productId: 1,
    cantidad: 1,
    coupon_discount: 20, // $20 descuento
}
```

**Pasos:**
1. Producto original: $100.00
2. Con cupón: $80.00
3. Pagar

**Resultado Esperado:**
- ✅ Total cargo: $80.00 MXN
- ✅ Plataforma: $20.00 (25% de $80)
- ✅ Comercio: $60.00 (75% de $80)

**Cálculo:**
```
Subtotal: $100.00
- Cupón: $20.00
= Total: $80.00

Split:
- Platform fee (25%): $80 * 0.25 = $20.00
- Merchant (75%): $80 * 0.75 = $60.00
```

---

### Caso 3: Múltiples Unidades

**Descripción:** Compra 3 packs del mismo producto

**Setup:**
```javascript
{
    productId: 1,
    cantidad: 3,
    coupon_discount: 0,
}
```

**Pasos:**
1. Producto: $100.00 x 3 = $300.00
2. Pagar

**Resultado Esperado:**
- ✅ Total cargo: $300.00 MXN
- ✅ Plataforma: $75.00 (25%)
- ✅ Comercio: $225.00 (75%)

---

### Caso 4: Idempotencia (Doble Click)

**Descripción:** Usuario hace doble clic en "Pagar"

**Pasos:**
1. Click "Pagar ahora"
2. Click rápido nuevamente (antes de que responda)

**Resultado Esperado:**
- ✅ Solo se crea 1 PaymentIntent
- ✅ Segundo request usa el mismo idempotency_key
- ✅ Stripe retorna el PaymentIntent existente
- ✅ No hay cargo duplicado

**Validación:**
```sql
SELECT COUNT(*) FROM payment_intents 
WHERE user_id = 1 AND product_id = 1;
-- Debe ser 1, no 2
```

---

### Caso 5: Validación Mínimo

**Descripción:** Producto con precio menor a $10 MXN

**Setup:**
```javascript
{
    productId: 999, // Producto de $5.00
    cantidad: 1,
}
```

**Resultado Esperado:**
- ❌ Error 400
- ❌ Mensaje: "El monto mínimo de compra es $10.00 MXN."
- ❌ No se crea PaymentIntent

---

### Caso 6: Validación Máximo

**Descripción:** Intento de compra > $500,000 MXN

**Setup:**
```javascript
{
    productId: 1,
    cantidad: 10000, // $100 x 10000 = $1M
}
```

**Resultado Esperado:**
- ❌ Error 400
- ❌ Mensaje: "El monto máximo por transacción es $500,000.00 MXN."

---

### Caso 7: Merchant Sin Configurar

**Descripción:** Comercio sin cuenta Stripe Connect

**Setup:**
- Producto de comercio sin `stripe_account_id`

**Resultado Esperado:**
- ❌ Error 400
- ❌ Mensaje: "El comercio asociado a este producto no está configurado para recibir pagos."

---

### Caso 8: Merchant Con Charges Disabled

**Descripción:** Comercio con cuenta, pero charges_enabled = false

**Setup:**
- Comercio con cuenta Stripe pero sin completar onboarding

**Resultado Esperado:**
- ❌ Error 400
- ❌ Mensaje: "El comercio no puede recibir pagos en este momento. Por favor, contacta soporte."

---

### Caso 9: Tarjeta Declinada

**Descripción:** Tarjeta de prueba que siempre falla

**Pasos:**
1. Usar tarjeta: `4000 0000 0000 0002` (declinada)
2. Intentar pagar

**Resultado Esperado:**
- ❌ Error 402
- ❌ Mensaje: "Tu tarjeta fue declinada."
- ❌ `decline_code` en respuesta

---

### Caso 10: Sin Conexión a Stripe

**Descripción:** Simular error de red

**Setup:**
- Desactivar internet momentáneamente

**Resultado Esperado:**
- ❌ Error 503
- ❌ Mensaje: "No se pudo conectar con el servicio de pagos. Verifica tu conexión."

---

## 🃏 TARJETAS DE PRUEBA STRIPE

### ✅ Exitosas
```
4242 4242 4242 4242 - Visa básica
5555 5555 5555 4444 - Mastercard
378282246310005 - American Express
```

### ❌ Declinadas
```
4000 0000 0000 0002 - Generic decline
4000 0000 0000 9995 - Insufficient funds
4000 0000 0000 9987 - Lost card
4000 0000 0000 9979 - Stolen card
```

### 🔐 3D Secure
```
4000 0025 0000 3155 - Require authentication
4000 0000 0000 3220 - Auth declined
```

---

## 📊 VALIDACIÓN EN DASHBOARD

### 1. Stripe Dashboard
```
1. Login: https://dashboard.stripe.com/test
2. Payments → Buscar por fecha
3. Click en PaymentIntent
4. Verificar:
   - Amount: correcto
   - Application fee: 25%
   - Transfer: 75% al merchant
   - Status: succeeded
```

### 2. Connect Dashboard
```
1. Connect → Accounts
2. Buscar comercio
3. Click "Payments"
4. Verificar que aparece transfer de 75%
```

### 3. Base de Datos
```sql
-- Ver PaymentIntents recientes
SELECT 
    pi.stripe_payment_intent_id,
    pi.amount / 100.0 as amount_mxn,
    pi.application_fee_amount / 100.0 as platform_fee_mxn,
    (pi.amount - pi.application_fee_amount) / 100.0 as merchant_amount_mxn,
    pi.status,
    u.nombre as user_name,
    p.nombre as product_name,
    s.nombre_comercio as store_name,
    pi.created_at
FROM payment_intents pi
JOIN users u ON pi.user_id = u.id
JOIN products p ON pi.product_id = p.id
JOIN stores s ON pi.store_id = s.id
ORDER BY pi.created_at DESC
LIMIT 10;
```

### 4. Logs del Backend
```bash
# Ver logs en consola
grep "Payment Intent" backend.log

# Buscar errores
grep "❌" backend.log
```

---

## 🚨 ERRORES COMUNES Y SOLUCIONES

### Error: "No such account: acct_XXX"
**Causa:** stripe_account_id inválido en BD
**Solución:** 
```sql
UPDATE stores 
SET stripe_account_id = NULL 
WHERE id = 1;
-- Volver a hacer onboarding
```

### Error: "Amount must be at least $0.50"
**Causa:** Monto muy pequeño
**Solución:** Verificar que producto >= $10 MXN

### Error: "This account cannot currently make live charges"
**Causa:** Cuenta en test mode pero usando live key
**Solución:** Verificar que .env use `sk_test_...`

### Error: "Idempotent key already used"
**Causa:** Intentando reusar idempotency key con datos diferentes
**Solución:** El sistema genera nuevo key con timestamp, no debería pasar

---

## 📝 CHECKLIST DE PRUEBAS

### Funcionales
- [ ] Pago exitoso básico
- [ ] Pago con cupón
- [ ] Múltiples unidades
- [ ] Tarjeta declinada
- [ ] Tarjeta 3D Secure

### Validaciones
- [ ] Mínimo $10 MXN
- [ ] Máximo $500,000 MXN
- [ ] Cantidad entre 1-10
- [ ] Producto activo
- [ ] Merchant configurado
- [ ] Merchant charges_enabled

### Seguridad
- [ ] Idempotencia funciona
- [ ] No se puede pagar sin auth
- [ ] No se puede pagar producto de otra tienda sin permiso

### Split
- [ ] 25% llega a plataforma
- [ ] 75% llega a merchant
- [ ] Metadata completo
- [ ] Auditoría en BD

---

## 🎯 RESULTADO ESPERADO

Al finalizar todas las pruebas:

1. **Backend:**
   - ✅ Endpoint `/api/payments/create-payment-intent` funcional
   - ✅ Idempotencia implementada
   - ✅ Validaciones completas
   - ✅ Logs detallados
   - ✅ Tabla payment_intents poblada

2. **Stripe Dashboard:**
   - ✅ PaymentIntents con split correcto
   - ✅ Transfers al merchant visibles
   - ✅ Application fees registradas

3. **Base de Datos:**
   - ✅ Órdenes creadas correctamente
   - ✅ payment_intents registrados
   - ✅ financial_metrics actualizadas

4. **Frontend:**
   - ✅ Payment Sheet funcional
   - ✅ Confirmación de pago
   - ✅ Navegación correcta

---

## 🔄 FLUJO COMPLETO DE PRUEBA

```bash
# 1. Preparar entorno
cd Backend
node db/migrate-payment-intents.js

# 2. Iniciar backend
npm start

# 3. Iniciar frontend (en otra terminal)
cd ../Frontend
npm start

# 4. Ejecutar pruebas
# - Seguir cada caso de prueba
# - Documentar resultados
# - Capturar screenshots de Stripe Dashboard

# 5. Validar en BD
psql -d delicrunch -c "SELECT * FROM payment_intents ORDER BY created_at DESC LIMIT 5;"

# 6. Verificar logs
tail -f backend.log | grep "Payment"
```

---

**Conclusión:** Con estas pruebas validamos que el sistema de split 75/25 funciona correctamente en todos los escenarios posibles.
