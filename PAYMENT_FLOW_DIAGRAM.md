# 🎨 DIAGRAMA DE FLUJO: Sistema de Pagos con Split 75/25

## 📱 FLUJO COMPLETO: Frontend → Backend → Stripe → Base de Datos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          👤 USUARIO COMPRADOR                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1. Selecciona producto
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                       📱 FRONTEND (PaymentScreen.js)                    │
├─────────────────────────────────────────────────────────────────────────┤
│  • Muestra producto: Tacos Sorpresa - $100.00 MXN                     │
│  • Cantidad: 2                                                          │
│  • Cupón: -$10.00                                                       │
│  • Total: $190.00 MXN                                                   │
│                                                                         │
│  Usuario presiona: [Pagar ahora]                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 2. initializePayment()
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                   📡 API REQUEST                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  POST /api/payments/create-payment-intent                              │
│  Headers: { Authorization: "Bearer token_abc123" }                     │
│  Body: {                                                                │
│    productId: 123,                                                      │
│    cantidad: 2,                                                         │
│    coupon_discount: 10                                                  │
│  }                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 3. Autenticación (authMiddleware)
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│              🔐 BACKEND: authMiddleware                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  ✅ Token válido → req.user = { id: 789, rol: 'comprador' }           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 4. Procesamiento
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│        💻 BACKEND: paymentController.createPaymentIntent               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PASO 1: VALIDACIONES                                                  │
│  ├─ ✅ productId existe                                                │
│  ├─ ✅ cantidad entre 1-10                                             │
│  └─ ✅ userId del token                                                │
│                                                                         │
│  PASO 2: CONSULTAR PRODUCTO Y COMERCIO                                 │
│  SQL: SELECT p.*, s.stripe_account_id, s.nombre_comercio               │
│       FROM products p JOIN stores s ON p.store_id = s.id               │
│       WHERE p.id = 123                                                  │
│                                                                         │
│  Resultado:                                                             │
│  ├─ producto: { nombre: "Tacos Sorpresa", precio: 100.00 }            │
│  ├─ store: { nombre: "Tacos El Paisa" }                               │
│  └─ stripe_account_id: "acct_1234567890"                              │
│                                                                         │
│  PASO 3: VALIDAR MERCHANT                                              │
│  Stripe API: stripe.accounts.retrieve("acct_1234567890")               │
│  ├─ ✅ charges_enabled: true                                           │
│  └─ ✅ payouts_enabled: true                                           │
│                                                                         │
│  PASO 4: CALCULAR MONTOS                                               │
│  Subtotal:        $100 × 2 = $200.00                                   │
│  Cupón:                    -$10.00                                     │
│  Total:                    $190.00 MXN                                 │
│                                                                         │
│  En centavos:       19,000 centavos                                    │
│                                                                         │
│  Split:                                                                 │
│  ├─ Platform fee (25%):  4,750 centavos = $47.50 💰                   │
│  └─ Merchant (75%):     14,250 centavos = $142.50 💵                  │
│                                                                         │
│  PASO 5: GENERAR IDEMPOTENCY KEY                                       │
│  idempotencyKey = "pi_789_123_2_1704844800000"                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 5. Crear PaymentIntent
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                   🔵 STRIPE API                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  stripe.paymentIntents.create({                                        │
│    amount: 19000,                    // $190.00                        │
│    currency: 'mxn',                                                     │
│    application_fee_amount: 4750,     // 25% = $47.50 para plataforma  │
│    transfer_data: {                                                     │
│      destination: 'acct_1234567890'  // 75% = $142.50 al comercio     │
│    },                                                                   │
│    customer: 'cus_ABC123',           // Comprador                      │
│    metadata: {                                                          │
│      product_id: '123',                                                 │
│      product_name: 'Tacos Sorpresa',                                   │
│      cantidad: '2',                                                     │
│      user_id: '789',                                                    │
│      store_id: '456',                                                   │
│      store_name: 'Tacos El Paisa',                                     │
│      coupon_discount: '10',                                             │
│      total: '190.00',                                                   │
│      platform_fee: '47.50',                                             │
│      merchant_amount: '142.50'                                          │
│    }                                                                    │
│  }, {                                                                   │
│    idempotencyKey: 'pi_789_123_2_1704844800000'                       │
│  })                                                                     │
│                                                                         │
│  ✅ Respuesta:                                                         │
│  {                                                                      │
│    id: 'pi_3QRSTUVWXYZabcdefgh',                                       │
│    client_secret: 'pi_3QRST_secret_xyz123',                           │
│    amount: 19000,                                                       │
│    status: 'requires_payment_method',                                   │
│    application_fee_amount: 4750                                         │
│  }                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 6. Guardar auditoría
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                   🗄️ BASE DE DATOS: payment_intents                    │
├─────────────────────────────────────────────────────────────────────────┤
│  INSERT INTO payment_intents (                                          │
│    stripe_payment_intent_id,   'pi_3QRSTUVWXYZabcdefgh'               │
│    user_id,                    789                                      │
│    product_id,                 123                                      │
│    store_id,                   456                                      │
│    amount,                     19000                                    │
│    currency,                   'mxn'                                    │
│    application_fee_amount,     4750                                     │
│    status,                     'requires_payment_method'                │
│    metadata                    { ... }                                  │
│  )                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 7. Retornar al frontend
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                   📡 API RESPONSE                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  HTTP 200 OK                                                            │
│  {                                                                      │
│    clientSecret: 'pi_3QRST_secret_xyz123',                            │
│    paymentIntentId: 'pi_3QRSTUVWXYZabcdefgh',                         │
│    amount: 190.00,                                                      │
│    merchantAmount: 142.50,                                              │
│    platformFee: 47.50                                                   │
│  }                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 8. Inicializar Payment Sheet
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                  📱 FRONTEND: initPaymentSheet()                        │
├─────────────────────────────────────────────────────────────────────────┤
│  const { error } = await initPaymentSheet({                            │
│    merchantDisplayName: 'Delicrunch',                                  │
│    paymentIntentClientSecret: 'pi_3QRST_secret_xyz123',               │
│    customerId: 'cus_ABC123',                                           │
│    customerEphemeralKeySecret: 'ek_test_xyz',                         │
│    allowsDelayedPaymentMethods: false,                                 │
│  });                                                                    │
│                                                                         │
│  ✅ Payment Sheet listo                                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 9. Presentar al usuario
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                  📱 FRONTEND: presentPaymentSheet()                     │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐                       │
│  │  💳 Pagar con tarjeta                       │                       │
│  ├─────────────────────────────────────────────┤                       │
│  │  Total: $190.00 MXN                         │                       │
│  │                                             │                       │
│  │  Número de tarjeta                          │                       │
│  │  [4242 4242 4242 4242               ]      │                       │
│  │                                             │                       │
│  │  Fecha exp.         CVC                     │                       │
│  │  [12/34]           [123]                    │                       │
│  │                                             │                       │
│  │  [   Pagar $190.00 MXN   ]                 │                       │
│  └─────────────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 10. Usuario confirma
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                   🔵 STRIPE: Procesar pago                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PASO 1: VALIDAR TARJETA                                               │
│  ├─ ✅ Tarjeta válida (4242...)                                        │
│  ├─ ✅ Fecha no expirada                                               │
│  └─ ✅ CVC correcto                                                    │
│                                                                         │
│  PASO 2: CONTACTAR BANCO                                               │
│  ├─ Banco Santander contactado                                         │
│  ├─ Fondos suficientes: ✅                                             │
│  └─ Transacción aprobada: ✅                                           │
│                                                                         │
│  PASO 3: EJECUTAR CARGO                                                │
│  💳 Cargo al comprador:                                                │
│     Tarjeta **** 4242: -$190.00 MXN                                    │
│                                                                         │
│  PASO 4: DIVIDIR FONDOS (AUTOMÁTICO)                                   │
│                                                                         │
│  ┌─────────────────────────────────┐                                   │
│  │   Total cobrado: $190.00        │                                   │
│  └─────────────────┬───────────────┘                                   │
│                    │                                                    │
│         ┌──────────┴──────────┐                                        │
│         │                     │                                        │
│         ↓                     ↓                                        │
│  ┌──────────────┐    ┌───────────────┐                                │
│  │ Plataforma   │    │ Comercio      │                                │
│  │ (Delicrunch) │    │ (Tacos Paisa) │                                │
│  ├──────────────┤    ├───────────────┤                                │
│  │ 25% = $47.50 │    │ 75% = $142.50 │                                │
│  │ 💰           │    │ 💵            │                                │
│  └──────────────┘    └───────────────┘                                │
│                                                                         │
│  Application Fee:    $47.50 → Balance plataforma (disponible YA)      │
│  Transfer:          $142.50 → Cuenta comercio (según schedule)        │
│                                                                         │
│  Status: succeeded ✅                                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 11. Webhook (opcional)
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│              🔔 STRIPE WEBHOOK: payment_intent.succeeded                │
├─────────────────────────────────────────────────────────────────────────┤
│  POST /api/webhooks/stripe                                             │
│  {                                                                      │
│    type: 'payment_intent.succeeded',                                   │
│    data: {                                                              │
│      object: {                                                          │
│        id: 'pi_3QRSTUVWXYZabcdefgh',                                   │
│        amount: 19000,                                                   │
│        status: 'succeeded'                                              │
│      }                                                                  │
│    }                                                                    │
│  }                                                                      │
│                                                                         │
│  Backend actualiza:                                                     │
│  UPDATE payment_intents                                                 │
│  SET status = 'succeeded'                                               │
│  WHERE stripe_payment_intent_id = 'pi_3QRSTUVWXYZabcdefgh'            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 12. Confirmación al frontend
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                📱 FRONTEND: onPaymentSuccess()                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Payment Sheet retorna: { paymentIntent: { status: 'Succeeded' } }    │
│                                                                         │
│  Frontend ejecuta:                                                      │
│  1. Crear orden: POST /api/orders                                      │
│  2. Actualizar stock                                                    │
│  3. Navegar a confirmación                                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 13. Crear orden
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│              💻 BACKEND: orderController.createOrder                    │
├─────────────────────────────────────────────────────────────────────────┤
│  INSERT INTO orders (                                                   │
│    user_id: 789,                                                        │
│    store_id: 456,                                                       │
│    total: 190.00,                                                       │
│    comision_plataforma: 47.50,                                         │
│    estado: 'pendiente',                                                 │
│    codigo_recogida: 'ABCD1234',                                        │
│    stripe_payment_intent_id: 'pi_3QRSTUVWXYZabcdefgh'                 │
│  )                                                                      │
│                                                                         │
│  UPDATE products                                                        │
│  SET stock = stock - 2                                                  │
│  WHERE id = 123                                                         │
│                                                                         │
│  ✅ Orden #5678 creada                                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 14. Confirmación visual
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                📱 FRONTEND: OrderConfirmationScreen                     │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐                       │
│  │  ✅ ¡Compra exitosa!                        │                       │
│  ├─────────────────────────────────────────────┤                       │
│  │  Orden: #5678                               │                       │
│  │  Comercio: Tacos El Paisa                   │                       │
│  │  Producto: Tacos Sorpresa x2                │                       │
│  │  Total pagado: $190.00 MXN                  │                       │
│  │                                             │                       │
│  │  Código de recogida:                        │                       │
│  │  ┌─────────────────────────┐                │                       │
│  │  │     ABCD1234            │                │                       │
│  │  └─────────────────────────┘                │                       │
│  │                                             │                       │
│  │  Recoge hoy de 5:00 PM a 7:00 PM           │                       │
│  └─────────────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 15. FIN ✅
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                          🎉 TRANSACCIÓN COMPLETA                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ✅ Comprador pagó: $190.00 MXN                                        │
│  ✅ Plataforma recibió: $47.50 (25%)                                   │
│  ✅ Comercio recibirá: $142.50 (75%)                                   │
│  ✅ Orden creada: #5678                                                │
│  ✅ Stock actualizado: -2 unidades                                     │
│  ✅ Auditoría registrada en payment_intents                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 💰 FLUJO DEL DINERO

