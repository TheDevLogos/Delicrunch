# Guía de Integración de Pagos con Stripe - PaymentScreen

## 📋 Resumen de Integración

Se ha completado la integración del flujo completo de pagos con Stripe en `PaymentScreen`, permitiendo a los usuarios:

1. ✅ Ver y seleccionar tarjetas guardadas en Stripe
2. ✅ Realizar pagos con tarjetas guardadas o nuevas
3. ✅ Guardar nuevas tarjetas durante el proceso de pago
4. ✅ Validar todo el flujo de principio a fin

---

## 🔄 Flujo de Pago Completo

### 1. **Carga Inicial de Tarjetas**
```javascript
// Al cargar PaymentScreen en Development Build
useEffect(() => {
  if (!isExpoGo) {
    checkSavedCards(); // Obtiene tarjetas guardadas de Stripe
  }
}, []);
```

**Proceso:**
- Se crea/obtiene un Customer Session con `createCustomerSession()`
- Se obtienen las tarjetas guardadas del customer con `getStripeCustomerCards(customerId)`
- Se muestran las tarjetas disponibles en la UI
- Se preselecciona la primera tarjeta automáticamente

### 2. **Visualización de Tarjetas Guardadas**
```javascript
// Las tarjetas se muestran con:
- Brand (Visa, Mastercard, etc.)
- Últimos 4 dígitos
- Fecha de expiración
- Indicador de selección (checkmark)
```

### 3. **Selección de Tarjeta**
```javascript
// El usuario puede:
1. Seleccionar cualquier tarjeta guardada (tap en la tarjeta)
2. Agregar una nueva tarjeta (botón "Agregar nueva tarjeta")
3. Refrescar la lista (pull to refresh)
```

### 4. **Proceso de Pago**

#### Paso 1: Obtener Customer Session
```javascript
const { customerId, ephemeralKeySecret, setupIntentClientSecret } = 
  await createCustomerSession();
```

#### Paso 2: Crear Payment Intent
```javascript
const response = await api.post('/payments/create-payment-intent', {
  productId: product.id,
  cantidad: quantity,
  coupon_id: selectedCoupon?.id || null,
  coupon_discount: couponDiscount,
});
const { clientSecret, paymentIntentId } = response.data;
```

#### Paso 3: Inicializar Payment Sheet
```javascript
const { error: initError } = await initPaymentSheet({
  merchantDisplayName: "Delicrunch",
  customerId: customerId,
  customerEphemeralKeySecret: ephemeralKeySecret,
  paymentIntentClientSecret: clientSecret,
  allowsDelayedPaymentMethods: true,
  returnURL: 'delicrunch://payment-result',
  defaultBillingDetails: {
    name: 'Cliente Delicrunch',
  },
});
```

#### Paso 4: Presentar Payment Sheet
```javascript
const { error: paymentError } = await presentPaymentSheet();

if (!paymentError) {
  // Pago exitoso
  await onPaymentSuccess();
}
```

### 5. **Post-Pago**
```javascript
// Después de un pago exitoso:
1. Se recargan las tarjetas guardadas (por si se guardó una nueva)
2. Se crea la orden en el backend
3. Se marca el cupón como usado (si aplica)
4. Se navega a la pantalla de confirmación
```

---

## 🎨 Características de UI

### Sección de Tarjetas Guardadas

**Cuando hay tarjetas:**
```
┌─────────────────────────────────────┐
│ 💳 Método de pago              [2]  │
├─────────────────────────────────────┤
│ ✅ Tarjetas guardadas               │
│    Selecciona una tarjeta para      │
│    pagar más rápido                 │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💳 VISA                     ✓   │ │
│ │    •••• 4242                    │ │
│ │    Vence: 12/2025               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💳 MASTERCARD                   │ │
│ │    •••• 5555                    │ │
│ │    Vence: 08/2026               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [+ Agregar nueva tarjeta]           │
└─────────────────────────────────────┘
```

**Cuando no hay tarjetas:**
```
┌─────────────────────────────────────┐
│ 💳 Método de pago                   │
├─────────────────────────────────────┤
│ ℹ️  Agrega una tarjeta y guárdala   │
│    para futuras compras             │
│                                     │
│ [+ Agregar nueva tarjeta]           │
└─────────────────────────────────────┘
```

