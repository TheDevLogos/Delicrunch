# 💰 ANÁLISIS: Sistema de Cobro y Split Automático 75/25

## 📊 ESTADO ACTUAL: 80% IMPLEMENTADO

### ✅ Lo que YA EXISTE y FUNCIONA

#### 1. **Modelo de Stripe Connect Usado: Destination Charges** ✅

**Archivo:** `Backend/controllers/paymentController.js` (líneas 172-195)

```javascript
const paymentIntentData = {
    amount: priceInCents,
    currency: 'mxn',
    automatic_payment_methods: {
        enabled: true,
    },
    application_fee_amount: applicationFeeAmount,  // 25% para plataforma
    transfer_data: {
        destination: merchantStripeAccountId,      // 75% al comercio
    },
    metadata: { ... },
};
```

**¿Por qué Destination Charges?**

✅ **Ventajas:**
1. **Control total:** La plataforma crea el PaymentIntent, no el comercio
2. **Comisión garantizada:** `application_fee_amount` asegura el 25%
3. **Experiencia unificada:** El comprador ve "Delicrunch" como merchant
4. **Disputas manejadas:** La plataforma maneja chargebacks
5. **Más simple:** No requiere On-Behalf-Of complicado

❌ **Alternativas descartadas:**
- **Direct Charges:** El comercio cobra directamente → Pérdida de control
- **Separate Charges and Transfers:** Requiere dos transacciones → Más complejo

**Conclusión:** Destination Charges es el modelo correcto para Delicrunch ✅

---

#### 2. **Flujo de Pago Actual**

```
Usuario → PaymentScreen
    ↓
Selecciona producto + cantidad
    ↓
Presiona "Pagar ahora"
    ↓
Frontend: initializePayment()
    ├─ Obtiene Customer Session
    ├─ Crea Payment Intent (split automático)
    ├─ Inicializa Payment Sheet
    └─ Presenta Payment Sheet
    ↓
Usuario confirma pago
    ↓
Payment Sheet procesa automáticamente
    ↓
Frontend: onPaymentSuccess()
    ├─ Crea orden en BD
    └─ Navega a confirmación
    ↓
✅ Orden creada + Comercio recibe 75% + Plataforma 25%
```

---

#### 3. **Cálculo de Split**

**Backend** (`paymentController.js:168-169`):
```javascript
const priceInCents = Math.round(totalAfterCoupon * 100);
const applicationFeeAmount = Math.round(priceInCents * 0.25); // 25% plataforma
```

**Ejemplo:**
- Producto: $100.00 MXN
- Total en centavos: 10,000
- Comisión plataforma (25%): 2,500 centavos = $25.00
- Transferencia al comercio (75%): 7,500 centavos = $75.00

---

### ❌ LO QUE FALTA

#### 1. **Idempotencia** ⚠️ CRÍTICO
**Problema:** Si el usuario hace doble clic, se crean dos PaymentIntents

**Solución:** Usar `idempotency_key`

```javascript
// ANTES (actual)
const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

// DESPUÉS (con idempotencia)
const paymentIntent = await stripe.paymentIntents.create(
    paymentIntentData,
    {
        idempotencyKey: `order_${userId}_${productId}_${Date.now()}`
    }
);
```

#### 2. **Logging Detallado** ⚠️ IMPORTANTE
**Problema:** Logs básicos, difícil debuggear

**Solución:** Logging estructurado con Winston o similar

```javascript
logger.info('Creating Payment Intent', {
    userId,
    productId,
    amount: priceInCents,
    applicationFee: applicationFeeAmount,
    merchantAccountId: merchantStripeAccountId,
});
```

#### 3. **Validaciones Mejoradas** ⚠️ IMPORTANTE
**Problema:** Validaciones básicas

**Mejoras necesarias:**
- Verificar que merchant tiene charges_enabled
- Verificar límites de transacción
- Validar currency soportada

#### 4. **Manejo de Errores Específicos** ⚠️ IMPORTANTE
**Problema:** Errores genéricos

**Solución:** Catch específico por tipo de error Stripe

```javascript
try {
    // ...
} catch (error) {
    if (error.type === 'StripeCardError') {
        return res.status(402).json({ msg: 'Tu tarjeta fue declinada.' });
    }
    if (error.type === 'StripeInvalidRequestError') {
        return res.status(400).json({ msg: 'Solicitud inválida.' });
    }
    // ...
}
```