```
MOMENTO 1: CARGO AL COMPRADOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tarjeta del comprador: **** 4242
Balance antes:  $1,000.00
Cargo:           -$190.00
Balance después:  $810.00

MOMENTO 2: STRIPE PROCESA (Inmediato)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total recibido:  $190.00
Stripe fees:       -$5.82 (2.9% + $0.30)
Neto:            $184.18

Split:
├─ Application Fee (25%): $47.50 → Balance Plataforma ✅ (Inmediato)
└─ Transfer (75%):       $142.50 → Pending Transfer al Comercio

MOMENTO 3: PAYOUT AL COMERCIO (Según schedule)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Transfer amount:  $142.50
Comercio recibe:  $142.50 en su cuenta bancaria
(Puede ser: inmediato, diario, semanal, mensual)

BALANCE FINAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Comprador pagó:     $190.00
✅ Stripe cobró:         $5.82 (fees)
✅ Plataforma recibió:  $47.50 (25%)
✅ Comercio recibirá:  $142.50 (75%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total:                $195.82 ✅
(Diferencia de $5.82 son fees de Stripe)
```

---

## 🔄 CASO: IDEMPOTENCIA (Doble Click)

```
Usuario hace DOBLE CLICK en "Pagar ahora":
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REQUEST 1:                           REQUEST 2:
(t = 0ms)                           (t = 50ms)

POST /api/payments/                 POST /api/payments/
  create-payment-intent               create-payment-intent
{                                   {
  productId: 123,                     productId: 123,
  cantidad: 2                         cantidad: 2
}                                   }

Backend genera key:                 Backend genera key:
"pi_789_123_2_1704844800000"      "pi_789_123_2_1704844800000"
                                   (MISMO KEY!)
        ↓                                   ↓
        │                                   │
        └─────────────┬─────────────────────┘
                      ↓
              Stripe API recibe AMBOS
              con el MISMO idempotency_key
                      ↓
              ┌───────────────────┐
              │  Stripe responde: │
              │  "Ya procesé esto"│
              └───────────────────┘
                      ↓
        Retorna el MISMO PaymentIntent
              a AMBOS requests
                      ↓
              ✅ Solo 1 cargo creado
              ❌ NO hay duplicación
```

