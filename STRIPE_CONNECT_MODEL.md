# 🔌 STRIPE CONNECT: Modelo Destination Charges

## 🎯 DECISIÓN ARQUITECTURAL

### ¿Qué modelo usar para Delicrunch?

Stripe Connect ofrece 3 modelos principales:

1. **Direct Charges** → ❌ Descartado
2. **Destination Charges** → ✅ **SELECCIONADO**
3. **Separate Charges and Transfers** → ❌ Descartado

---

## ✅ DESTINATION CHARGES (Modelo Seleccionado)

### 📖 Definición
La plataforma (Delicrunch) crea el cargo y transfiere automáticamente el 75% al comercio. El comprador ve "Delicrunch" como el merchant.

### 🏗️ Arquitectura
```
Comprador ($100)
    ↓
    Cargo procesado por: PLATAFORMA (Delicrunch)
    ↓
    Split automático:
    ├─ Application Fee (25%): $25 → Plataforma ✅
    └─ Transfer (75%): $75 → Comercio ✅
```

### 💡 Código
```javascript
const paymentIntent = await stripe.paymentIntents.create({
    amount: 10000, // $100.00 MXN
    currency: 'mxn',
    application_fee_amount: 2500, // 25% = $25.00
    transfer_data: {
        destination: 'acct_merchant_123', // 75% = $75.00
    },
}, {
    idempotencyKey: 'unique_key_123',
});
```

### ✅ Ventajas

#### 1. **Control Total de la Plataforma**
- La plataforma crea el PaymentIntent
- La plataforma decide la comisión
- La plataforma maneja errores y reintentos
- La plataforma ve todos los datos del pago

#### 2. **Comisión Garantizada**
- `application_fee_amount` se cobra ANTES del transfer
- No hay riesgo de que el comercio no pague comisión
- No se puede revertir el fee

#### 3. **Experiencia de Usuario Unificada**
- El comprador ve "Delicrunch" como merchant
- Brand consistency
- Confianza del comprador en la plataforma
- Soporte centralizado

#### 4. **Manejo de Disputas Simplificado**
- La plataforma maneja chargebacks
- El comercio no tiene que lidiar con disputas
- Protección para el comercio

#### 5. **Onboarding Más Simple**
- Solo requiere Express Account
- No requiere configuración compleja del comercio
- El comercio solo necesita proporcionar datos bancarios

#### 6. **Visibilidad Completa**
- La plataforma ve todos los pagos en su dashboard
- Mejor auditoría y reporting
- Métricas centralizadas

#### 7. **Compliance y Regulaciones**
- La plataforma es responsable del compliance
- El comercio tiene menos carga regulatoria
- Más fácil cumplir con PCI-DSS

---

## ❌ ALTERNATIVAS DESCARTADAS

### 1. Direct Charges

**Definición:** El comercio crea el cargo directamente, la plataforma cobra comisión después.

**Arquitectura:**
```
Comprador ($100)
    ↓
    Cargo procesado por: COMERCIO
    ↓
    Después:
    └─ Plataforma cobra comisión del comercio
```

**Por qué NO:**
- ❌ Pérdida de control de la plataforma
- ❌ El comercio podría no pagar comisión
- ❌ Más complejo de implementar
- ❌ Comprador ve al comercio, no a Delicrunch
- ❌ Cada comercio necesita cuenta completa (no Express)
- ❌ Compliance complejo para cada comercio

**Cuándo usar:**
- Cuando el comercio quiere control total
- Cuando el marketplace es solo referral
- Cuando la plataforma solo cobra listing fee

---

### 2. Separate Charges and Transfers

**Definición:** Dos transacciones separadas: cargo al comprador + transfer al comercio.

**Arquitectura:**
```
Comprador ($100)
    ↓
    Transacción 1: Cargo a comprador
    ↓
    Delicrunch recibe $100
    ↓
    Transacción 2: Transfer a comercio
    ↓
    Comercio recibe $75
```

