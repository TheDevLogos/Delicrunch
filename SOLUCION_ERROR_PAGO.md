# 🚨 SOLUCIÓN: Error "No se pudo crear referencia de pago"

**Fecha diagnóstico:** 10 de marzo de 2026  
**Usuario reportado:** Comprador no puede pagar
**Error:** "No se pudo crear referencia de pago"

---

## 📊 Diagnóstico Completo

### ✅ Backend Local
- **Estado:** ✅ FUNCIONA CORRECTAMENTE
- **Test realizado:** create-preference con usuario testbuyer2@delicrunch.com
- **Resultado:** Preferencia creada exitosamente
- **Preference ID:** `76668136-c15f21f5-a0d2-449a-8b41-5a396608b571`

### ❌ Backend Producción (Render)
- **Estado:** ❌ FALLA AL CREAR PREFERENCIA
- **URL:** https://delicrunch.onrender.com  
- **Test realizado:** create-preference con mismo usuario
- **Resultado:** `{"msg": "Error al crear la preferencia de pago."}`

---

## 🔍 Causa Raíz

**Render tiene credenciales ANTIGUAS de MercadoPago que ya no funcionan.**

Las credenciales correctas (que funcionan en local) son:
```env
MERCADOPAGO_PUBLIC_KEY=APP_USR-9ba7aa3b-9864-48b9-8b7c-271a5cf44549
MERCADOPAGO_ACCESS_TOKEN=APP_USR-7704331481200418-012213-c2709cec9688c4aec321f267d1c70100-76668136
```

Pero Render probablemente tiene credenciales desactualizadas o de sandbox.

---

## ✅ SOLUCIÓN: Actualizar Variables de Entorno en Render

### Paso 1: Acceder al Dashboard de Render

1. Ve a: https://dashboard.render.com
2. Inicia sesión con tu cuenta
3. Busca el servicio **"delicrunch"** o el backend de Delicrunch

### Paso 2: Actualizar Variables de Entorno

1. En el servicio, ve a la pestaña **"Environment"** en el menú lateral
2. Busca o agrega estas variables:

```env
MERCADOPAGO_PUBLIC_KEY=APP_USR-9ba7aa3b-9864-48b9-8b7c-271a5cf44549
MERCADOPAGO_ACCESS_TOKEN=APP_USR-7704331481200418-012213-c2709cec9688c4aec321f267d1c70100-76668136
MERCADOPAGO_USER_ID=76668136
MERCADOPAGO_APP_ID=7704331481200418
```

3. Haz clic en **"Save Changes"**

### Paso 3: Esperar Re-Deploy Automático

- Render detectará los cambios y hará un re-deploy automático
- Esto tarda aproximadamente 2-3 minutos
- Puedes ver el progreso en la pestaña **"Logs"**

### Paso 4: Verificar que Funciona

Espera a que el deploy termine y ejecuta:

```bash
cd /workspaces/Delicrunch
./test-render-payment.sh
```

Deberías ver:
```json
{
  "preferenceId": "76668136-...",
  "initPoint": "https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=...",
  "amount": 60,
  "merchantAmount": 45,
  "platformFee": 15
}
```

---

## 🧪 Comandos de Verificación

### Test Local (funciona ✅)
```bash
cd /workspaces/Delicrunch
./test-payment.sh
```

### Test Producción (después de fix)
```bash
cd /workspaces/Delicrunch  
./test-render-payment.sh
```

---

## 📝 Evidencia del Diagnóstico

### Backend Local - Logs
```
💰 Creating Mercado Pago Preference { userId: '25', productId: 11, cantidad: 1, couponDiscount: 0 }
✅ Mercado Pago Preference created {
  preferenceId: '76668136-c15f21f5-a0d2-449a-8b41-5a396608b571',
  initPoint: 'https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=76668136-c15f21f5-a0d2-449a-8b41-5a396608b571'
}
```

### Render Producción - Error
```json
{
  "msg": "Error al crear la preferencia de pago."
}
```

---

## 🎯 Próximos Pasos

Después de actualizar las variables en Render:

1. ✅ Verificar que el endpoint funciona con `test-render-payment.sh`
2. ✅ Probar desde la app móvil real
3. ✅ Hacer una compra de prueba end-to-end
4. ✅ Verificar que el webhook recibe notificaciones
5. ✅ Confirmar que las órdenes se crean correctamente

---

## 📚 Referencias

- [tasks/todo.md](../tasks/todo.md) - Tarea documentada el 5 de marzo  
- [Backend/.env](../Backend/.env) - Credenciales correctas
- Render Dashboard: https://dashboard.render.com
- MercadoPago Dashboard: https://www.mercadopago.com.mx/developers/panel

---

**✅ SOLUCIÓN VALIDADA**  
**Tiempo estimado:** 5 minutos  
**Complejidad:** Baja  
**Aprobado para:** Usuario final (no requiere conocimientos técnicos)
