# 🧪 Pasos para Probar el Pago Corregido

## 1️⃣ Verificar Deployment en Render

Render ha detectado el push y está desplegando automáticamente.

**Monitorear deployment:**
- Ve a: https://dashboard.render.com/
- Busca el servicio "delicrunch" (o el nombre de tu backend)
- Ve a "Events" o "Logs"
- Espera a ver: "Build successful" y "Deploy live"

**Tiempo estimado:** 2-3 minutos

---

## 2️⃣ Verificar que el Backend Esté Actualizado

Espera 3 minutos y ejecuta:

```bash
./test-payment-production.sh
```

**Resultado esperado:**
```
✅ Backend saludable
✅ Login exitoso
✅ Productos disponibles
✅ Preferencia creada exitosamente!
```

---

## 3️⃣ Probar Pago Desde la App Móvil

### Opción A: Con Expo Go (Desarrollo)

1. Asegúrate de que el frontend esté ejecutándose
2. Abre Expo Go en tu dispositivo
3. Selecciona un producto
4. Haz clic en "Comprar"
5. En la pantalla de pago, presiona "Completar Compra"

### Opción B: Con Build de Producción

Si ya tienes un build instalado en tu dispositivo:
1. Abre la app
2. Inicia sesión
3. Selecciona un producto
4. Procede al checkout

---

## 4️⃣ Completar el Pago en MercadoPago

Cuando se abra el navegador con Checkout Pro:

### Usar Tarjeta de Prueba (Modo Producción - Aprobada)

**IMPORTANTE:** Aunque estés en producción, MP permite tarjetas de prueba:

```
Tarjeta: 5031 7557 3453 0604
CVV: 123
Fecha de expiración: 11/25
Titular: APRO (Apellido de prueba para aprobación)
DNI: 12345678
```

**Otras tarjetas de prueba de MP:**
- **Aprobada:** 5031 7557 3453 0604 (APRO)
- **Rechazada:** 5031 4332 1540 6351 (OTHE)
- **Pendiente:** 5031 4332 1540 6351 (CALL)

**Ref:** https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/additional-content/test-cards

---

## 5️⃣ Verificar el Resultado

### En la App:

**Flujo exitoso:**
1. ✅ Checkout se abre sin error
2. ✅ Puedes ingresar datos de la tarjeta
3. ✅ Al confirmar, MP procesa el pago
4. ✅ Recibes confirmación en la app
5. ✅ El navegador se cierra
6. ✅ Ves el código de recogida

### En el Backend (Logs de Render):

```
📩 Mercado Pago Webhook received
💳 Payment details: { status: 'approved' }
📦 Order data extracted
✅ Order created from webhook
```

### En la Base de Datos:

Verifica en Supabase que se creó registro en:
- **Tabla:** `orders`
- **Campo:** `estado` = 'confirmado'
- **Campo:** `mercadopago_payment_id` con el ID del pago

---

## 6️⃣ Solución de Problemas

###  Error al Abrir Checkout

**Posible causa:** Backend aún no desplegado
**Solución:** Espera 1-2 minutos más y reintenta

### ⚠ Error en Pantalla de MercadoPago

**Posible causa:** Algún campo mal configurado
**Solución:** 
1. Revisa logs de Render
2. Busca el mensaje "📝 Preference data to send"
3. Copia el JSON y compártelo para análisis

### ⚠ Pago Aprobado pero No Se Crea Orden

**Posible causa:** Webhook no está funcionando
**Solución:**
1. Verifica que la URL del webhook esté configurada en MP:
   `https://delicrunch.onrender.com/api/payments/webhook`
2. Revisa logs de Render en los minutos posteriores al pago
3. Busca "📩 Mercado Pago Webhook received"

---

## 7️⃣ Información de Debug

Si encuentras errores, necesitaremos:

1. **Código de error de la app** (si lo muestra)
2. **Screenshot del error en MercadoPago**
3. **Logs del backend de Render** (últimas 50 líneas)
4. **Hora exacta del intento** (para buscar en logs)

Para obtener logs de Render:
```bash
# Desde Render Dashboard:
# 1. Ve a tu servicio > Logs
# 2. Filtra por timestamp del error
# 3. Busca líneas que empiecen con ❌ o ⚠️
```

---

## ✅ Resultado Esperado Final

Si todo funciona correctamente:

1. ✅ No hay error al abrir checkout de MP
2. ✅ Puedes completar el pago con tarjeta de prueba
3. ✅ Recibes confirmación visual en la app
4. ✅ Se crea orden en la base de datos
5. ✅ El webhook procesa correctamente la notificación
6. ✅ Puedes ver tu pedido en "Mis Pedidos"

**¡La app está lista para procesar pagos reales!** 🎉

---

## 📞 Próximo Paso

Una vez confirmado que funciona:
- Sube la app a Google Play Console
- Cambia las tarjetas de prueba por pagos reales
- Monitorea los primeros pagos cuidadosamente