### Estados de Carga
- Loading inicial: Spinner mientras se cargan tarjetas
- Refreshing: Pull-to-refresh para actualizar lista
- Processing: Indicador durante el pago

---

## 🔧 API Endpoints Utilizados

### Frontend → Backend

#### 1. Customer Session
```
POST /api/payments/customer-session
Authorization: Bearer {token}

Response:
{
  customerId: "cus_...",
  ephemeralKeySecret: "ek_...",
  setupIntentClientSecret: "seti_...",
  publishableKey: "pk_..."
}
```

#### 2. Payment Intent
```
POST /api/payments/create-payment-intent
Authorization: Bearer {token}
Body: {
  productId: number,
  cantidad: number,
  coupon_id?: number,
  coupon_discount?: number
}

Response:
{
  clientSecret: "pi_...",
  paymentIntentId: "pi_..."
}
```

#### 3. Get Stripe Cards
```
GET /api/payments/stripe-cards/:customerId
Authorization: Bearer {token}

Response:
{
  success: true,
  cards: [
    {
      id: "pm_...",
      brand: "visa",
      last4: "4242",
      exp_month: 12,
      exp_year: 2025,
      funding: "credit",
      created: 1234567890
    }
  ],
  count: 1
}
```

---

## 🔒 Seguridad y Validaciones

### Backend
1. ✅ Autenticación requerida (authMiddleware)
2. ✅ Validación de rol (solo compradores)
3. ✅ Verificación de ownership (customer pertenece al usuario)
4. ✅ Validación de datos de entrada
5. ✅ Manejo de errores con mensajes claros

### Frontend
1. ✅ Token de autenticación en todas las llamadas
2. ✅ Validación de sesión activa
3. ✅ Manejo de errores con feedback al usuario
4. ✅ Estados de carga para mejor UX
5. ✅ Reintentos automáticos en caso de fallo

---

## 🧪 Testing del Flujo

### Caso 1: Usuario sin tarjetas guardadas
```
1. Usuario abre PaymentScreen
2. Se muestra mensaje "Agrega una tarjeta"
3. Usuario presiona "Agregar nueva tarjeta"
4. Se navega a SaveCardScreen
5. Usuario guarda tarjeta
6. Regresa a PaymentScreen
7. Pull-to-refresh para cargar nueva tarjeta
8. Tarjeta aparece en la lista
9. Usuario completa pago
```

### Caso 2: Usuario con tarjetas guardadas
```
1. Usuario abre PaymentScreen
2. Se cargan tarjetas guardadas automáticamente
3. Primera tarjeta está preseleccionada
4. Usuario puede cambiar selección
5. Usuario presiona "Pagar ahora"
6. Se abre Stripe Payment Sheet
7. Tarjetas guardadas están disponibles
8. Usuario confirma pago
9. Pago se procesa exitosamente
```

### Caso 3: Usuario agrega nueva tarjeta durante pago
```
1. Usuario abre PaymentScreen
2. Tarjetas existentes se cargan
3. Usuario presiona "Pagar ahora"
4. En Payment Sheet, selecciona "+ Add new card"
5. Ingresa datos de nueva tarjeta
6. Marca "Guardar para uso futuro"
7. Completa pago
8. Nueva tarjeta se guarda automáticamente
9. En siguiente compra, tarjeta está disponible
```

---

## 🎯 Puntos Clave de Implementación

### 1. Customer Session
- Se crea una vez por sesión de compra
- Proporciona ephemeral key temporal
- Permite acceso seguro a tarjetas guardadas

### 2. Payment Sheet
- Maneja todo el flujo de pago de Stripe
- Muestra automáticamente tarjetas guardadas
- Permite agregar nuevas tarjetas
- Compatible con 3D Secure

### 3. Gestión de Estado
```javascript
// Estados importantes:
- stripeSavedCards: Array de tarjetas guardadas
- selectedStripeCardId: ID de tarjeta seleccionada
- loadingStripeCards: Estado de carga
- hasSavedCards: Booleano para mostrar UI apropiada
```