#### 5. **Webhook para Confirmación** ⚠️ RECOMENDADO
**Problema:** Se confía solo en el cliente

**Solución:** Webhook `payment_intent.succeeded` para crear orden de forma segura

```javascript
// Backend webhook handler
exports.handlePaymentWebhook = async (req, res) => {
    const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
    );
    
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        // Crear orden automáticamente
        await createOrderFromPaymentIntent(paymentIntent);
    }
    
    res.json({ received: true });
};
```

#### 6. **Frontend: Confirmación Explícita** ⚠️ MENOR
**Problema:** Payment Sheet confirma automáticamente

**Mejora:** Agregar confirmación explícita si se desea

```javascript
// Después de presentPaymentSheet success
const { error } = await confirmPayment(clientSecret);
```

---

## 🎯 PLAN DE MEJORAS

### Fase 1: Idempotencia y Logging (CRÍTICO)
- [ ] Agregar idempotency_key al endpoint
- [ ] Implementar logging estructurado
- [ ] Agregar retry logic

### Fase 2: Validaciones y Errores (IMPORTANTE)
- [ ] Validar estado de cuenta merchant
- [ ] Mejorar manejo de errores Stripe
- [ ] Agregar límites de transacción

### Fase 3: Webhook (RECOMENDADO)
- [ ] Implementar webhook handler
- [ ] Configurar signature verification
- [ ] Crear orden desde webhook

### Fase 4: Testing (ESENCIAL)
- [ ] Tests unitarios del endpoint
- [ ] Tests de integración con Stripe
- [ ] Documentación de casos de prueba

---

## 📋 ENDPOINT ACTUAL vs MEJORADO

### ACTUAL (paymentController.js:115-204)

```javascript
exports.createPaymentIntent = asyncHandler(async (req, res, next) => {
    const { productId, cantidad = 1, coupon_discount = 0 } = req.body;
    const userId = req.user.id;

    // Validación básica
    if (!productId) {
        return res.status(400).json({ msg: 'Se requiere el ID del producto.' });
    }

    // 1. Obtener producto y merchant account
    const productResult = await pool.query(
        `SELECT p.precio_descuento, s.stripe_account_id, s.nombre_comercio
         FROM products p
         JOIN stores s ON p.store_id = s.id
         WHERE p.id = $1`,
        [productId]
    );

    if (productResult.rows.length === 0) {
        return res.status(404).json({ msg: 'Producto no encontrado.' });
    }

    const product = productResult.rows[0];
    const merchantStripeAccountId = product.stripe_account_id;

    if (!merchantStripeAccountId) {
        return res.status(400).json({ msg: 'El comercio no está configurado.' });
    }

    // 2. Obtener customer
    const profileResult = await pool.query(
        'SELECT stripe_customer_id FROM profiles WHERE user_id = $1',
        [userId]
    );

    let stripeCustomerId = null;
    if (profileResult.rows.length > 0) {
        stripeCustomerId = profileResult.rows[0].stripe_customer_id;
    }

    // 3. Calcular montos
    const subtotal = Number(product.precio_descuento) * Number(cantidad);
    const totalAfterCoupon = Math.max(0, subtotal - Number(coupon_discount));
    const priceInCents = Math.round(totalAfterCoupon * 100);
    const applicationFeeAmount = Math.round(priceInCents * 0.25); // 25%

    console.log('💰 Payment Intent Details:', { ... });

    // 4. Crear PaymentIntent
    const paymentIntentData = {
        amount: priceInCents,
        currency: 'mxn',
        automatic_payment_methods: { enabled: true },
        application_fee_amount: applicationFeeAmount,
        transfer_data: { destination: merchantStripeAccountId },
        metadata: { ... },
    };

    if (stripeCustomerId) {
        paymentIntentData.customer = stripeCustomerId;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    console.log('✅ Payment Intent creado:', paymentIntent.id);

    // 5. Retornar
    res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
    });
});
```

**Problemas:**
- ❌ Sin idempotencia
- ❌ Logs solo con console.log
- ❌ No valida estado de merchant
- ❌ Manejo genérico de errores
- ❌ No guarda PaymentIntent en BD

---

### MEJORADO (propuesto)

