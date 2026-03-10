# 📋 Lista de Tareas Activas - Delicrunch

> **Última actualización:** 10 de marzo de 2026 — Bugs de reviewController y PROJECT_CONTEXT resueltos
> **Estado del proyecto:** Bloqueadores CRÍTICOS resueltos ✅ — Pendientes: APK prueba + funcionalidades opcionales

---

## ✅ BLOQUEADORES CRÍTICOS — RESUELTOS (10 Mar 2026)

### 1. [MANUAL] ~~Actualizar Variables de Entorno en Render~~ ✅ HECHO
- [x] Render actualizado con nuevas credenciales MP + re-deploy completado
- [x] Prueba desde la app verificada exitosamente

### 2. [MANUAL] ~~Configurar Webhook de MercadoPago~~ ✅ HECHO
- [x] Webhook `payment` configurado en panel MP → `https://delicrunch.onrender.com/api/payments/webhook`

---

## ✅ BUGS EN CÓDIGO — RESUELTOS (10 Mar 2026)

### 3. ~~reviewController.js — Columnas en inglés~~ ✅ CORREGIDO
- [x] `o.seller_id` → `o.store_id` en query de validación de pedido
- [x] `p.name` → `p.nombre` en createReview, purchaseCheck, getAllReviews, getStoreReviewStats
- [x] `u.name` → `u.nombre` en getAllReviews
- [x] `p.seller_id` → subquery `store_id` en getStoreReviewStats
- [x] `o.status` → `o.estado` + valores a español (`'listo', 'entregado', 'completado', 'confirmado'`)
- [x] INSERT/UPDATE `rating, comment` → `calificacion, comentario`
- [x] `AVG(r.rating)` → `AVG(r.calificacion)` en estadísticas
- [x] `updateProductAverageRating` deshabilitada (columnas no existen en schema)

### 4. ~~reviewController.js — Funcionalidades no implementadas~~ ✅ ACEPTADO
- [x] Responder admin/comercio + visibilidad: retornan 501 controlado — límite de negocio aceptado

### 5. ~~PROJECT_CONTEXT.md — Valores de rol desactualizados~~ ✅ CORREGIDO
- [x] `'buyer', 'seller'` → `'comprador', 'comercio'` en documentación de tabla `users`

---

## 🟠 VERIFICACIONES DE PRODUCCIÓN PENDIENTES

### 6. Verificar split 18%/82% en producción
**Criterio de éxito:** Respuesta de `create-preference` incluye `platformFeeAmount` correcto
- [ ] Ejecutar `./test-render-payment.sh` → verificar campo `platformPercentage: 18` en respuesta
- [ ] Verificar `GET /api/payments/merchant-balance` en producción retorna datos reales

### 7. APK de Prueba — Build 560a0616
**Criterio de éxito:** App instalada en Android físico, flujo completo de pago funciona
- [ ] Verificar estado del build: https://expo.dev/accounts/alonsovl88/projects/delicrunch-frontend/builds/560a0616-7143-4051-888e-9b8d003d5158
- [ ] Descargar APK e instalar en Android físico
- [ ] Flujo E2E: Login → Producto → PaymentScreen → MP Checkout → deep link `delicrunch://payment-result`
- [ ] Verificar que el resultado de pago (éxito/error) se muestra correctamente en app

---

## 🟡 FUNCIONALIDADES INCOMPLETAS

### 8. FavoritesScreen — Favoritos solo en AsyncStorage local
**Criterio de éxito:** Favoritos persisten entre dispositivos, sincronizados con el servidor
- [ ] **Estado actual:** `FavoritesScreen.js` usa exclusivamente `AsyncStorage` — no hay endpoint de favoritos en el backend
- [ ] Decisión: ¿implementar backend de favoritos (`/api/profiles/favorites`) o dejar como feature local?
  - Si se implementa: crear endpoint + tabla `favorites` en DB + migrar frontend
  - Si se deja local: aceptar limitación y documentarla como alcance actual

