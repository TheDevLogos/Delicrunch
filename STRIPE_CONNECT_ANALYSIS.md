# 📊 ANÁLISIS: Sistema de Pagos para Comercios - Stripe Connect

## ✅ ESTADO ACTUAL: 70% IMPLEMENTADO

### 🎯 Lo que YA EXISTE y FUNCIONA

#### 1. **Base de Datos** ✅
**Ubicación:** [Backend/db/schema.sql](Backend/db/schema.sql)

```sql
CREATE TABLE stores (
    -- ... otros campos
    stripe_account_id VARCHAR(255),  -- ✅ Campo para Connected Account
    stripe_onboarding_complete BOOLEAN DEFAULT FALSE,  -- ✅ Estado onboarding
    comision_plataforma DECIMAL(5,2) DEFAULT 25.00,  -- ✅ 25% para Delicrunch
    -- ...
);
```

**Estado:** ✅ **COMPLETO** - BD lista para Stripe Connect

---

#### 2. **Backend Endpoints** ✅ (Parcial)
**Ubicación:** [Backend/controllers/paymentController.js](Backend/controllers/paymentController.js)

**Endpoints existentes:**

1. **`POST /api/payments/create-account-link`** ✅
   - Crea Connected Account (Express)
   - Genera Account Link para onboarding
   - Guarda `stripe_account_id` en BD
   
2. **`GET /api/payments/stripe-account-status`** ✅
   - Verifica estado de cuenta Connect
   - Retorna `chargesEnabled` y `hasStripeAccount`
   
3. **`GET /api/payments/stripe-onboarding-refresh`** ✅
   - Maneja refresh del onboarding

**Lo que FALTA mejorar:**
- ❌ No verifica `payouts_enabled`
- ❌ No verifica `details_submitted`
- ❌ No tiene endpoint para crear Connected Account separado
- ❌ No tiene webhook para `account.updated`

---

#### 3. **Frontend Componentes** ✅ (Básico)
**Ubicación:** [Frontend/components/StripeOnboarding.js](Frontend/components/StripeOnboarding.js)

**Lo que hace:**
- ✅ Verifica estado de cuenta Connect
- ✅ Abre WebBrowser para onboarding
- ✅ Muestra estados (sin cuenta, cuenta incompleta, cuenta activa)

**Integrado en:** [Frontend/app/ProfileScreen.js](Frontend/app/ProfileScreen.js)
- Solo se muestra si el usuario es `comercio`
- Integrado en la sección de perfil

**Pantallas de retorno:**
- [Frontend/app/StripeOnboardingSuccessScreen.js](Frontend/app/StripeOnboardingSuccessScreen.js) ✅
- [Frontend/app/StripeOnboardingErrorScreen.js](Frontend/app/StripeOnboardingErrorScreen.js) ✅

**Lo que FALTA:**
- ❌ No hay pantalla dedicada "Configurar Pagos" con diseño TGTG
- ❌ No muestra información de ganancias/cobros
- ❌ No muestra `payouts_enabled` ni `details_submitted`
- ❌ No tiene acceso rápido desde Dashboard

---

#### 4. **Sistema de Pagos con Connect** ✅
**Ubicación:** [Backend/controllers/paymentController.js](Backend/controllers/paymentController.js) (líneas 126-180)

```javascript
// createPaymentIntent usa Stripe Connect
const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount,
    currency: 'mxn',
    customer: customerId,
    payment_method: paymentMethodId,
    transfer_data: {
        destination: merchantStripeAccountId,  // ✅ Transferencia al comercio
        amount: merchantAmount,  // ✅ 75% al comercio
    },
    application_fee_amount: platformFee,  // ✅ 25% a Delicrunch
    metadata: {
        productId,
        userId,
        merchantAccountId: merchantStripeAccountId,
    },
});
```

**Estado:** ✅ **FUNCIONAL** - Los pagos se dividen correctamente

---

#### 5. **Dashboard de Comercio** ✅ (Sin info de cobros)
**Ubicación:** [Frontend/app/MerchantDashboardScreen.js](Frontend/app/MerchantDashboardScreen.js)

**Métricas mostradas:**
- ✅ Ventas de hoy ($)
- ✅ Pedidos pendientes
- ✅ Pedidos hoy
- ✅ Pedidos completados
- ✅ Calificación promedio

