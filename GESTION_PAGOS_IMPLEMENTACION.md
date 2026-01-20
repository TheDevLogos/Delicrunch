# Gestión de Pagos y Cuentas - Implementación Completa

## 📋 Resumen de Cambios

Se implementó un sistema completo de gestión de pagos y cuentas Stripe para los tres tipos de usuarios (Comprador, Comercio y Admin) desde la pantalla de perfil.

---

## 🎯 Funcionalidades Implementadas

### 1. **Compradores** 
- ✅ Acceso a "Métodos de Pago" desde el menú de perfil
- ✅ Navega a `ManageCardsScreen` para gestionar tarjetas
- ✅ Puede agregar, eliminar y establecer tarjetas predeterminadas
- ✅ Las tarjetas se guardan en Stripe usando Payment Methods
- ✅ Las tarjetas guardadas se muestran automáticamente en `PaymentScreen`
- ✅ Pueden usar tarjetas guardadas para compras rápidas

### 2. **Comercios**
- ✅ Acceso a "Cuentas para Cobrar" desde el menú de perfil
- ✅ Navega a `MerchantPaymentSettingsScreen`
- ✅ Pueden configurar Stripe Connect Express
- ✅ Ver balance disponible y pendiente
- ✅ Ver próximos pagos (payouts)
- ✅ Estado de verificación de cuenta Stripe

### 3. **Administradores**
- ✅ Acceso DUAL: "Métodos de Pago" Y "Cuentas para Cobrar"
- ✅ Pueden gestionar tarjetas como compradores
- ✅ Pueden configurar cuentas Stripe Connect como comercios
- ✅ Tienen acceso completo a ambas funcionalidades

---

## 🔧 Cambios en el Frontend

### **ProfileScreen.js**
```javascript
// ANTES: Solo compradores tenían acceso a métodos de pago
if (isComprador || isAdmin) {
  // Métodos de pago solo para compradores
}

// DESPUÉS: Menú diferenciado por rol
if (isComprador) {
  // Métodos de Pago → ManageCards
}

if (isComercio) {
  // Cuentas para Cobrar → MerchantPaymentSettings
}

if (isAdmin) {
  // Métodos de Pago → ManageCards
  // Cuentas para Cobrar → MerchantPaymentSettings
}
```

**Cambios específicos:**
- ✅ Eliminado botón flotante "Agregar Método de Pago"
- ✅ Integrado en el menú dinámico por rol
- ✅ Label "Métodos de Pago" para comprador/admin
- ✅ Label "Cuentas para Cobrar" para comercio/admin
- ✅ Navegación a `ManageCards` para gestión de tarjetas
- ✅ Navegación a `MerchantPaymentSettings` para Stripe Connect

### **AppNavigator.js**
```javascript
// Agregado import
import ManageCardsScreen from '../app/ManageCardsScreen';

// Agregadas rutas en AuthStack y AppStack
<Stack.Screen name="ManageCards" component={ManageCardsScreen} 
  options={{ title: 'Gestionar Tarjetas', headerShown: true }} />
<Stack.Screen name="MerchantPaymentSettings" component={MerchantPaymentSettingsScreen} 
  options={{ title: 'Configurar Pagos', headerShown: false }} />
```

### **PaymentScreen.js** (Ya implementado)
- ✅ Ya muestra tarjetas guardadas de Stripe
- ✅ Permite seleccionar tarjeta guardada
- ✅ Permite agregar nueva tarjeta durante el pago
- ✅ Sincroniza automáticamente con Stripe

---

## 🗄️ Cambios en el Backend

### **Schema SQL** (`db/schema.sql`)
```sql
-- Agregadas columnas para admin en profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;
```

**Ejecución:**
```bash
docker exec -i delicrunch-postgres psql -U postgres -d delicrunch -c "
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255);
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;
"
```

### **paymentController.js**