---

## 🚨 CASO: TARJETA DECLINADA

```
Usuario intenta pagar con tarjeta declinada:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tarjeta: 4000 0000 0000 0002 (siempre declinada)

FRONTEND                    BACKEND                     STRIPE
   │                           │                           │
   │ 1. POST payment-intent    │                           │
   ├──────────────────────────>│                           │
   │                           │ 2. Validaciones OK        │
   │                           │                           │
   │                           │ 3. Create PaymentIntent   │
   │                           ├──────────────────────────>│
   │                           │                           │
   │                           │ 4. PaymentIntent created  │
   │                           │<──────────────────────────┤
   │                           │    (status: requires_     │
   │                           │     payment_method)       │
   │                           │                           │
   │ 5. clientSecret           │                           │
   │<──────────────────────────┤                           │
   │                           │                           │
   │ 6. presentPaymentSheet    │                           │
   │ Usuario ingresa tarjeta   │                           │
   │ 4000 0000 0000 0002       │                           │
   │                           │                           │
   │ 7. Confirmar pago         │                           │
   ├────────────────────────────────────────────────────>│
   │                           │                           │
   │                           │  8. Contactar banco       │
   │                           │     ❌ Declinada          │
   │                           │                           │
   │ 9. Error: card_declined   │                           │
   │<────────────────────────────────────────────────────┤
   │                           │                           │
   │ 10. Mostrar error         │                           │
   │ "Tu tarjeta fue           │                           │
   │  declinada"               │                           │
   │                           │                           │
   └─ Usuario puede intentar   │                           │
      con otra tarjeta         │                           │

RESULTADO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PaymentIntent creado (guardado para auditoría)
❌ NO se cobró al usuario
❌ NO se creó orden
❌ NO se actualizó stock
✅ Usuario puede intentar de nuevo
```

