# Diagrama de Flujo - Gestión de Pagos

## 📱 Flujo de Navegación por Rol

```
┌─────────────────────────────────────────────────────────────────┐
│                       ProfileScreen                              │
│                                                                   │
│  👤 Usuario: [Comprador / Comercio / Admin]                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────┴─────────────────────┐
        │                                             │
        ▼                                             ▼
┌──────────────────┐                        ┌──────────────────┐
│   COMPRADOR      │                        │    COMERCIO      │
└──────────────────┘                        └──────────────────┘
        │                                             │
        │  "Métodos de Pago"                         │  "Cuentas para Cobrar"
        ▼                                             ▼
┌──────────────────┐                        ┌──────────────────┐
│ ManageCards      │                        │ MerchantPayment  │
│ Screen           │                        │ SettingsScreen   │
└──────────────────┘                        └──────────────────┘
        │                                             │
        ├─ Ver tarjetas guardadas                    ├─ Ver estado cuenta Stripe
        ├─ Agregar nueva tarjeta                     ├─ Configurar Stripe Connect
        ├─ Establecer predeterminada                 ├─ Ver balance disponible
        └─ Eliminar tarjeta                          └─ Ver próximos pagos
        │
        ▼
┌──────────────────┐
│ SaveCardScreen   │
│ (Agregar tarjeta)│
└──────────────────┘
        │
        ▼
┌──────────────────┐
│ PaymentScreen    │
│ (Comprar pack)   │
└──────────────────┘
        │
        ├─ Ver tarjetas guardadas
        ├─ Seleccionar tarjeta
        └─ Agregar nueva al pagar



┌──────────────────┐
│      ADMIN       │
│   (Rol Dual)     │
└──────────────────┘
        │
        ├─────────────────────┬─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Mis Pedidos  │    │ Mis Reseñas  │    │ Métodos de   │
│              │    │              │    │ Pago         │
└──────────────┘    └──────────────┘    └──────────────┘
                                                │
                                                ▼
                                        ┌──────────────┐
                                        │ ManageCards  │
                                        │ Screen       │
                                        └──────────────┘
        │
        └─────────────────────┐
                              ▼
                      ┌──────────────┐
                      │ Cuentas para │
                      │ Cobrar       │
                      └──────────────┘
                              │
                              ▼
                      ┌──────────────┐
                      │ MerchantPay- │
                      │ mentSettings │
                      └──────────────┘
```

---