#### 1. **createCustomerSession**
```javascript
// ANTES
if (req.user.rol !== 'comprador') {
  return res.status(403).json({ msg: 'Solo compradores...' });
}

// DESPUÉS
if (req.user.rol !== 'comprador' && req.user.rol !== 'admin') {
  return res.status(403).json({ msg: 'Solo compradores y administradores...' });
}
```

#### 2. **getStripeCustomerCards**
```javascript
// Permitido para comprador y admin
if (req.user.rol !== 'comprador' && req.user.rol !== 'admin') {
  return res.status(403).json({ ... });
}
```

#### 3. **setDefaultPaymentMethod**
```javascript
// Permitido para comprador y admin
if (req.user.rol !== 'comprador' && req.user.rol !== 'admin') {
  return res.status(403).json({ ... });
}
```

#### 4. **syncCards**
```javascript
// Permitido para comprador y admin
if (req.user.rol !== 'comprador' && req.user.rol !== 'admin') {
  return res.status(403).json({ ... });
}
```

#### 5. **createAccountLink** (Stripe Connect)
```javascript
// ANTES: Solo stores (comercios)
const storeResult = await pool.query('SELECT id, stripe_account_id FROM stores WHERE user_id = $1', [userId]);

// DESPUÉS: stores para comercios, profiles para admin
if (req.user.rol === 'comercio') {
  // Usar stores
  const storeResult = await pool.query('SELECT id, stripe_account_id FROM stores WHERE user_id = $1', [userId]);
  stripeAccountId = storeResult.rows[0].stripe_account_id;
  entityId = storeResult.rows[0].id;
  tableName = 'stores';
} else {
  // Usar profiles para admin
  const profileResult = await pool.query('SELECT id, stripe_account_id FROM profiles WHERE user_id = $1', [userId]);
  stripeAccountId = profileResult.rows[0].stripe_account_id;
  entityId = profileResult.rows[0].id;
  tableName = 'profiles';
}
```

#### 6. **getAccountStatus**
```javascript
// Misma lógica dual: stores para comercio, profiles para admin
if (req.user.rol === 'comercio') {
  const storeResult = await pool.query('SELECT stripe_account_id FROM stores WHERE user_id = $1', [req.user.id]);
  stripeAccountId = storeResult.rows[0].stripe_account_id;
} else {
  const profileResult = await pool.query('SELECT stripe_account_id FROM profiles WHERE user_id = $1', [req.user.id]);
  stripeAccountId = profileResult.rows[0].stripe_account_id;
}
```

#### 7. **getConnectedAccountBalance**
```javascript
// Misma lógica dual
```

#### 8. **getUpcomingPayouts**
```javascript
// Misma lógica dual
```

---

## 📱 Flujo de Usuario

### **Comprador**
1. Perfil → "Métodos de Pago"
2. `ManageCardsScreen` → Ve tarjetas guardadas
3. Puede agregar nueva tarjeta → `SaveCardScreen`
4. Puede establecer tarjeta predeterminada
5. Puede eliminar tarjetas
6. Al comprar en `PaymentScreen` → Ve tarjetas guardadas
7. Puede seleccionar tarjeta o agregar nueva

### **Comercio**
1. Perfil → "Cuentas para Cobrar"
2. `MerchantPaymentSettingsScreen` → Estado de Stripe Connect
3. Si no tiene cuenta → Botón "Configurar Stripe"
4. Abre navegador con onboarding de Stripe
5. Completa verificación
6. Ve balance disponible y próximos pagos

### **Admin** (Rol Dual)
1. Perfil → "Métodos de Pago" (como comprador)
2. Perfil → "Cuentas para Cobrar" (como comercio)
3. Acceso completo a ambas funcionalidades

---

## 🔐 Seguridad

### **Validaciones Backend**
- ✅ Todos los endpoints verifican rol del usuario
- ✅ Admin tiene permisos de comprador + comercio
- ✅ Verificación de ownership de recursos
- ✅ No se exponen datos sensibles de tarjetas

