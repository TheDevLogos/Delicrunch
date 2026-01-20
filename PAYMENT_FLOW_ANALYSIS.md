# 📋 Análisis Completo del Flujo de Pagos con Stripe

## ✅ LO QUE YA EXISTE (Implementado)

### 1. **StripeProvider en Root** ✅
**Ubicación:** `/Frontend/App.js`
```javascript
<StripeProvider
  publishableKey={STRIPE_PUBLISHABLE_KEY}
  merchantIdentifier="merchant.com.delicrunch.app"
>
  {/* Resto de la app */}
</StripeProvider>
```
**Estado:** ✅ **CORRECTO** - Wrapper en el nivel superior

---

### 2. **Endpoint `/customer-session`** ✅
**Ubicación:** `/Backend/controllers/paymentController.js`
```javascript
exports.createCustomerSession = asyncHandler(async (req, res, next) => {
  // 1. Valida rol comprador
  // 2. Obtiene/Crea stripe_customer_id
  // 3. Crea Ephemeral Key
  // 4. Crea SetupIntent
  // 5. Retorna: customerId, ephemeralKeySecret, setupIntentClientSecret
});
```
**Ruta:** `POST /api/payments/customer-session`
**Estado:** ✅ **CORRECTO**

---

### 3. **SaveCardScreen con Payment Sheet** ✅
**Ubicación:** `/Frontend/app/SaveCardScreen.js`
```javascript
const handleAddCard = async () => {
  const success = await presentPaymentSheetForCardSetup(stripe);
  // Usa SetupIntent para guardar tarjeta
};
```
**Estado:** ✅ **CORRECTO** - Usa Payment Sheet para guardar tarjetas

---

### 4. **Servicio stripeCustomerService** ✅
**Ubicación:** `/Frontend/services/stripeCustomerService.js`
```javascript
export const createCustomerSession = async () => {
  // Llama a /api/payments/customer-session
  // Retorna customerId, ephemeralKeySecret, setupIntentClientSecret
};

export const presentPaymentSheetForCardSetup = async (stripe) => {
  // Inicializa Payment Sheet con SetupIntent
  // Presenta formulario para guardar tarjeta
};

export const getStripeCustomerCards = async (customerId) => {
  // Obtiene tarjetas guardadas de Stripe
};
```
**Estado:** ✅ **CORRECTO**

---

### 5. **PaymentScreen con Payment Intent** ✅
**Ubicación:** `/Frontend/app/PaymentScreen.js`
```javascript
const initializePayment = async () => {
  // 1. Obtiene Customer Session
  // 2. Crea Payment Intent
  // 3. Inicializa Payment Sheet con tarjetas guardadas
  // 4. Presenta Payment Sheet
  // 5. Procesa pago
};
```
**Estado:** ✅ **CORRECTO** - Flujo completo implementado

---

### 6. **Tabla `saved_cards` en BD** ✅
**Ubicación:** `/Backend/db/schema.sql`
```sql
CREATE TABLE IF NOT EXISTS saved_cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(255), -- ID del payment method en Stripe
    brand VARCHAR(50) NOT NULL,
    last4 VARCHAR(4) NOT NULL,
    exp_month INTEGER NOT NULL,
    exp_year INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT FALSE, -- ✅ Campo para tarjeta por defecto
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Estado:** ✅ **CORRECTO** - Incluye campo `is_default`

---

### 7. **Tabla `profiles` con `stripe_customer_id`** ✅
**Ubicación:** `/Backend/db/schema.sql`
```sql
CREATE TABLE IF NOT EXISTS profiles (
    -- ... otros campos ...
    stripe_customer_id VARCHAR(255), -- ✅ Para vincular con Stripe Customer
);
```
**Estado:** ✅ **CORRECTO**

---

### 8. **PaymentMethodsScreen (Demo)** ✅
**Ubicación:** `/Frontend/app/PaymentMethodsScreen.js`
- Lista tarjetas guardadas (modo demo con metadatos)
- Permite agregar tarjetas manualmente
- Marca tarjetas como predeterminadas
- **Nota:** Este es un modo DEMO que guarda solo metadatos localmente

**Estado:** ✅ **EXISTE** pero es modo demo

---

### 9. **Navegación configurada** ✅
**Ubicación:** `/Frontend/navigation/AppNavigator.js`
```javascript
<Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
<Stack.Screen name="SaveCard" component={SaveCardScreen} />
<Stack.Screen name="Payment" component={PaymentScreen} />
```
**Estado:** ✅ **CORRECTO**

---

## ⚠️ LO QUE FALTA O NECESITA MEJORAS

### 1. **Guardar `default_payment_method_id` en `profiles`** ⚠️

**Situación Actual:**
- Existe `saved_cards.is_default` ✅
- Pero NO existe `profiles.default_payment_method_id` ❌

**Lo que se necesita:**

#### **1.1. Migración de BD**
```sql
-- Agregar columna en profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS default_payment_method_id VARCHAR(255);

-- Índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_profiles_default_payment_method 
ON profiles(default_payment_method_id);
```

#### **1.2. Lógica de actualización**
Cuando un usuario marca una tarjeta como default en Stripe:

```javascript
// Backend: Después de guardar tarjeta con SetupIntent
const paymentMethod = await stripe.paymentMethods.attach(
  paymentMethodId,
  { customer: customerId }
);

// Establecer como default en Stripe
await stripe.customers.update(customerId, {
  invoice_settings: {
    default_payment_method: paymentMethodId
  }
});

// Guardar en BD local
await pool.query(
  'UPDATE profiles SET default_payment_method_id = $1 WHERE stripe_customer_id = $2',
  [paymentMethodId, customerId]
);
```

---

### 2. **Hook personalizado para gestión de tarjetas** ⚠️

**Falta:** Un hook reutilizable tipo `usePaymentMethods`

**Lo que se necesita:**

#### **Archivo:** `/Frontend/hooks/usePaymentMethods.js`
```javascript
import { useState, useEffect, useCallback } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import { 
  createCustomerSession, 
  getStripeCustomerCards 
} from '../services/stripeCustomerService';
import api from '../services/api';

export const usePaymentMethods = () => {
  const stripe = useStripe();
  const [cards, setCards] = useState([]);
  const [defaultCardId, setDefaultCardId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState(null);

  // Cargar tarjetas
  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const { customerId: cid } = await createCustomerSession();
      setCustomerId(cid);
      
      const cards = await getStripeCustomerCards(cid);
      setCards(cards);
      
      // Obtener tarjeta por defecto
      const response = await api.get('/profile');
      setDefaultCardId(response.data.default_payment_method_id);
      
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Establecer tarjeta por defecto
  const setDefaultCard = useCallback(async (paymentMethodId) => {
    try {
      await api.put('/payments/set-default-payment-method', {
        paymentMethodId
      });
      setDefaultCardId(paymentMethodId);
      return true;
    } catch (error) {
      console.error('Error setting default card:', error);
      return false;
    }
  }, []);

  // Eliminar tarjeta
  const deleteCard = useCallback(async (paymentMethodId) => {
    try {
      await api.delete(`/payments/payment-methods/${paymentMethodId}`);
      await loadCards(); // Recargar lista
      return true;
    } catch (error) {
      console.error('Error deleting card:', error);
      return false;
    }
  }, [loadCards]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  return {
    cards,
    defaultCardId,
    loading,
    customerId,
    loadCards,
    setDefaultCard,
    deleteCard,
  };
};
```

---

### 3. **Endpoint para establecer tarjeta por defecto** ⚠️

**Falta:** Endpoint que sincronice Stripe y BD local

**Lo que se necesita:**

#### **Archivo:** `/Backend/controllers/paymentController.js`
```javascript
/**
 * @desc    Establecer payment method como predeterminado
 * @route   PUT /api/payments/set-default-payment-method
 * @access  Privado (Comprador)
 */
exports.setDefaultPaymentMethod = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
        return res.status(400).json({ msg: 'paymentMethodId es requerido' });
    }

    // 1. Obtener stripe_customer_id
    const profileResult = await pool.query(
        'SELECT stripe_customer_id FROM profiles WHERE user_id = $1',
        [userId]
    );

    if (profileResult.rows.length === 0) {
        return res.status(404).json({ msg: 'Perfil no encontrado' });
    }

    const { stripe_customer_id: customerId } = profileResult.rows[0];

    if (!customerId) {
        return res.status(400).json({ msg: 'Usuario no tiene Customer en Stripe' });
    }

    try {
        // 2. Actualizar en Stripe
        await stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId
            }
        });

        // 3. Actualizar en BD local
        await pool.query(
            'UPDATE profiles SET default_payment_method_id = $1 WHERE user_id = $2',
            [paymentMethodId, userId]
        );

        // 4. Actualizar saved_cards (opcional - para mantener sincronía)
        await pool.query('UPDATE saved_cards SET is_default = FALSE WHERE user_id = $1', [userId]);
        await pool.query(
            'UPDATE saved_cards SET is_default = TRUE WHERE stripe_payment_method_id = $1 AND user_id = $2',
            [paymentMethodId, userId]
        );

        console.log(`✅ Payment method ${paymentMethodId} establecido como default para user ${userId}`);

        res.json({
            success: true,
            msg: 'Método de pago establecido como predeterminado',
            paymentMethodId
        });

    } catch (error) {
        console.error('❌ Error al establecer payment method:', error);
        res.status(500).json({
            msg: 'Error al actualizar método de pago',
            error: error.message
        });
    }
});
```

#### **Ruta:** `/Backend/routes/paymentRoutes.js`
```javascript
router.put('/set-default-payment-method', authMiddleware, setDefaultPaymentMethod);
```

---

### 4. **Sincronización después de guardar tarjeta** ⚠️

**Situación:** Cuando se guarda una tarjeta con `SaveCardScreen`, NO se guarda en la BD local

**Lo que se necesita:**

#### **Webhook de Stripe** (Recomendado)
```javascript
// Backend: /api/webhooks/stripe
exports.handleStripeWebhook = asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Manejar eventos
    if (event.type === 'setup_intent.succeeded') {
        const setupIntent = event.data.object;
        const customerId = setupIntent.customer;
        const paymentMethodId = setupIntent.payment_method;

        // Obtener detalles del payment method
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

        // Buscar usuario por customerId
        const userResult = await pool.query(
            'SELECT user_id FROM profiles WHERE stripe_customer_id = $1',
            [customerId]
        );

        if (userResult.rows.length > 0) {
            const userId = userResult.rows[0].user_id;

            // Guardar en BD
            const isFirstCard = await pool.query(
                'SELECT COUNT(*) FROM saved_cards WHERE user_id = $1',
                [userId]
            );

            const makeDefault = isFirstCard.rows[0].count === '0';

            await pool.query(
                `INSERT INTO saved_cards 
                (user_id, stripe_payment_method_id, brand, last4, exp_month, exp_year, is_default)
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    userId,
                    paymentMethodId,
                    paymentMethod.card.brand,
                    paymentMethod.card.last4,
                    paymentMethod.card.exp_month,
                    paymentMethod.card.exp_year,
                    makeDefault
                ]
            );

            // Si es la primera, establecer como default
            if (makeDefault) {
                await pool.query(
                    'UPDATE profiles SET default_payment_method_id = $1 WHERE user_id = $2',
                    [paymentMethodId, userId]
                );
            }

            console.log(`✅ Tarjeta guardada en BD para user ${userId}`);
        }
    }

    res.json({ received: true });
});
```

**O**

#### **Endpoint para sincronizar manualmente**
```javascript
/**
 * @desc    Sincronizar tarjetas de Stripe con BD local
 * @route   POST /api/payments/sync-cards
 * @access  Privado (Comprador)
 */
exports.syncCards = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    // 1. Obtener customerId
    const profileResult = await pool.query(
        'SELECT stripe_customer_id FROM profiles WHERE user_id = $1',
        [userId]
    );

    const { stripe_customer_id: customerId } = profileResult.rows[0];

    // 2. Obtener payment methods de Stripe
    const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
    });

    // 3. Limpiar tabla local
    await pool.query('DELETE FROM saved_cards WHERE user_id = $1', [userId]);

    // 4. Insertar todas las tarjetas
    for (const pm of paymentMethods.data) {
        await pool.query(
            `INSERT INTO saved_cards 
            (user_id, stripe_payment_method_id, brand, last4, exp_month, exp_year, is_default)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                userId,
                pm.id,
                pm.card.brand,
                pm.card.last4,
                pm.card.exp_month,
                pm.card.exp_year,
                false // Por ahora todas false, luego sincronizar default
            ]
        );
    }

    res.json({
        success: true,
        synced: paymentMethods.data.length
    });
});
```

---

### 5. **Pantalla de Gestión de Tarjetas (Stripe real)** ⚠️

**Situación:** Existe `PaymentMethodsScreen` pero es modo DEMO

**Lo que se necesita:**

#### **Archivo:** `/Frontend/app/ManageCardsScreen.js`
```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { Ionicons } from '@expo/vector-icons';