### 4. Refresh de Tarjetas
```javascript
// Cuándo refrescar:
1. Al montar el componente
2. Después de guardar una nueva tarjeta
3. Después de completar un pago
4. Con pull-to-refresh manual
```

---

## 🚀 Mejoras Implementadas

1. **Pull-to-Refresh**: Permite actualizar lista de tarjetas manualmente
2. **Preselección Inteligente**: Primera tarjeta se selecciona automáticamente
3. **Indicadores Visuales**: Estados claros de carga y selección
4. **Manejo de Errores**: Mensajes claros y acciones sugeridas
5. **Validación Completa**: Frontend y backend validados
6. **UX Mejorada**: Flujo intuitivo y rápido

---

## 📱 Compatibilidad

### Development Build (Recomendado)
- ✅ Stripe Payment Sheet completo
- ✅ Guardar tarjetas
- ✅ Tarjetas guardadas visibles
- ✅ 3D Secure
- ✅ Todos los métodos de pago

### Expo Go (Modo Demo)
- ⚠️ Sin Stripe real
- ✅ Flujo de demostración
- ✅ Billetera local (metadatos)
- ℹ️ Solo para testing de UI

---

## 🔍 Debugging

### Logs Importantes
```javascript
// Frontend
🔍 Verificando tarjetas guardadas...
✅ Usuario tiene X tarjetas guardadas en Stripe
🔐 Obteniendo Customer Session...
💳 Creando Payment Intent...
✅ Payment Sheet inicializado correctamente
📱 Mostrando Payment Sheet al usuario...
✅ Pago completado exitosamente

// Backend
✅ Customer Session creada: cus_...
✅ Payment Intent creado: pi_...
✅ Obtenidas X tarjetas para customer cus_...
```

### Problemas Comunes

**1. Tarjetas no se cargan**
```
Solución:
- Verificar token de autenticación
- Verificar que customerId es correcto
- Revisar logs del backend
```

**2. Payment Sheet no se abre**
```
Solución:
- Verificar que initPaymentSheet retorna sin error
- Verificar clientSecret válido
- Revisar configuración de Stripe keys
```

**3. Pago falla**
```
Solución:
- Verificar fondos en tarjeta de prueba
- Revisar logs de Stripe Dashboard
- Validar Payment Intent en backend
```

---

## 📚 Recursos

- [Stripe React Native SDK](https://stripe.com/docs/payments/accept-a-payment?platform=react-native)
- [Payment Sheet Documentation](https://stripe.com/docs/payments/accept-a-payment?platform=react-native&ui=payment-sheet)
- [Customer Session API](https://stripe.com/docs/api/customer_sessions)
- [Setup Intent for Saving Cards](https://stripe.com/docs/payments/save-and-reuse)

---

## ✅ Checklist de Validación

- [x] Backend: Endpoint `customer-session` funcionando
- [x] Backend: Endpoint `create-payment-intent` funcionando
- [x] Backend: Endpoint `stripe-cards/:customerId` funcionando
- [x] Frontend: Servicio `stripeCustomerService` completo
- [x] Frontend: `PaymentScreen` carga tarjetas guardadas
- [x] Frontend: Selección de tarjetas funcional
- [x] Frontend: Payment Sheet se inicializa correctamente
- [x] Frontend: Payment Sheet muestra tarjetas guardadas
- [x] Frontend: Pagos se procesan exitosamente
- [x] Frontend: Refresh de tarjetas funciona
- [x] Frontend: Manejo de errores implementado
- [x] Frontend: Estados de carga visibles
- [x] Integración: Flujo completo de principio a fin validado

---

## 🎉 Conclusión

La integración está completa y funcional. Los usuarios pueden:

1. ✅ Ver todas sus tarjetas guardadas en Stripe
2. ✅ Seleccionar la tarjeta que deseen usar
3. ✅ Realizar pagos con tarjetas guardadas o nuevas
4. ✅ Guardar nuevas tarjetas durante el pago
5. ✅ Actualizar la lista de tarjetas (pull-to-refresh)
6. ✅ Completar el flujo de pago de principio a fin

El sistema está listo para producción con:
- Seguridad completa (PCI compliance a través de Stripe)
- Validaciones frontend y backend
- Manejo robusto de errores
- UX optimizada para conversión
- Logs completos para debugging