**Por qué NO:**
- ❌ Dos transacciones = más fees de Stripe
- ❌ Más complejo de implementar
- ❌ Más propenso a errores
- ❌ El transfer puede fallar independientemente
- ❌ Timing complicado (¿cuándo hacer el transfer?)
- ❌ Más difícil de auditar

**Cuándo usar:**
- Cuando el split no es automático
- Cuando hay aprobación manual antes del transfer
- Cuando los montos varían después del cargo

---

## 📊 COMPARATIVA

| Aspecto | Destination Charges ✅ | Direct Charges | Separate Charges |
|---------|----------------------|----------------|------------------|
| **Control Plataforma** | ✅ Total | ❌ Limitado | ✅ Total |
| **Comisión Garantizada** | ✅ Sí | ❌ No | ✅ Sí |
| **Complejidad** | ✅ Baja | ⚠️ Media | ❌ Alta |
| **Fees de Stripe** | ✅ 1 cargo | ✅ 1 cargo | ❌ 2 cargos |
| **Onboarding** | ✅ Simple (Express) | ❌ Complejo (Standard) | ✅ Simple |
| **Disputas** | ✅ Plataforma | ❌ Comercio | ✅ Plataforma |
| **Visibilidad** | ✅ Completa | ⚠️ Parcial | ✅ Completa |
| **Brand** | ✅ Plataforma | ❌ Comercio | ✅ Plataforma |

---

## 🔍 DETALLES TÉCNICOS

### 1. Flujo de Dinero

```
Comprador paga $100.00 MXN
    ↓
Stripe procesa el cargo
    ↓
    ├─ Application Fee (25%): $25.00
    │   └─ Disponible inmediatamente en Delicrunch
    │
    └─ Transfer (75%): $75.00
        └─ Se transfiere al comercio según su schedule
           (puede ser inmediato, diario, semanal)
```

### 2. Timing

- **Application Fee:** Disponible inmediatamente en balance de plataforma
- **Transfer:** Según el payout schedule del comercio
  - Instant (con fee adicional): Inmediato
  - Daily: Cada 24 horas
  - Weekly: Cada 7 días
  - Monthly: Cada 30 días

### 3. Fees de Stripe

**Para el cargo:**
```
$100.00 cargo
- $2.90 (2.9% fee de Stripe)
- $0.30 (fixed fee)
= $96.80 neto para dividir
```

**Split:**
```
Application Fee (25%): $24.20
Transfer to merchant (75%): $72.60
```

**Nota:** Los fees de Stripe se deducen del total antes del split, a menos que se especifique lo contrario.

### 4. Refunds

Si hay un refund:
```
Refund $100.00
    ↓
    ├─ Se devuelve al comprador: $100.00
    ├─ Se recupera de comercio: $75.00
    └─ Se recupera de plataforma: $25.00
```

Los fees de Stripe NO se devuelven.

---

## 🛡️ SEGURIDAD Y COMPLIANCE

### 1. PCI Compliance
- ✅ La plataforma es responsable
- ✅ Stripe maneja datos de tarjeta
- ✅ El comercio NO ve datos de tarjeta
- ✅ Menos superficie de ataque

### 2. KYC (Know Your Customer)
- ✅ Stripe verifica identidad del comercio
- ✅ Stripe verifica cuenta bancaria
- ✅ La plataforma no necesita hacer KYC propio

### 3. Disputas
- ✅ Plataforma recibe notificación de disputa
- ✅ Plataforma puede responder
- ✅ Si se pierde disputa:
  - Comercio pierde $75
  - Plataforma pierde $25
  - Ambos comparten el riesgo

---

## 🚀 IMPLEMENTACIÓN EN DELICRUNCH

### 1. Configuración de Cuenta

**Tipo de cuenta:** Express Account

**Campos requeridos:**
```javascript
const account = await stripe.accounts.create({
    type: 'express',
    country: 'MX',
    email: comercio.email,
    capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
    },
    business_type: 'individual', // o 'company'
    business_profile: {
        name: 'Comercio XYZ',
        mcc: '5812', // Restaurants
    },
});
```

