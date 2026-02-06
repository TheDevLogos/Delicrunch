# 🎉 Mercado Pago Checkout Pro - Configuración Completa

## ✅ Estado de la Integración: COMPLETADO

### 📱 Configuración para Expo Go

La aplicación **Delicrunch** está completamente integrada con **Mercado Pago Checkout Pro** y funciona con **Expo Go** en React Native.

---

## 🔑 Credenciales de Prueba Configuradas

### Credenciales de API
```
Public Key: APP_USR-375e7726-8315-48ad-9a60-e31973e44ffa
Access Token: APP_USR-7758657589560258-012213-ab05386993b304ffec8f442dd78d7b68-3151906188
```

### Usuarios de Prueba Mercado Pago

**Comprador (Buyer Test User)**
- User ID: 3151908190
- Usuario: TESTUSER8268169652182573271
- Contraseña: Cg60edplef

**Vendedor (Seller)**
- User ID: 3151906188
- Usuario: TESTUSER629845597039228278
- Contraseña: q54PAVQxwZ

### Tarjeta de Prueba
```
Número: 5474 9254 3267 0366
Tipo: Mastercard
CVV: 123
Fecha de Vencimiento: 11/30
```

---

## 🏗️ Arquitectura de la Integración

### Frontend (React Native + Expo Go)

#### Archivos Principales

1. **PaymentScreen.js** (`Frontend/app/PaymentScreen.js`)
   - Pantalla principal de checkout
   - Usa `expo-web-browser` para abrir Checkout Pro
   - Maneja cupones de descuento
   - Cálculo de comisiones (75% comercio, 25% plataforma)

2. **mercadoPagoService.js** (`Frontend/services/mercadoPagoService.js`)
   - Servicio para comunicarse con el backend
   - `createPaymentPreference()` - Crea preferencia de pago
   - `getPaymentStatus()` - Consulta estado de pago
   - `setupMerchantAccount()` - Configura cuenta de comercio

3. **MerchantPaymentSettingsScreen.js** (`Frontend/app/MerchantPaymentSettingsScreen.js`)
   - Configuración de cuenta Mercado Pago para comercios
   - Vinculación por email (sin OAuth)
   - Visualización de balance y pagos

#### Dependencias Clave
```json
{
  "expo-web-browser": "~15.0.10",
  "expo-linking": "~7.0.3"
}
```

### Backend (Node.js + Express)

#### Archivos Principales

1. **paymentController.js** (`Backend/controllers/paymentController.js`)
   - SDK de Mercado Pago v2.0.15
   - `createPreference()` - Crea preferencia con split de pagos
   - `handleWebhook()` - Procesa notificaciones IPN
   - `paymentCallback()` - Maneja redirecciones desde MP
   - `merchantSetup()` - Configura cuenta de comercio

2. **paymentRoutes.js** (`Backend/routes/paymentRoutes.js`)
   ```
   POST /api/payments/create-preference    - Crear preferencia
   POST /api/payments/webhook               - Webhook IPN
   GET  /api/payments/status/:paymentId     - Estado de pago
   GET  /api/payments/callback/:status      - Callbacks de redirección
   POST /api/payments/merchant-setup        - Configurar comercio
   GET  /api/payments/merchant-status       - Estado de comercio
   ```

3. **Base de Datos (PostgreSQL)**
   - Tabla: `payment_preferences` - Auditoría de preferencias
   - Columnas en `stores`:
     - `mercadopago_email`
     - `mercadopago_configured`
     - `mercadopago_collector_id`
   - Columnas en `orders`:
     - `mercadopago_preference_id`
     - `mercadopago_payment_id`

---

## 🔄 Flujo de Pago Completo

### 1. Comprador Selecciona Producto
```javascript
// PaymentScreen.js
const initializePayment = async () => {
  // Crear preferencia de pago
  const preference = await createPaymentPreference({
    productId: product.id,
    cantidad: quantity,
    coupon_discount: couponDiscount,
  });
  
  // Abrir Checkout Pro en navegador
  const checkoutUrl = preference.sandboxInitPoint; // Para pruebas
  await WebBrowser.openBrowserAsync(checkoutUrl);
};
```