**Lo que FALTA:**
- ❌ No muestra **estado de cuenta Stripe** (charges_enabled, payouts_enabled)
- ❌ No muestra **próximos pagos** (payouts)
- ❌ No muestra **ganancias disponibles**
- ❌ No tiene botón/enlace a "Configurar Pagos"

---

#### 6. **Historial de Pedidos** ✅
**Ubicación:** [Frontend/app/MerchantOrdersScreen.js](Frontend/app/MerchantOrdersScreen.js)

**Muestra:**
- ✅ Lista de pedidos recibidos
- ✅ Estado de cada pedido
- ✅ Total pagado
- ✅ Método de pago (Stripe)

**Lo que FALTA:**
- ❌ No muestra cuánto recibe el comercio (75%)
- ❌ No muestra comisión de plataforma (25%)
- ❌ No muestra `stripe_transfer_id`

---

## 🎯 LO QUE HAY QUE IMPLEMENTAR

### Fase 1: Backend - Endpoints Mejorados ⭐ PRIORITARIO

#### A. Mejorar endpoint de estado
**Archivo:** `Backend/controllers/paymentController.js`

```javascript
// Mejorar getAccountStatus para incluir más información
exports.getAccountStatus = asyncHandler(async (req, res, next) => {
    // ... código existente
    const account = await stripe.accounts.retrieve(stripeAccountId);
    
    res.json({
        hasStripeAccount: true,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,  // ⭐ NUEVO
        detailsSubmitted: account.details_submitted,  // ⭐ NUEVO
        country: account.country,
        defaultCurrency: account.default_currency,
        type: account.type,  // express, standard, custom
    });
});
```

#### B. Nuevo endpoint para crear Connected Account
**Archivo:** `Backend/controllers/paymentController.js`

```javascript
// Separar la creación de cuenta del enlace
exports.createConnectedAccount = asyncHandler(async (req, res, next) => {
    // 1. Verificar rol comercio
    // 2. Verificar si ya tiene cuenta
    // 3. Crear cuenta Express
    // 4. Guardar en BD
    // 5. Retornar ID de cuenta
});
```

#### C. Nuevo endpoint para obtener balance
**Archivo:** `Backend/controllers/paymentController.js`

```javascript
exports.getConnectedAccountBalance = asyncHandler(async (req, res, next) => {
    const { stripe_account_id } = await getStore(req.user.id);
    
    const balance = await stripe.balance.retrieve({
        stripeAccount: stripe_account_id,
    });
    
    res.json({
        available: balance.available,  // Fondos disponibles
        pending: balance.pending,  // Fondos pendientes
        currency: 'mxn',
    });
});
```

#### D. Nuevo endpoint para próximos pagos
**Archivo:** `Backend/controllers/paymentController.js`

```javascript
exports.getUpcomingPayouts = asyncHandler(async (req, res, next) => {
    const { stripe_account_id } = await getStore(req.user.id);
    
    const payouts = await stripe.payouts.list(
        { limit: 10 },
        { stripeAccount: stripe_account_id }
    );
    
    res.json({ payouts: payouts.data });
});
```

---

### Fase 2: Frontend - Pantalla "Configurar Pagos" ⭐ PRIORITARIO

#### Crear nueva pantalla dedicada
**Archivo:** `Frontend/app/MerchantPaymentSettingsScreen.js` (NUEVO)

**Diseño inspirado en TGTG:**

```
┌─────────────────────────────────────┐
│  🏦 Configuración de Pagos          │
├─────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐ │
│  │ Estado de tu cuenta             │ │
│  │                                 │ │
│  │ ✅ Cuenta activa                │ │
│  │ ✅ Puede recibir pagos          │ │
│  │ ✅ Puede recibir transferencias │ │
│  │                                 │ │
│  │ Tipo: Express                   │ │
│  │ País: México                    │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ 💰 Balance                      │ │
│  │                                 │ │
│  │ Disponible:  $1,250.00 MXN     │ │
│  │ Pendiente:    $350.00 MXN      │ │
│  │                                 │ │
│  │ [Ver próximos pagos →]          │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ 📊 Comisiones                   │ │
│  │                                 │ │
│  │ Comercio recibe:     75%       │ │
│  │ Plataforma cobra:    25%       │ │
│  └────────────────────────────────┘ │
│                                      │
│  [🔧 Gestionar cuenta en Stripe]    │
│  [📄 Ver historial de pagos]        │
│                                      │
└─────────────────────────────────────┘
```