## 🔄 Flujo de Datos Backend

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENDPOINTS DE PAGOS                            │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ GESTIÓN DE TARJETAS (Compradores & Admin)                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  POST /api/payments/customer-session                             │
│  ├─ Crea Customer en Stripe                                      │
│  ├─ Genera Ephemeral Key                                         │
│  ├─ Crea SetupIntent                                             │
│  └─ Guarda stripe_customer_id en profiles                        │
│                                                                   │
│  GET /api/payments/stripe-cards/:customerId                      │
│  ├─ Obtiene payment methods de Stripe                            │
│  └─ Lista tarjetas guardadas                                     │
│                                                                   │
│  PUT /api/payments/set-default-payment-method                    │
│  ├─ Actualiza default en Stripe Customer                         │
│  └─ Actualiza default_payment_method_id en profiles              │
│                                                                   │
│  POST /api/payments/sync-cards                                   │
│  ├─ Sincroniza Stripe → BD local                                 │
│  └─ Actualiza metadatos en saved_cards                           │
│                                                                   │
│  DELETE /api/payments/payment-methods/:paymentMethodId           │
│  ├─ Elimina de Stripe                                            │
│  └─ Elimina de BD local                                          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ STRIPE CONNECT (Comercios & Admin)                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  POST /api/payments/create-account-link                          │
│  ├─ if (comercio): Busca en stores                               │
│  ├─ if (admin): Busca en profiles                                │
│  ├─ Crea Account en Stripe si no existe                          │
│  └─ Genera AccountLink para onboarding                           │
│                                                                   │
│  GET /api/payments/stripe-account-status                         │
│  ├─ if (comercio): Consulta stores.stripe_account_id             │
│  ├─ if (admin): Consulta profiles.stripe_account_id              │
│  └─ Retorna estado de cuenta Stripe                              │
│                                                                   │
│  GET /api/payments/connected-account-balance                     │
│  ├─ if (comercio): Usa stores.stripe_account_id                  │
│  ├─ if (admin): Usa profiles.stripe_account_id                   │
│  └─ Retorna balance disponible y pendiente                       │
│                                                                   │
│  GET /api/payments/upcoming-payouts                              │
│  ├─ if (comercio): Usa stores.stripe_account_id                  │
│  ├─ if (admin): Usa profiles.stripe_account_id                   │
│  └─ Lista próximos pagos                                         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Estructura de Base de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                         TABLAS                                   │
└─────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════╗
║                         PROFILES                               ║
╠═══════════════════════════════════════════════════════════════╣
║ id                          SERIAL PRIMARY KEY                 ║
║ user_id                     INTEGER REFERENCES users           ║
║ nombre                      VARCHAR(255)                       ║
║ email                       VARCHAR(255)                       ║
║ ...                                                            ║
║ ┌───────────────────────────────────────────────────────────┐ ║
║ │ STRIPE CUSTOMER (Comprador/Admin)                         │ ║
║ ├───────────────────────────────────────────────────────────┤ ║
║ │ stripe_customer_id       VARCHAR(255)  ← Tarjetas        │ ║
║ │ default_payment_method_id VARCHAR(255)  ← Predeterminada │ ║
║ └───────────────────────────────────────────────────────────┘ ║
║ ┌───────────────────────────────────────────────────────────┐ ║
║ │ STRIPE CONNECT (Admin solamente)                          │ ║
║ ├───────────────────────────────────────────────────────────┤ ║
║ │ stripe_account_id        VARCHAR(255)  ← Cobros          │ ║
║ │ stripe_onboarding_complete BOOLEAN     ← Estado          │ ║
║ └───────────────────────────────────────────────────────────┘ ║
╚═══════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════╗
║                          STORES                                ║
╠═══════════════════════════════════════════════════════════════╣
║ id                          SERIAL PRIMARY KEY                 ║
║ user_id                     INTEGER REFERENCES users           ║
║ nombre_comercio             VARCHAR(255)                       ║
║ ...                                                            ║
║ ┌───────────────────────────────────────────────────────────┐ ║
║ │ STRIPE CONNECT (Comercio solamente)                       │ ║
║ ├───────────────────────────────────────────────────────────┤ ║
║ │ stripe_account_id        VARCHAR(255)  ← Cobros          │ ║
║ │ stripe_onboarding_complete BOOLEAN     ← Estado          │ ║
║ └───────────────────────────────────────────────────────────┘ ║
╚═══════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════╗
║                      SAVED_CARDS                               ║
╠═══════════════════════════════════════════════════════════════╣
║ id                          SERIAL PRIMARY KEY                 ║
║ user_id                     INTEGER REFERENCES users           ║
║ stripe_payment_method_id    VARCHAR(255)  ← ID de Stripe      ║
║ brand                       VARCHAR(50)   ← visa, mastercard  ║
║ last4                       VARCHAR(4)    ← Últimos 4 dígitos ║
║ exp_month                   INTEGER       ← Mes vencimiento   ║
║ exp_year                    INTEGER       ← Año vencimiento   ║
║ is_default                  BOOLEAN       ← Predeterminada    ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 🎭 Roles y Permisos