const ManageCardsScreen = ({ navigation }) => {
  const stripe = useStripe();
  const {
    cards,
    defaultCardId,
    loading,
    loadCards,
    setDefaultCard,
    deleteCard,
  } = usePaymentMethods();

  const handleAddCard = () => {
    navigation.navigate('SaveCard');
  };

  const handleSetDefault = async (paymentMethodId) => {
    const success = await setDefaultCard(paymentMethodId);
    if (success) {
      Alert.alert('✅', 'Tarjeta establecida como predeterminada');
    } else {
      Alert.alert('❌', 'Error al establecer tarjeta');
    }
  };

  const handleDelete = (paymentMethodId) => {
    Alert.alert(
      'Eliminar tarjeta',
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteCard(paymentMethodId);
            if (success) {
              Alert.alert('✅', 'Tarjeta eliminada');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mis Tarjetas</Text>
        <TouchableOpacity onPress={handleAddCard}>
          <Ionicons name="add-circle" size={32} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Lista de tarjetas */}
      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardItem}>
            <Ionicons name="card" size={28} color="#4CAF50" />
            
            <View style={styles.cardInfo}>
              <Text style={styles.cardBrand}>
                {item.brand.toUpperCase()} •••• {item.last4}
              </Text>
              <Text style={styles.cardExpiry}>
                {item.exp_month}/{item.exp_year}
              </Text>
            </View>

            {/* Badge de default */}
            {defaultCardId === item.id && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Predeterminada</Text>
              </View>
            )}

            {/* Acciones */}
            <TouchableOpacity
              onPress={() => handleSetDefault(item.id)}
              disabled={defaultCardId === item.id}
            >
              <Ionicons
                name={defaultCardId === item.id ? "star" : "star-outline"}
                size={24}
                color="#FFC107"
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash-outline" size={24} color="#F44336" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No tienes tarjetas guardadas</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddCard}>
              <Text style={styles.addButtonText}>Agregar Tarjeta</Text>
            </TouchableOpacity>
          </View>
        }
        refreshing={loading}
        onRefresh={loadCards}
      />
    </View>
  );
};