### 2. Backend Crea Preferencia
```javascript
// Backend: paymentController.js
exports.createPreference = async (req, res) => {
  const { productId, cantidad, coupon_discount } = req.body;
  
  // Calcular split de pagos
  const platformFeeAmount = totalAfterCoupon * 0.25; // 25%
  const merchantAmount = totalAfterCoupon * 0.75;    // 75%
  
  // Crear preferencia en Mercado Pago
  const preference = await preferenceClient.create({
    items: [...],
    back_urls: {
      success: `${backendUrl}/api/payments/callback/success`,
      failure: `${backendUrl}/api/payments/callback/failure`,
      pending: `${backendUrl}/api/payments/callback/pending`,
    },
    marketplace_fee: platformFeeAmount,
  });
  
  res.json({
    preferenceId: preference.id,
    initPoint: preference.init_point,
    sandboxInitPoint: preference.sandbox_init_point,
  });
};
```

### 3. Usuario Paga en Mercado Pago
- Se abre la página de Mercado Pago
- Usuario ingresa datos de tarjeta de prueba
- Mercado Pago procesa el pago

### 4. Mercado Pago Redirige
```javascript
// Backend: paymentCallback()
exports.paymentCallback = async (req, res) => {
  const { payment_id, status, collection_status } = req.query;
  
  // Renderizar HTML con deep link a la app
  const deepLink = `delicrunch://payment-result?status=${status}&payment_id=${payment_id}`;
  
  res.send(`
    <html>
      <script>
        setTimeout(() => {
          window.location.href = "${deepLink}";
        }, 1000);
      </script>
      <h1>Pago ${status === 'success' ? 'Exitoso' : 'Fallido'}</h1>
    </html>
  `);
};
```

### 5. Webhook IPN (Asíncrono)
```javascript
// Backend: handleWebhook()
exports.handleWebhook = async (req, res) => {
  const { type, data } = req.body;
  
  if (type === 'payment') {
    const payment = await paymentClient.get({ id: data.id });
    
    // Actualizar orden en la base de datos
    await pool.query(
      'UPDATE orders SET estado = $1 WHERE mercadopago_payment_id = $2',
      [payment.status, payment.id]
    );
  }
  
  res.status(200).send('OK');
};
```

---

## 🧪 Pruebas Realizadas

### Backend ✅
```bash
# Crear preferencia de pago
curl -X POST http://localhost:5001/api/payments/create-preference \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"cantidad":1}'

# Respuesta exitosa:
{
  "preferenceId": "3151906188-xxxxx",
  "initPoint": "https://www.mercadopago.com.mx/checkout/...",
  "sandboxInitPoint": "https://sandbox.mercadopago.com.mx/checkout/...",
  "amount": 60,
  "merchantAmount": 45,
  "platformFee": 15
}

# Configurar comercio
curl -X POST http://localhost:5001/api/payments/merchant-setup \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"mercadopago_email":"comercio@demo.com"}'

# Estado de comercio
curl http://localhost:5001/api/payments/merchant-status \
  -H "Authorization: Bearer <token>"