```javascript
exports.createPaymentIntent = asyncHandler(async (req, res, next) => {
    const { productId, cantidad = 1, coupon_discount = 0, payment_method_id } = req.body;
    const userId = req.user.id;

    // === VALIDACIÓN MEJORADA ===
    if (!productId) {
        logger.warn('Payment Intent: Missing productId', { userId });
        return res.status(400).json({ msg: 'Se requiere el ID del producto.' });
    }

    if (cantidad < 1 || cantidad > 10) {
        return res.status(400).json({ msg: 'Cantidad debe estar entre 1 y 10.' });
    }

    // === IDEMPOTENCY KEY ===
    const timestamp = Date.now();
    const idempotencyKey = `pi_${userId}_${productId}_${cantidad}_${timestamp}`;

    logger.info('Creating Payment Intent', {
        userId,
        productId,
        cantidad,
        idempotencyKey,
    });

    try {
        // 1. Obtener producto y merchant account
        const productResult = await pool.query(
            `SELECT p.id, p.nombre, p.precio_descuento, p.store_id,
                    s.stripe_account_id, s.nombre_comercio, s.comision_plataforma
             FROM products p
             JOIN stores s ON p.store_id = s.id
             WHERE p.id = $1 AND p.activo = TRUE`,
            [productId]
        );

        if (productResult.rows.length === 0) {
            logger.warn('Product not found', { productId });
            return res.status(404).json({ msg: 'Producto no encontrado o inactivo.' });
        }

        const product = productResult.rows[0];
        const merchantStripeAccountId = product.stripe_account_id;

        if (!merchantStripeAccountId) {
            logger.error('Merchant not configured for payments', {
                storeId: product.store_id,
                productId,
            });
            return res.status(400).json({
                msg: 'El comercio asociado no está configurado para recibir pagos.'
            });
        }

        // === VALIDAR ESTADO DE CUENTA MERCHANT ===
        let merchantAccount;
        try {
            merchantAccount = await stripe.accounts.retrieve(merchantStripeAccountId);
            
            if (!merchantAccount.charges_enabled) {
                logger.error('Merchant charges not enabled', {
                    accountId: merchantStripeAccountId,
                });
                return res.status(400).json({
                    msg: 'El comercio no puede recibir pagos en este momento.'
                });
            }
        } catch (error) {
            logger.error('Error retrieving merchant account', {
                accountId: merchantStripeAccountId,
                error: error.message,
            });
            return res.status(500).json({
                msg: 'Error al verificar la cuenta del comercio.'
            });
        }

        // 2. Obtener customer
        const profileResult = await pool.query(
            'SELECT stripe_customer_id FROM profiles WHERE user_id = $1',
            [userId]
        );

        let stripeCustomerId = null;
        if (profileResult.rows.length > 0) {
            stripeCustomerId = profileResult.rows[0].stripe_customer_id;
        }

        // 3. Calcular montos
        const subtotal = Number(product.precio_descuento) * Number(cantidad);
        const totalAfterCoupon = Math.max(0, subtotal - Number(coupon_discount));
        
        // Validar mínimo
        if (totalAfterCoupon < 10) {
            return res.status(400).json({
                msg: 'El monto mínimo de compra es $10.00 MXN.'
            });
        }

        const priceInCents = Math.round(totalAfterCoupon * 100);
        const comisionPorcentaje = product.comision_plataforma || 25;
        const applicationFeeAmount = Math.round(priceInCents * (comisionPorcentaje / 100));
        const merchantAmount = priceInCents - applicationFeeAmount;

        logger.info('Payment calculation', {
            subtotal,
            couponDiscount: coupon_discount,
            totalAfterCoupon,
            priceInCents,
            applicationFeeAmount,
            merchantAmount,
            comisionPorcentaje,
        });

        // 4. Crear PaymentIntent con idempotencia
        const paymentIntentData = {
            amount: priceInCents,
            currency: 'mxn',
            automatic_payment_methods: {
                enabled: true,
            },
            application_fee_amount: applicationFeeAmount,
            transfer_data: {
                destination: merchantStripeAccountId,
            },
            metadata: {
                product_id: productId.toString(),
                product_name: product.nombre,
                cantidad: cantidad.toString(),
                user_id: userId.toString(),
                store_id: product.store_id.toString(),
                store_name: product.nombre_comercio,
                coupon_discount: coupon_discount.toString(),
                subtotal: subtotal.toString(),
                total: totalAfterCoupon.toString(),
                commission_percentage: comisionPorcentaje.toString(),
            },
            description: `${cantidad}x ${product.nombre} - ${product.nombre_comercio}`,
        };

        // Asociar customer si existe
        if (stripeCustomerId) {
            paymentIntentData.customer = stripeCustomerId;
        }

        // Asociar payment method si se proporciona
        if (payment_method_id) {
            paymentIntentData.payment_method = payment_method_id;
            paymentIntentData.confirm = false; // Confirmar en frontend
        }

        // Crear con idempotencia
        const paymentIntent = await stripe.paymentIntents.create(
            paymentIntentData,
            {
                idempotencyKey: idempotencyKey,
            }
        );

        logger.info('Payment Intent created successfully', {
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            status: paymentIntent.status,
        });

        // 5. Guardar en BD para auditoría
        await pool.query(
            `INSERT INTO payment_intents (
                stripe_payment_intent_id, user_id, product_id, 
                amount, currency, status, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (stripe_payment_intent_id) DO NOTHING`,
            [
                paymentIntent.id,
                userId,
                productId,
                priceInCents,
                'mxn',
                paymentIntent.status,
                JSON.stringify(paymentIntent.metadata),
            ]
        );

        // 6. Retornar
        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: totalAfterCoupon,
            merchantAmount: merchantAmount / 100,
            platformFee: applicationFeeAmount / 100,
        });

    } catch (error) {
        logger.error('Error creating Payment Intent', {
            userId,
            productId,
            error: error.message,
            errorType: error.type,
            errorCode: error.code,
        });

        // Manejo específico de errores Stripe
        if (error.type === 'StripeCardError') {
            return res.status(402).json({
                msg: 'Tu tarjeta fue declinada.',
                decline_code: error.decline_code,
            });
        }

        if (error.type === 'StripeRateLimitError') {
            return res.status(429).json({
                msg: 'Demasiadas solicitudes. Intenta de nuevo en unos momentos.',
            });
        }

        if (error.type === 'StripeInvalidRequestError') {
            return res.status(400).json({
                msg: 'Solicitud inválida. Verifica los datos.',
            });
        }

        if (error.type === 'StripeAPIError') {
            return res.status(500).json({
                msg: 'Error en el servicio de pagos. Intenta más tarde.',
            });
        }

        if (error.type === 'StripeConnectionError') {
            return res.status(503).json({
                msg: 'No se pudo conectar con el servicio de pagos.',
            });
        }

        if (error.type === 'StripeAuthenticationError') {
            logger.critical('Stripe authentication failed', { error: error.message });
            return res.status(500).json({
                msg: 'Error de autenticación con el servicio de pagos.',
            });
        }

        // Error genérico
        return res.status(500).json({
            msg: 'Error al crear la intención de pago.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});
```

**Mejoras:**
- ✅ Idempotencia con key única
- ✅ Logging estructurado
- ✅ Valida estado de merchant
- ✅ Manejo específico de errores Stripe
- ✅ Guarda PaymentIntent en BD
- ✅ Validaciones mejoradas
- ✅ Metadata completo

---

## 🗄️ TABLA NECESARIA

```sql
CREATE TABLE IF NOT EXISTS payment_intents (
    id SERIAL PRIMARY KEY,
    stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    amount INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(50) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_intents_user ON payment_intents(user_id);
CREATE INDEX idx_payment_intents_stripe_id ON payment_intents(stripe_payment_intent_id);
```

---

## 📊 COMPARATIVA

| Aspecto | Actual | Mejorado |
|---------|--------|----------|
| **Idempotencia** | ❌ No | ✅ Sí (idempotencyKey) |
| **Logging** | ⚠️ console.log | ✅ Estructurado |
| **Validación merchant** | ❌ Solo existence | ✅ charges_enabled |
| **Manejo errores** | ⚠️ Genérico | ✅ Por tipo Stripe |
| **Auditoría BD** | ❌ No | ✅ Tabla payment_intents |
| **Metadata** | ⚠️ Básico | ✅ Completo |
| **Validaciones** | ⚠️ Mínimas | ✅ Completas |

---

**Conclusión:** El sistema actual funciona pero necesita mejoras críticas en idempotencia, logging y manejo de errores.