```
┌─────────────────────────────────────────────────────────────────┐
│                    MATRIZ DE PERMISOS                            │
└─────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════╗
║  Funcionalidad             │ Comprador │ Comercio │ Admin    ║
╠════════════════════════════╪═══════════╪══════════╪══════════╣
║ Gestionar tarjetas         │     ✅    │    ❌    │    ✅    ║
║ Guardar métodos de pago    │     ✅    │    ❌    │    ✅    ║
║ Ver tarjetas guardadas     │     ✅    │    ❌    │    ✅    ║
║ Usar tarjetas en compras   │     ✅    │    ❌    │    ✅    ║
║ ───────────────────────────┼───────────┼──────────┼──────────║
║ Configurar Stripe Connect  │     ❌    │    ✅    │    ✅    ║
║ Ver balance de cuenta      │     ❌    │    ✅    │    ✅    ║
║ Ver próximos pagos         │     ❌    │    ✅    │    ✅    ║
║ Recibir transferencias     │     ❌    │    ✅    │    ✅    ║
╚═══════════════════════════════════════════════════════════════╝

LEYENDA:
✅ = Permitido
❌ = No permitido
```

---

## 🔐 Flujo de Seguridad

```
┌─────────────────────────────────────────────────────────────────┐
│              VALIDACIÓN DE PERMISOS - BACKEND                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  1. Usuario hace request                                         │
│     ↓                                                            │
│  2. authMiddleware verifica token JWT                            │
│     ↓                                                            │
│  3. Extrae req.user { id, email, rol }                           │
│     ↓                                                            │
│  4. Controller verifica rol:                                     │
│     ├─ if (rol !== 'comprador' && rol !== 'admin')              │
│     │    └─ return 403 (Tarjetas)                                │
│     │                                                            │
│     └─ if (rol !== 'comercio' && rol !== 'admin')               │
│          └─ return 403 (Stripe Connect)                          │
│     ↓                                                            │
│  5. Verifica ownership de recursos:                              │
│     ├─ if (comercio): Busca stores.user_id = req.user.id        │
│     ├─ if (admin): Busca profiles.user_id = req.user.id         │
│     └─ if (comprador): Busca profiles.user_id = req.user.id     │
│     ↓                                                            │
│  6. Ejecuta acción en Stripe                                     │
│     ↓                                                            │
│  7. Actualiza BD local                                           │
│     ↓                                                            │
│  8. Retorna respuesta al cliente                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Flujo de Pago Completo

```
┌─────────────────────────────────────────────────────────────────┐
│           FLUJO DE PAGO CON TARJETAS GUARDADAS                   │
└─────────────────────────────────────────────────────────────────┘

1. Usuario va a PaymentScreen
   │
   ├─ isExpoGo? → Usa billetera demo
   │              └─ Crea orden directamente
   │
   └─ isDevelopmentBuild → Usa Stripe real
      │
      ├─ checkSavedCards()
      │  ├─ POST /api/payments/customer-session
      │  │  └─ Crea/obtiene Customer en Stripe
      │  │
      │  ├─ getStripeCustomerCards(customerId)
      │  │  └─ Lista payment methods guardados
      │  │
      │  └─ Muestra tarjetas en UI
      │
      ├─ Usuario selecciona tarjeta guardada o agrega nueva
      │
      ├─ handlePurchase()
      │  ├─ POST /api/payments/create-payment-intent
      │  │  ├─ Crea PaymentIntent con monto
      │  │  ├─ Asocia customer (tarjetas disponibles)
      │  │  └─ Retorna clientSecret
      │  │
      │  ├─ initPaymentSheet({ customerId, clientSecret })
      │  │  └─ Stripe muestra tarjetas guardadas
      │  │
      │  ├─ presentPaymentSheet()
      │  │  └─ Usuario confirma/paga
      │  │
      │  └─ onPaymentSuccess()
      │     ├─ POST /api/orders (crear orden)
      │     ├─ Marcar cupón como usado (si aplica)
      │     └─ Navigate('OrderConfirmation')
      │
      └─ checkSavedCards() again
         └─ Sincroniza si se agregó nueva tarjeta
```

---

**Fecha:** 16 de enero de 2026  
**Versión:** 1.0  
**Estado:** ✅ Implementado y funcionando
