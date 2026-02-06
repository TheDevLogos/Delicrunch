# Migración de Stripe a Mercado Pago - Delicrunch

## 📅 Fecha: Enero 2025

## 🎯 Resumen
Se completó la migración completa del sistema de pagos de **Stripe** a **Mercado Pago Checkout Pro** en modo Marketplace.

## ✅ Cambios Realizados

### Backend

#### 1. Controlador de Pagos (`Backend/controllers/paymentController.js`)
- **Eliminado**: Integración completa con Stripe SDK
- **Agregado**: Integración con Mercado Pago SDK v2.0.15
  - `MercadoPagoConfig` - Configuración del cliente
  - `Preference` - Creación de preferencias de pago
  - `Payment` - Consulta de pagos

#### 2. Rutas de Pago (`Backend/routes/paymentRoutes.js`)
- `POST /api/payments/create-preference` - Crear preferencia de Checkout Pro
- `POST /api/payments/webhook` - Webhook para notificaciones IPN
- `GET /api/payments/status/:paymentId` - Consultar estado de pago
- `GET /api/payments/callback/:status` - Callbacks para redirección desde MP
- `POST /api/payments/merchant-setup` - Configurar cuenta de comercio
- `GET /api/payments/merchant-status` - Estado de configuración
- `GET /api/payments/merchant-balance` - Balance del comercio
- `GET /api/payments/merchant-payouts` - Historial de pagos

#### 3. Dependencias (`Backend/package.json`)
```diff
- "stripe": "^19.2.0"
+ "mercadopago": "^2.0.15"
```

#### 4. Variables de Entorno (`Backend/.env`)
```diff
- STRIPE_SECRET_KEY=...
- STRIPE_PUBLISHABLE_KEY=...
+ MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxx
+ MERCADOPAGO_PUBLIC_KEY=APP_USR-xxx
```

#### 5. Base de Datos (Migraciones)
- Nueva tabla: `payment_preferences`
- Nuevas columnas en `stores`:
  - `mercadopago_email`
  - `mercadopago_configured`
  - `mercadopago_collector_id`
- Nuevas columnas en `orders`:
  - `mercadopago_preference_id`
  - `mercadopago_payment_id`

### Frontend

#### 1. Pantallas Actualizadas
- **PaymentScreen.js** - Checkout con Mercado Pago WebBrowser
- **MerchantPaymentSettingsScreen.js** - Configuración de MP para comercios
- **PaymentSuccessScreen.js** - Nueva pantalla de pago exitoso
- **PaymentErrorScreen.js** - Nueva pantalla de pago fallido

#### 2. Pantallas Eliminadas
- `SaveCardScreen.js` (funcionalidad nativa de Stripe)
- `StripeOnboardingSuccessScreen.js`
- `StripeOnboardingErrorScreen.js`

#### 3. Servicios
- **Eliminado**: `stripeCustomerService.js`
- **Agregado**: `mercadoPagoService.js`

#### 4. Dependencias (`Frontend/package.json`)
```diff
- "@stripe/stripe-react-native": "0.50.3"
- "react-native-worklets": "*"
- "react-native-worklets-core": "^1.0.0"
```

#### 5. App.js
- **Eliminado**: `StripeProvider` wrapper
- **Eliminado**: imports de Stripe

#### 6. Navegación (`AppNavigator.js`)
- Actualizado imports para nuevas pantallas
- Removido SaveCardScreen
- Agregados PaymentSuccess y PaymentError

## 🔧 Endpoints API

### Comprador (Buyer)
```
POST /api/payments/create-preference
Body: { productId: 1, cantidad: 1, coupon_discount: 0 }
Response: { preferenceId, initPoint, sandboxInitPoint, amount, merchantAmount, platformFee }
```

### Comercio (Merchant)
```
POST /api/payments/merchant-setup
Body: { mercadopago_email: "correo@comercio.com" }

GET /api/payments/merchant-status
Response: { hasMercadoPagoAccount, mercadopagoEmail, chargesEnabled, ... }

GET /api/payments/merchant-balance
GET /api/payments/merchant-payouts
```

### Webhook (IPN)
```
POST /api/payments/webhook
```

## 💳 Flujo de Pago

1. **Comprador** selecciona producto y cantidad
2. **Frontend** llama a `create-preference` con productId
3. **Backend** crea preferencia en Mercado Pago con split de comisiones
4. **Frontend** abre `initPoint` en WebBrowser
5. **Comprador** completa pago en Mercado Pago
6. **Mercado Pago** redirige a callback del Backend
7. **Backend** renderiza HTML que abre deep link a la app
8. **Frontend** muestra PaymentSuccessScreen o PaymentErrorScreen
9. **Mercado Pago** envía notificación IPN al webhook
10. **Backend** actualiza orden y transfiere al comercio

## 🧪 Pruebas Realizadas

### Backend
- ✅ `POST /api/payments/create-preference` - Crea preferencia correctamente
- ✅ `POST /api/payments/merchant-setup` - Configura email de MP
- ✅ `GET /api/payments/merchant-status` - Retorna estado de configuración

### Frontend
- ✅ Sin errores de sintaxis en PaymentScreen.js
- ✅ Sin errores de sintaxis en MerchantPaymentSettingsScreen.js
- ✅ Sin errores de sintaxis en mercadoPagoService.js
- ✅ Sin errores de sintaxis en AppNavigator.js
- ✅ Dependencias de Stripe eliminadas

## 📱 Credenciales de Mercado Pago (Sandbox)
```
PUBLIC_KEY: APP_USR-375e7726-8315-48ad-9a60-e31973e44ffa
ACCESS_TOKEN: APP_USR-7758657589560258-012213-ab05386993b304ffec8f442dd78d7b68-3151906188
```

## 🚀 Próximos Pasos

1. Configurar webhooks en el panel de Mercado Pago
2. Probar flujo completo en dispositivo físico
3. Obtener credenciales de producción
4. Configurar URLs de producción en .env

## 📝 Notas

- Mercado Pago Checkout Pro funciona mediante redirección a su página de pago
- No se requiere SDK nativo en el cliente (a diferencia de Stripe)
- El split de pagos (marketplace) se configura mediante `marketplace_fee`
- Los comercios solo necesitan vincular su email de Mercado Pago