```

### Frontend ✅
- ✅ Expo bundle compilado correctamente (29898ms, 1225 módulos)
- ✅ Sin errores de sintaxis
- ✅ expo-web-browser instalado y configurado
- ✅ expo-linking instalado para deep links
- ✅ Notificaciones push con manejo de errores (no rompe la app)

---

## 🚀 Cómo Probar en Expo Go

### 1. Iniciar Backend
```bash
cd /workspaces/Delicrunch/Backend
node server.js
# Servidor corriendo en puerto 5001
```

### 2. Iniciar Expo
```bash
cd /workspaces/Delicrunch/Frontend
npx expo start --tunnel
# Escanea el QR code con Expo Go
```

### 3. Flujo de Prueba

1. **Registrar/Iniciar sesión** como comprador
2. **Buscar productos** disponibles
3. **Seleccionar un producto** y cantidad
4. **Aplicar cupón** (opcional)
5. **Presionar "Pagar con Mercado Pago"**
6. Se abre el navegador con Checkout Pro
7. **Ingresar datos de tarjeta de prueba**:
   - Número: 5474 9254 3267 0366
   - CVV: 123
   - Fecha: 11/30
8. **Confirmar pago**
9. Mercado Pago procesa y redirige
10. La app muestra confirmación

### 4. Probar como Comercio

1. **Iniciar sesión** como comercio
2. Ir a **"Configuración de Pagos"**
3. **Vincular cuenta** con email de Mercado Pago
4. Ver **balance** y **historial de pagos**

---

## 📝 Variables de Entorno

### Backend (.env)
```env
MERCADOPAGO_PUBLIC_KEY=APP_USR-375e7726-8315-48ad-9a60-e31973e44ffa
MERCADOPAGO_ACCESS_TOKEN=APP_USR-7758657589560258-012213-ab05386993b304ffec8f442dd78d7b68-3151906188
BACKEND_URL=https://silver-telegram-7vx44jrgxxqrhrw79-5001.app.github.dev
APP_SCHEME=delicrunch
```

### Frontend (.env)
```env
EXPO_PUBLIC_API_URL=https://silver-telegram-7vx44jrgxxqrhrw79-5001.app.github.dev
EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-375e7726-8315-48ad-9a60-e31973e44ffa
```

---

## 🔐 Configuración de Webhooks en Mercado Pago

### En el Panel de Mercado Pago:
1. Ir a **Tus integraciones** → **Webhooks**
2. Agregar URL: `https://tu-dominio.com/api/payments/webhook`
3. Seleccionar eventos:
   - ✅ Pagos
   - ✅ Devoluciones
4. Guardar configuración

---

## 📚 Referencias de Documentación

- [Crear Preferencia de Pago](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/create-payment-preference)
- [Integración con React Native Expo Go](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/mobile-integration/react-native-expo-go)
- [SDK de Mercado Pago Node.js](https://www.mercadopago.com.mx/developers/es/docs/sdks-library/server-side/nodejs)
- [Webhooks IPN](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/additional-content/your-integrations/notifications/webhooks)

---

## 🎯 Próximos Pasos Recomendados

### Para Producción:

1. **Obtener credenciales de producción** en el panel de Mercado Pago
2. **Actualizar variables de entorno**:
   ```env
   MERCADOPAGO_PUBLIC_KEY=APP_USR-<prod-key>
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-<prod-token>
   BACKEND_URL=https://api.delicrunch.com
   ```
3. **Configurar webhooks** apuntando a URL pública
4. **Probar flujo completo** en ambiente de producción
5. **Configurar certificados SSL** para el backend
6. **Implementar logging robusto** para pagos

### Para Mejorar la Experiencia:

1. **Deep linking mejorado** para retorno desde MP
2. **Pantalla de espera** mientras se procesa el pago
3. **Notificaciones push** cuando se confirma el pago
4. **Historial de pagos** en el perfil del usuario
5. **Reintento automático** para pagos fallidos

---

## ✅ Checklist de Migración Completada

- [x] SDK de Mercado Pago instalado en Backend
- [x] Controlador de pagos reescrito
- [x] Rutas de API actualizadas
- [x] Base de datos migrada con columnas de MP
- [x] Variables de entorno configuradas
- [x] Frontend actualizado con expo-web-browser
- [x] Servicio de Mercado Pago creado
- [x] Pantalla de pago reescrita
- [x] Pantalla de configuración de comercio actualizada
- [x] Dependencias de Stripe eliminadas
- [x] App.json limpiado (sin plugins de Stripe)
- [x] Notificaciones con manejo de errores
- [x] Expo bundle compilando correctamente
- [x] Pruebas de endpoints exitosas
- [x] Documentación completa creada

---

**🎉 ¡La migración a Mercado Pago está COMPLETA y funcional con Expo Go!**
