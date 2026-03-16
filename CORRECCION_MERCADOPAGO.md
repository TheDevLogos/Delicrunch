# 🔧 Corrección de Integración MercadoPago - 16 Mar 2026

## Problema Reportado
Error al intentar completar pago en la pantalla de checkout de MercadoPago.

## Diagnóstico Realizado

### ✅ Credenciales Verificadas
- **Public Key:** APP_USR-9ba7aa3b-9864-48b9-8b7c-271a5cf44549 ✓
- **Access Token:** APP_USR-7704331481200418-012213-c2709cec9688c4aec321f267d1c70100-76668136 ✓
- **Webhook:** Probado desde panel MP retorna 200 ✓
- **API Test:** Creación de preferencias funcional ✓

### ⚠️ Problemas Identificados en el Código

#### 1. marketplace_fee Sin Validación
**Problema:** Se estaba enviando `marketplace_fee` sin verificar que el seller tenga cuenta de MP registrada, causando que MP rechace el pago en checkout.

**Documentación MP:** https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/checkout-customization/checkout-pro-payments-split

**Solución:** Removido temporalmente. Para habilitarlo en el futuro, el seller debe:
1. Crear cuenta en MercadoPago
2. Completar onboarding de vendedor
3. Vincular su cuenta con la aplicación

#### 2. Configuración Incorrecta de Expiración
**Problema:** 
```javascript
expires: true,
expiration_date_from: new Date().toISOString(), // ❌ No debe enviarse
expiration_date_to: new Date(...).toISOString(),
```

**Según docs oficiales de MP:** Solo debe enviarse `expiration_date_to`, no `expiration_date_from`.

**Solución:**
```javascript
expires: true,
expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
```

#### 3. external_reference Muy Largo
**Problema:** Se estaba enviando todo el objeto de la orden como JSON stringify, pudiendo exceder el límite de 256 caracteres.

**Solución:** Formato simplificado
```javascript
external_reference: `DC_${userId}_${productId}_${timestamp}`
```

Los datos completos ahora se guardan en `metadata` que no tiene límite de tamaño.

#### 4. auto_return No Configurado
**Agregado:** `auto_return: 'approved'` para redirigir automáticamente al usuario cuando el pago sea aprobado.

## Cambios Implementados

### Archivo: `Backend/controllers/paymentController.js`

**Función:** `exports.createPreference`

1. ✅ Removido `marketplace_fee` condicional
2. ✅ Removido `expiration_date_from`
3. ✅ Simplificado `external_reference`
4. ✅ Agregado `auto_return: 'approved'`
5. ✅ Movido todos los datos a `metadata`
6. ✅ Agregado timestamp a metadata

**Función:** `exports.handleWebhook`

1. ✅ Actualizado parser de external_reference para nuevo formato
2. ✅ Agregado fallback a metadata para obtener orderData
3. ✅ Mejorado logging

## Próximos Pasos

1. **Deployment:**
   ```bash
   git add Backend/controllers/paymentController.js
   git commit -m "fix: corregir integración MercadoPago según docs oficiales"
   git push origin main
   ```
   Render detectará el push y desplegará automáticamente.

2. **Prueba Real:**
   - Esperar deployment (~2-3 min)
   - Ejecutar `./test-payment-production.sh`
   - Probar pago completo desde la app
   - Usar tarjeta de prueba de MP:
     * Número: 5031 7557 3453 0604
     * CVV: 123
     * Fecha: 11/25

3. **Verificar Webhook:**
   - Revisar logs de Render durante el pago
   - Confirmar que se crea la orden en DB
   - Verificar que el estado cambia a "confirmado"

4. **Habilitar marketplace_fee (Futuro):**
   - Los sellers deben completar onboarding de MP
   - Guardar su `collector_id` de MP en tabla stores
   - Descomentar código de marketplace_fee con validación

## Referencias
- [Checkout Pro - MercadoPago](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/landing)
- [Split de Pagos](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/checkout-customization/checkout-pro-payments-split)
- [Credenciales](https://www.mercadopago.com.mx/developers/es/docs/your-integrations/credentials)