### **Stripe Integration**
- ✅ Payment Methods guardados en Stripe (nunca en BD)
- ✅ Customer Session con ephemeral keys
- ✅ Stripe Connect Express para comercios
- ✅ Destination Charges para split payments

---

## 📊 Base de Datos

### **Tabla: profiles**
```sql
stripe_customer_id VARCHAR(255)      -- Para tarjetas (comprador/admin)
stripe_account_id VARCHAR(255)       -- Para cobros (admin)
stripe_onboarding_complete BOOLEAN   -- Estado onboarding (admin)
```

### **Tabla: stores**
```sql
stripe_account_id VARCHAR(255)       -- Para cobros (comercio)
stripe_onboarding_complete BOOLEAN   -- Estado onboarding (comercio)
```

---

## 🧪 Testing

### **Pruebas Comprador**
```bash
1. Login como comprador
2. Ir a Perfil → Métodos de Pago
3. Agregar tarjeta de prueba: 4242 4242 4242 4242
4. Verificar que se guarda en Stripe
5. Hacer una compra → Verificar que aparece la tarjeta guardada
```

### **Pruebas Comercio**
```bash
1. Login como comercio
2. Ir a Perfil → Cuentas para Cobrar
3. Configurar Stripe Connect
4. Completar onboarding
5. Verificar balance y payouts
```

### **Pruebas Admin**
```bash
1. Login como admin
2. Verificar menú tiene ambas opciones
3. Probar "Métodos de Pago" → Gestionar tarjetas
4. Probar "Cuentas para Cobrar" → Configurar Stripe
5. Verificar permisos en backend
```

---

## 🎉 Resultado Final

### **Compradores**
- ✅ Pueden guardar tarjetas para compras rápidas
- ✅ Payment Sheet muestra tarjetas guardadas
- ✅ Experiencia de checkout más rápida

### **Comercios**
- ✅ Configuración fácil de Stripe Connect
- ✅ Visibilidad de ingresos y pagos
- ✅ Cobros automáticos divididos

### **Administradores**
- ✅ Acceso completo a gestión de tarjetas
- ✅ Acceso completo a cuentas Stripe Connect
- ✅ Pueden probar como comprador y comercio

---

## 📝 Notas Importantes

1. **Admin usa `profiles` para Stripe Connect**: Los admin no tienen tienda, por lo que su `stripe_account_id` se guarda en la tabla `profiles` en lugar de `stores`.

2. **Tarjetas guardadas**: Solo los payment methods, nunca datos sensibles. Stripe maneja todo PCI compliance.

3. **Navegación**: Los nombres de las rutas son consistentes:
   - `ManageCards` → Gestión de tarjetas
   - `MerchantPaymentSettings` → Configuración Stripe Connect

4. **Backend dual**: Los endpoints verifican el rol y consultan la tabla correcta (`stores` o `profiles`).

---

## ✅ Checklist de Validación

- [x] ProfileScreen muestra opciones correctas según rol
- [x] Navegación funciona a pantallas correctas
- [x] ManageCardsScreen accesible para comprador/admin
- [x] MerchantPaymentSettingsScreen accesible para comercio/admin
- [x] Backend permite admin gestionar tarjetas
- [x] Backend permite admin configurar Stripe Connect
- [x] Migraciones SQL ejecutadas
- [x] PaymentScreen usa tarjetas guardadas
- [x] No hay errores de compilación

---

## 🚀 Próximos Pasos (Opcional)

- [ ] Agregar analytics para uso de tarjetas guardadas
- [ ] Dashboard de admin con métricas de pagos
- [ ] Notificaciones push cuando se recibe un pago
- [ ] Export de reportes de transacciones

---

**Fecha de implementación:** 16 de enero de 2026
**Desarrollador:** GitHub Copilot
**Estado:** ✅ Completado y funcionando