### 9. PaymentScreen — Datos de orden "simulados hasta webhook"
**Criterio de éxito:** Estado de pago refleja el resultado real del webhook de MP
- [ ] **Estado actual:** Línea 339 en `PaymentScreen.js`: "Calcular datos de la orden (simulados hasta que llegue el webhook)"
- [ ] Verificar en producción (después de tarea #1 y #2) que el webhook actualiza el estado de la orden correctamente
- [ ] Si el webhook no llega, el estado de la orden quedará en 'pendiente' indefinidamente

---

## 🟢 GOOGLE PLAY STORE — Preparación de Listing

### 10. Preparar assets y textos para listing
**Criterio de éxito:** Listing completo en Google Play Console listo para revisión
- [ ] Capturas de pantalla de pantallas principales (mínimo 4): HomeScreen, ProductDetailScreen, PaymentScreen, OrderConfirmationScreen
- [ ] Descripción corta (máx 80 chars) en español
- [ ] Descripción larga (4000 chars) en español
- [ ] Política de privacidad URL (obligatoria por Google) — puede ser un Google Doc
- [ ] Verificar `assets/icon.png` es 512×512 PNG

### 11. Build de producción para Google Play (.aab)
**Criterio de éxito:** Archivo `.aab` generado y subido a Google Play Console → Pruebas internas
- [ ] `cd Frontend && eas build --profile production --platform android`
- [ ] Subir `.aab` a Google Play Console → Pruebas internas primero
- [ ] Pasar a revisión cuando el flujo de pago esté verificado en device real

---

## 🔵 PRIORIDAD BAJA

- [ ] Notificaciones push para cambios de estado de órdenes (requiere Expo Push + backend)
- [ ] Pantalla de historial de pagos más detallada
- [ ] Script de health-check automático al iniciar backend (verifica Supabase, MP config, etc.)

---

## ✅ Completado en Sesión 10 Mar 2026

### Diagnóstico y Solución de Error de Pagos
- [x] **Diagnostiado error "no se pudo crear referencia de pago"**
  - Usuario reportó imposibilidad de pagar desde la app
  - Metodología Senior Dev: verificar toda la cadena de componentes
- [x] **Backend local verificado** → ✅ FUNCIONA (crea preferencias exitosamente)
- [x] **Backend Render verificado** → ❌ FALLA (credenciales MercadoPago antiguas)
- [x] **Causa raíz identificada:** Variables de entorno desincronizadas
- [x] **Solución documentada** → [SOLUCION_ERROR_PAGO.md](../SOLUCION_ERROR_PAGO.md)
- [x] **Scripts de prueba creados:**
  - `test-payment.sh` (prueba local)
  - `test-render-payment.sh` (prueba producción)
- [x] **Lecciones capturadas en lessons.md:**
  - Patrón: Variables de entorno desincronizadas
  - Patrón: Diagnóstico incompleto (confundir síntoma con causa raíz)

### Evidencia del Diagnóstico
**Local:** ✅ Preferencia creada → `preferenceId: "76668136-c15f21f5..."`  
**Render:** ❌ Error → `{"msg": "Error al crear la preferencia de pago."}`

---

## 🔴 Prioridad Alta - ACCIÓN REQUERIDA

### [MANUAL] Actualizar Variables de Entorno en Render
⚠️ **BLOQUEADOR:** Los usuarios no pueden pagar hasta completar esto

**Pasos para resolver:**
1. Ve a https://dashboard.render.com
2. Busca el servicio "delicrunch" (backend)
3. Ve a Environment → Actualizar:
   ```env
   MERCADOPAGO_PUBLIC_KEY=APP_USR-9ba7aa3b-9864-48b9-8b7c-271a5cf44549
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-7704331481200418-012213-c2709cec9688c4aec321f267d1c70100-76668136
   ```
4. Save Changes → esperar re-deploy (2-3 min)
5. Verificar con: `cd /workspaces/Delicrunch && ./test-render-payment.sh`

**Resultado esperado:**
```json
{
  "preferenceId": "76668136-...",
  "initPoint": "https://www.mercadopago.com.mx/checkout/...",
  "amount": 60,
  ...
}
```

---

## ✅ Completado en Sesión 10 Mar 2026

### Diagnóstico y Solución de Error de Pagos
- [x] **Diagnosticado error "no se pudo crear referencia de pago"** — metodología Senior Dev
- [x] **Backend local verificado** → ✅ FUNCIONA
- [x] **Backend Render verificado** → ❌ FALLA (credenciales MP antiguas)
- [x] **Causa raíz identificada:** Variables de entorno desincronizadas
- [x] **Scripts de prueba creados:** `test-payment.sh`, `test-render-payment.sh`
- [x] **Lecciones capturadas en lessons.md:** 2 nuevos patrones
- [x] **Revisión completa WORKFLOW_GUIDELINES ejecutada** — todo.md actualizado con criterios medibles

### Hallazgos de la Revisión Completa (10 Mar)
- [x] Split 18%/82% ✅ implementado en código (`paymentController.js` línea 95)
- [x] FlashDealModal ✅ implementado con 3 clasificaciones en DiscoverScreen
- [x] Sistema CO2 ✅ implementado en frontend y backend
- [x] Sistema de cupones ✅ implementado (endpoints registrados `/api/coupons`)
- [x] Todos los endpoints principales ✅ registrados en `server.js`
- [x] `reviewController.js` líneas 68,99,293,296,448 ⚠️ identificadas con columnas en inglés — pendiente fix (tarea #3)
- [x] `FavoritesScreen.js` ⚠️ usa solo AsyncStorage local — no hay backend de favoritos (tarea #8)

---

## ✅ Completado en Sesión 5 Mar 2026

### Verificaciones y correcciones del build
- [x] **Render producción verificado** — backend vivo, login OK, products/stores OK
- [x] **MP create-preference local** → preferenceId `76668136-c8237101-...` (cuenta producción confirmada)
- [x] **Reset passwords 6 usuarios semilla** → todos con `Test1234!`
- [x] **Audit completo de 11 endpoints** → todos 200 OK
- [x] **eas.json** → nueva clave MP producción `APP_USR-9ba7aa3b-...` en los 3 perfiles
- [x] **app.json** → `versionCode: 2` para Android
- [x] **AuthProvider flujo verificado** → signIn llama `/profiles/me` que ya devuelve `rol`; no necesita decodificar JWT
- [x] **Commit 9586134 pusheado** a GitHub
- [x] **eas build preview APK lanzado** → Build ID: `560a0616-7143-4051-888e-9b8d003d5158`

---

## ✅ Completado en Sesión 4 Mar 2026

### Bugs Corregidos (7 críticos)
- [x] **db/index.js - Pool no persistente** → Pool PG creaba nueva conexión por query. Corregido: pool único reutilizable
- [x] **paymentController - merchantSetup SQL roto** → SQL con `updated_at =user_id` sin WHERE. Corregido: columnas reales del schema
- [x] **paymentRoutes - middleware getStoreId faltante** → merchant-balance y merchant-payouts sin el middleware. Corregido
- [x] **paymentController - transacciones sin cliente dedicado** → BEGIN/COMMIT con pool.query() en lugar de client.query(). Corregido
- [x] **authController - roles mapeados al inglés** → comprador→buyer violaba constraint DB. Corregido: español correcto
- [x] **eas.json - builds sin variables de entorno** → preview/production sin EXPO_PUBLIC_API_URL. Corregido
- [x] **PaymentScreen - sandboxInitPoint en producción** → Ahora usa __DEV__ para selector correcto
- [x] **Credenciales MercadoPago actualizadas** → Nuevas creds de producción en Backend/.env y Frontend/.env

### Pruebas Exitosas
- ✅ Backend conecta a Supabase (pool persistente)
- ✅ Servidor arranca sin errores
- ✅ Login funciona (testbuyer2@delicrunch.com / Test1234!)
- ✅ MercadoPago create-preference E2E → init_point real generado
- ✅ Products endpoint (9 productos), Stores (3 tiendas)

---

## 🔑 Credenciales y Datos Clave

### MercadoPago Producción (Checkout Pro)
```
Public Key:    APP_USR-9ba7aa3b-9864-48b9-8b7c-271a5cf44549
Access Token:  APP_USR-7704331481200418-012213-c2709cec9688c4aec321f267d1c70100-76668136
User ID:       76668136
App ID:        7704331481200418
```

### Usuario de prueba funcional (creado 4 Mar)
```
Email:    testbuyer2@delicrunch.com
Password: Test1234!
Rol:      comprador
```

### Backend local
```
URL:  http://localhost:5001
BD:   Transaction Pooler Supabase puerto 6543
```

### Backend producción
```
URL: https://delicrunch.onrender.com
```

### Supabase
```
URL:     https://pruesizqytpscldieivb.supabase.co
Proyecto: pruesizqytpscldieivb
```