### 2. Onboarding

```javascript
const accountLink = await stripe.accountLinks.create({
    account: 'acct_123',
    refresh_url: 'https://delicrunch.com/onboarding/refresh',
    return_url: 'https://delicrunch.com/onboarding/complete',
    type: 'account_onboarding',
});

// Redirigir comercio a accountLink.url
```

### 3. Crear Pago con Split

```javascript
// Backend: paymentController.js
const paymentIntent = await stripe.paymentIntents.create({
    amount: 10000, // $100.00 en centavos
    currency: 'mxn',
    automatic_payment_methods: { enabled: true },
    application_fee_amount: 2500, // 25%
    transfer_data: {
        destination: merchantStripeAccountId, // 75%
    },
    customer: stripeCustomerId,
    metadata: {
        product_id: '123',
        store_id: '456',
        user_id: '789',
    },
}, {
    idempotencyKey: `pi_${userId}_${productId}_${timestamp}`,
});
```

### 4. Verificar Estado de Cuenta

```javascript
const account = await stripe.accounts.retrieve(merchantStripeAccountId);

if (!account.charges_enabled) {
    throw new Error('Merchant cannot receive charges');
}

if (!account.payouts_enabled) {
    console.warn('Merchant cannot receive payouts yet');
}
```

---

## 📈 MÉTRICAS Y REPORTING

### Dashboard de Delicrunch

```sql
-- Total de ventas del día
SELECT 
    DATE(created_at) as fecha,
    COUNT(*) as total_transacciones,
    SUM(amount) / 100.0 as total_ventas,
    SUM(application_fee_amount) / 100.0 as total_comisiones_plataforma
FROM payment_intents
WHERE status = 'succeeded'
  AND created_at >= CURRENT_DATE
GROUP BY DATE(created_at);
```

### Dashboard del Comercio

```sql
-- Ingresos del comercio
SELECT 
    DATE(created_at) as fecha,
    COUNT(*) as total_ventas,
    SUM(amount - application_fee_amount) / 100.0 as ingresos_netos
FROM payment_intents
WHERE status = 'succeeded'
  AND store_id = 123
GROUP BY DATE(created_at);
```

---

## 🔄 WEBHOOKS

Para mantener sincronizado:

```javascript
// Backend: webhookController.js
app.post('/api/webhooks/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
        case 'payment_intent.succeeded':
            // Actualizar orden a "pagado"
            await updateOrder(event.data.object);
            break;

        case 'payment_intent.payment_failed':
            // Notificar al usuario
            await notifyPaymentFailed(event.data.object);
            break;

        case 'transfer.created':
            // Registrar transfer al comercio
            await logTransfer(event.data.object);
            break;

        case 'account.updated':
            // Actualizar estado de cuenta del comercio
            await updateMerchantAccount(event.data.object);
            break;
    }

    res.json({ received: true });
});
```

---

## 🎯 CONCLUSIÓN

**Destination Charges es el modelo ideal para Delicrunch porque:**

1. ✅ Control total de la plataforma
2. ✅ Comisión garantizada (25%)
3. ✅ Experiencia unificada para el comprador
4. ✅ Onboarding simple para comercios
5. ✅ Manejo centralizado de disputas
6. ✅ Compliance simplificado
7. ✅ Mejor auditoría y reporting

**Implementación actual:**
- ✅ Modelo implementado correctamente
- ✅ Split 75/25 funcionando
- ✅ Idempotencia agregada
- ✅ Validaciones completas
- ✅ Logging detallado

**Próximos pasos:**
1. Ejecutar pruebas completas
2. Configurar webhooks
3. Monitorear métricas
4. Escalar a producción

---

**Referencias:**
- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Destination Charges](https://stripe.com/docs/connect/destination-charges)
- [Express Accounts](https://stripe.com/docs/connect/express-accounts)