export default ManageCardsScreen;
```

---

### 6. **Botón "Pagar" con payment_method seleccionado** ⚠️

**Situación:** `PaymentScreen` ya muestra tarjetas guardadas, pero se puede mejorar

**Lo que se necesita:**

#### **Mejorar:** `/Frontend/app/PaymentScreen.js`

Agregar opción para pagar directamente con tarjeta por defecto sin abrir Payment Sheet:

```javascript
const payWithDefaultCard = async () => {
  try {
    setIsPurchasing(true);

    // 1. Obtener tarjeta por defecto
    const profile = await api.get('/profile');
    const defaultPMId = profile.data.default_payment_method_id;

    if (!defaultPMId) {
      Alert.alert('Sin tarjeta', 'Agrega una tarjeta primero');
      return;
    }

    // 2. Crear Payment Intent con payment_method
    const response = await api.post('/payments/create-payment-intent', {
      productId: product.id,
      cantidad: quantity,
      paymentMethodId: defaultPMId, // ✅ Usar tarjeta por defecto
      coupon_id: selectedCoupon?.id,
      coupon_discount: couponDiscount,
    });

    const { paymentIntentId, clientSecret } = response.data;

    // 3. Confirmar pago desde el cliente
    const { error, paymentIntent } = await stripe.confirmPayment(clientSecret, {
      paymentMethodType: 'Card',
    });

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    if (paymentIntent.status === 'succeeded') {
      await onPaymentSuccess();
    }

  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setIsPurchasing(false);
  }
};
```

---

## 📊 RESUMEN DE ESTADO

### ✅ Lo que ESTÁ COMPLETO (9/14)

| # | Componente | Estado |
|---|------------|--------|
| 1 | StripeProvider en root | ✅ |
| 2 | Endpoint /customer-session | ✅ |
| 3 | SaveCardScreen con Payment Sheet | ✅ |
| 4 | Servicio stripeCustomerService | ✅ |
| 5 | PaymentScreen con Payment Intent | ✅ |
| 6 | Tabla saved_cards | ✅ |
| 7 | profiles.stripe_customer_id | ✅ |
| 8 | PaymentMethodsScreen (demo) | ✅ |
| 9 | Navegación | ✅ |

### ⚠️ Lo que FALTA o necesita mejora (5/14)

| # | Componente | Prioridad |
|---|------------|-----------|
| 10 | profiles.default_payment_method_id | 🔴 ALTA |
| 11 | Hook usePaymentMethods | 🟡 MEDIA |
| 12 | Endpoint set-default-payment-method | 🔴 ALTA |
| 13 | Sincronización con BD (webhook o manual) | 🔴 ALTA |
| 14 | ManageCardsScreen (Stripe real) | 🟡 MEDIA |

---

## 🎯 PLAN DE ACCIÓN RECOMENDADO

### Fase 1: BD y Backend (Crítico)
1. ✅ Agregar columna `profiles.default_payment_method_id`
2. ✅ Crear endpoint `/api/payments/set-default-payment-method`
3. ✅ Implementar webhook o endpoint de sincronización

### Fase 2: Frontend (Importante)
4. ✅ Crear hook `usePaymentMethods`
5. ✅ Crear `ManageCardsScreen` con tarjetas reales de Stripe
6. ✅ Mejorar `PaymentScreen` para usar tarjeta por defecto directamente

### Fase 3: Testing y Refinamiento
7. ✅ Probar flujo completo end-to-end
8. ✅ Validar sincronización BD ↔ Stripe
9. ✅ Optimizar UX de selección de tarjetas

---

## 🎉 CONCLUSIÓN

**Tu app YA TIENE implementado ~65% del flujo completo de pagos con Stripe:**

✅ **Lo fuerte:**
- StripeProvider configurado
- Customer Session funcionando
- Guardar tarjetas con SetupIntent
- Pagar con Payment Intent
- Mostrar tarjetas guardadas
- Estructura de BD adecuada

⚠️ **Lo que falta:**
- Columna `default_payment_method_id` en BD
- Endpoint para establecer tarjeta por defecto
- Hook reutilizable `usePaymentMethods`
- Sincronización automática BD ↔ Stripe
- Pantalla de gestión con tarjetas reales (no demo)

**Prioridad:** Implementar primero la Fase 1 (BD y Backend) para tener un flujo completo funcional.