**Características:**
- ✅ Muestra estado completo (charges, payouts, details)
- ✅ Muestra balance disponible y pendiente
- ✅ Lista próximos pagos automáticos
- ✅ Botón para abrir Stripe Dashboard
- ✅ Botón para re-onboarding si falta info
- ✅ Diseño consistente con TGTG

---

### Fase 3: Integración en Dashboard ⭐ PRIORITARIO

#### Modificar MerchantDashboardScreen
**Archivo:** `Frontend/app/MerchantDashboardScreen.js`

**Agregar:**

1. **Card de estado de pagos** en Hero Section:
```jsx
{!stripeConnected && (
  <TouchableOpacity 
    style={styles.stripeWarning}
    onPress={() => navigation.navigate('PaymentSettings')}
  >
    <Ionicons name="warning" size={20} color="#FF9500" />
    <Text style={styles.stripeWarningText}>
      Configura tu cuenta para recibir pagos
    </Text>
  </TouchableOpacity>
)}
```

2. **Sección de ganancias** en métricas:
```jsx
<View style={styles.metricsGrid}>
  <MetricCard
    icon="cash"
    value={`$${formatPrice(balance.available)}`}
    label="Disponible"
    color={COLORS.success}
  />
  <MetricCard
    icon="time"
    value={`$${formatPrice(balance.pending)}`}
    label="Pendiente"
    color={COLORS.warning}
  />
</View>
```

3. **Acción rápida** en Quick Actions:
```jsx
<TouchableOpacity 
  style={styles.quickAction}
  onPress={() => navigation.navigate('PaymentSettings')}
>
  <View style={[styles.quickActionIcon, { backgroundColor: '#5856D6' }]}>
    <Ionicons name="card" size={22} color={COLORS.white} />
  </View>
  <Text style={styles.quickActionText}>Pagos</Text>
</TouchableOpacity>
```

---

### Fase 4: Webhooks (Opcional pero Recomendado)

#### Webhook para account.updated
**Archivo:** `Backend/controllers/webhookController.js` (NUEVO)

```javascript
exports.handleStripeWebhook = asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    if (event.type === 'account.updated') {
        const account = event.data.object;
        
        // Actualizar BD
        await pool.query(
            'UPDATE stores SET stripe_onboarding_complete = $1 WHERE stripe_account_id = $2',
            [account.charges_enabled && account.payouts_enabled, account.id]
        );
    }
    
    res.json({ received: true });
});
```

---

## 📋 RESUMEN DE TAREAS

### Backend (3 endpoints + 1 webhook)
- [ ] **Mejorar** `getAccountStatus` → incluir `payouts_enabled`, `details_submitted`
- [ ] **Crear** `getConnectedAccountBalance` → balance disponible/pendiente
- [ ] **Crear** `getUpcomingPayouts` → lista próximos pagos
- [ ] **Crear** webhook `account.updated` (opcional)

### Frontend (1 pantalla + mejoras)
- [ ] **Crear** `MerchantPaymentSettingsScreen` → pantalla dedicada
- [ ] **Mejorar** `MerchantDashboardScreen` → agregar info de pagos
- [ ] **Mejorar** `StripeOnboarding` → mostrar más estados
- [ ] **Agregar** ruta en `AppNavigator` → PaymentSettings

### Testing
- [ ] Probar onboarding completo
- [ ] Verificar estados (charges, payouts, details)
- [ ] Verificar balance y payouts
- [ ] Probar pago con Connected Account

---

## ✅ VALIDACIÓN

### Escenarios de prueba:

1. **Comercio nuevo (sin cuenta)**
   - Ver warning en Dashboard
   - Ir a "Configurar Pagos"
   - Completar onboarding
   - Ver estado activo

2. **Comercio con cuenta activa**
   - Ver balance disponible
   - Ver próximos pagos
   - Gestionar cuenta en Stripe

3. **Comercio con cuenta incompleta**
   - Ver warning
   - Continuar onboarding
   - Completar información faltante

---

## 🎨 DISEÑO CONSISTENTE CON TGTG

**Paleta de colores:**
- Primary: `#036B52` (verde TGTG)
- Success: `#10B981` (verde éxito)
- Warning: `#F59E0B` (naranja advertencia)
- Info: `#3B82F6` (azul info)

**Componentes:**
- Cards con sombras suaves
- Iconos Ionicons
- LinearGradient en headers
- Pull-to-refresh
- Loading states