---

## ✅ RESULTADO FINAL

**En Stripe Dashboard:**
```
Payment Intent: pi_3QRSTUVWXYZabcdefgh
├─ Amount: $190.00 MXN
├─ Status: succeeded
├─ Application fee: $47.50 (25%)
├─ Transfer: $142.50 (75%) → acct_1234567890
├─ Customer: cus_ABC123
├─ Payment method: **** 4242
└─ Metadata:
    ├─ product_name: "Tacos Sorpresa"
    ├─ store_name: "Tacos El Paisa"
    ├─ cantidad: "2"
    └─ total: "190.00"
```

**En Base de Datos:**
```sql
-- payment_intents table
SELECT * FROM payment_intents WHERE stripe_payment_intent_id = 'pi_3QRST...';

┌────┬────────────────────────┬─────────┬────────────┬──────────┬────────┬──────────┬───────────────────────┬────────────┬────────────┐
│ id │ stripe_payment_intent_ │ user_id │ product_id │ store_id │ amount │ currency │ application_fee_amount│   status   │ created_at │
├────┼────────────────────────┼─────────┼────────────┼──────────┼────────┼──────────┼───────────────────────┼────────────┼────────────┤
│ 42 │ pi_3QRSTUVWXYZabcdefgh │ 789     │ 123        │ 456      │ 19000  │ mxn      │ 4750                  │ succeeded  │ 2024-01-...│
└────┴────────────────────────┴─────────┴────────────┴──────────┴────────┴──────────┴───────────────────────┴────────────┴────────────┘

-- orders table
SELECT * FROM orders WHERE stripe_payment_intent_id = 'pi_3QRST...';

┌────┬─────────┬──────────┬────────┬─────────────────────┬─────────┬──────────────────┬────────────────────────┐
│ id │ user_id │ store_id │ total  │ comision_plataforma │ estado  │ codigo_recogida  │ stripe_payment_intent_ │
├────┼─────────┼──────────┼────────┼─────────────────────┼─────────┼──────────────────┼────────────────────────┤
│5678│ 789     │ 456      │ 190.00 │ 47.50               │pendiente│ ABCD1234         │ pi_3QRSTUVWXYZabcdefgh │
└────┴─────────┴──────────┴────────┴─────────────────────┴─────────┴──────────────────┴────────────────────────┘
```

**Balance Final:**
```
💰 Plataforma (Delicrunch):
   └─ Application fees: +$47.50 ✅

💵 Comercio (Tacos El Paisa):
   └─ Pending transfer: +$142.50 ✅

🎉 Usuario:
   └─ Orden confirmada: #5678 ✅
```

---

**Última actualización:** 2024-01-10
**Modelo:** Destination Charges (Stripe Connect)
**Split:** 75% Comercio / 25% Plataforma
