# 📋 Lista de Tareas Activas - Delicrunch

> **Última actualización:** 16 de marzo de 2026 — Fix MercadoPago integración deployado ✅
> **Estado del proyecto:** Backend fix en producción ✅ — Frontend actualizado ⚠️ requiere Metro reload
> **Próximo objetivo:** Reiniciar Metro → Probar pago real con tarjeta test → Verificar flujo E2E completo

---

## 🔴 URGENTE - PRÓXIMOS PASOS (17 Mar 2026)

### 1️⃣ Reiniciar Metro Bundler (Frontend requiere reload)
```bash
cd /workspaces/Delicrunch/Frontend
npm start --clear
```
**Motivo:** Código JS actualizado pero Metro NO está corriendo → app usa cache viejo

### 2️⃣ Recargar App en Dispositivo
- Shake device → "Reload" 
- O presionar `r` en terminal de Metro

### 3️⃣ Probar Pago Real (Tarjeta Test)
```
Tarjeta: 5031 7557 3453 0604
CVV: 123
Fecha: 11/25
Nombre: APRO
```
**Verificar:**
- ✅ Checkout de MP abre sin error
- ✅ Pago se completa exitosamente
- ✅ Orden creada en Supabase con estado='confirmado'
- ✅ Stock reducido en producto
- ✅ Webhook recibido en logs Render

### 4️⃣ Si Todo Funciona → Continuar Google Play
Ver sección "FASE 1 — REQUISITOS ADMINISTRATIVOS" abajo

---

## ✅ FIXES DEPLOYADOS (commit f3d7d1f + 539a283 — 16 Mar 2026)

| # | Fix | Archivo | Estado |
|---|-----|---------|--------|
| 1 | ❌ Removido `marketplace_fee` | `paymentController.js` | ✅ Deployado Render |
| 2 | ❌ Removido `expiration_date_from` | `paymentController.js` | ✅ Deployado Render |
| 3 | ✅ `external_reference` simplificado (256 char max) | `paymentController.js` | ✅ Deployado Render |
| 4 | ✅ `auto_return: 'approved'` agregado | `paymentController.js` | ✅ Deployado Render |
| 5 | ✅ Sistema códigos error CPT01-CPT99 | `errorCodes.js` (nuevo) | ⚠️ Requiere Metro reload |
| 6 | ✅ Error handling mejorado | `PaymentScreen.js` | ⚠️ Requiere Metro reload |
| 7 | ✅ Mapeo errores backend | `mercadoPagoService.js` | ⚠️ Requiere Metro reload |

**Documentación:** Ver `RESUMEN_CORRECCION_MP.md`, `PASOS_PRUEBA_PAGO.md`

---

## ✅ FIXES PREVIOS (commit 4800428 — 13 Mar 2026)

| # | Fix | Impacto |
|---|-----|---------|
| 1 | **Comisión 25% → 18%** en `getStoreMetrics` + `getStoreAnalytics` | Dashboard comercio mostraba ingresos incorrectos |
| 2 | **Webhook idempotente + transaccional** | Previene órdenes duplicadas por reintentos MP |
| 3 | **Webhook reduce stock** al aprobarse pago | Stock nunca bajaba al pagar con MercadoPago |
| 4 | **Webhook actualiza perfil** (CO2, ahorro, pedidos) del comprador | Gamificación no se activaba en compras reales |
| 5 | **`comision_plataforma` guardada** en BD al crear orden | Admin sin datos reales de comisiones |
| 6 | **AdminDashboardScreen + AdminTransactionsScreen** → `/admin/transactions` | Panel admin no mostraba transacciones (endpoint `/orders/all` no existía) |

---

## 🚀 RUTA GOOGLE PLAY — Estado Actual

```
[FASE 1 ADMIN]──►[FASE 2 ASSETS]──►[FASE 3 BUILD]──►[FASE 4 CONSOLA]──►[LANZAMIENTO]
  ✅ Cuenta           ⬜ Screenshots    ⬜ .aab build    ⬜ Upload          ⬜ Revisión
  ⬜ Privacy Policy   ✅ Icono OK       ⬜ Esperar EAS   ⬜ Listing         Google
                      ⬜ Feature Art                     ⬜ Testers
```

---

## 🔴 FASE 1 — REQUISITOS ADMINISTRATIVOS (Hacer Primero)

### A. Cuen                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           a Google Play Developer
- [x] **Cuenta creada ✅** (usuario confirmó — 13 Mar 2026)

### B. Política de Privacidad (OBLIGATORIA por Google)
- [ ] Crear documento de Política de Privacidad (puede ser Google Doc público o página simple)
- [ ] Debe cubrir: datos que se recopilan, MercadoPago, geolocalización
- [ ] Publicar en URL accesible (ej: `https://sites.google.com/view/delicrunch-privacy`)
- [ ] Guardar URL — se necesita en el listing

---

## 🟠 FASE 2 — ASSETS DEL LISTING (Paralelo a Fase 1)

### C. Icono de la App
- [x] **`assets/icon.png` — 1024×1024 PNG ✅** (EAS lo escala automáticamente a 512×512)

### D. Feature Graphic (Banner del listing)
- [ ] Crear imagen **1024×500 px PNG**
- [ ] Mostrar nombre `Delicrunch` + tagline (ej: "Rescata comida, ahorra dinero")
- [ ] Herramientas: Canva, Figma, o Adobe Express (gratis)
- [ ] No texto legible muy pequeño — Google lo puede rechazar

### E. Screenshots del dispositivo (mínimo 2, recomendado 4-8)
- [ ] Tomar desde dispositivo Android físico (build ya instalado ✅)
- [ ] **Pantallas recomendadas:**
  1. HomeScreen — listado de productos con packs disponibles
  2. ProductDetailScreen — detalle del pack con botón comprar
  3. PaymentScreen — flujo de pago con MercadoPago
  4. OrderConfirmationScreen — confirmación con XP ganado + CO₂ ahorr,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,, ado
- [ ] Formato: PNG o JPEG, mínimo 320px lado corto, máximo 3840px lado largo

### F. Textos del Listing
- [ ] **Nombre de la app** (máx 30 chars): `Delicrunch`
- [ ] **Descripción corta** (máx 80 chars):
  ```
  Rescata packs de comida a precio reducido y reduce el desperdicio alimentario.
  ```
- [ ] **Descripción larga** (máx 4000 chars) — ver borrador abajo ↓
- [ ] **Categoría:** Comida y bebida
- [ ] **Clasificación de contenido:** Para todos (formulario en consola)

<details>
<summary>📝 Borrador Descripción Larga (listo para copiar/editar)</summary>

```
¿Sabías que millones de kilos de comida perfectamente buena se tiran cada día?
Delicrunch conecta a compradores con comercios locales para rescatar packs sorpresa
de comida a precios reducidos — tú ahorras dinero, ellos reducen pérdidas y todos
contribuimos al planeta.

🛒 CÓMO FUNCIONA
1. Explora los packs disponibles en comercios cercanos
2. Paga de forma segura con MercadoPago
3. Recoge tu pack en la hora acordada
4. ¡Disfruta de comida deliciosa a hasta un 70% de descuento!

🎮 GAMIFICACIÓN — HAZ DEL BIEN Y SUBE DE NIVEL
• Gana XP por cada compra realizada
• Sube de Bronce a Diamante con 15 niveles de progreso
• Desbloquea badges por logros especiales
• Obtén cupones de descuento automáticos al subir de nivel

🌱 IMPACTO AMBIENTAL REAL
Cada compra muestra exactamente cuántos kg de CO₂ dejaste de emitir.
Conviértete en un héroe del medio ambiente sin esfuerzo extra.

💼 PARA COMERCIOS
¿Eres dueño de un restaurante, panadería, cafetería o supermercado?
Registra tu negocio, publica tus packs sobrantes y convierte pérdidas en ingresos.
Panel de administración completo con gestión de pedidos y estadísticas.

🔒 PAGOS SEGUROS
Integración oficial con MercadoPago — el método de pago líder en latinoamérica.
```
</details>

---

## 🟡 FASE 3 — BUILD DE PRODUCCIÓN .aab

### G. Generar Android App Bundle
- [ ] Ejecutar en terminal:
  ```bash
  cd Frontend && eas build --profile production --platform android
  ```
- [ ] Esperar ~10-15 min (build en servidores de Expo)
- [ ] Descargar `.aab` cuando esté listo desde [expo.dev](https://expo.dev)
- [ ] **Datos del build:**
  - Package: `com.delicrunch.app`
  - Versión: `1.1.0` (versionCode: 2)
  - API URL: `https://delicrunch.onrender.com/api` ✅ (ya configurado en eas.json)

---

## 🟢 FASE 4 — GOOGLE PLAY CONSOLE

### H. Crear la app en Google Play Console
- [ ] Nueva app → Nombre: "Delicrunch" → Idioma: Español
- [ ] Package: `com.delicrunch.app`
- [ ] Tipo: App → Categoría: Comida y bebida → Gratuita

### I. Completar Ficha de la tienda
- [ ] Subir icono, feature graphic, screenshots
- [ ] Pegar descripción corta y larga
- [ ] Agregar URL de política de privacidad

### J. Configurar versión de prueba interna
- [ ] Track: **Pruebas internas** (Internal testing)
- [ ] Subir .aab
- [ ] Invitar testers por email (mínimo tú mismo)
- [ ] Instalar desde Google Play (link de prueba interna) y verificar flujo completo

### K. Declaraciones obligatorias en consola
- [ ] Clasificación de contenido (cuestionario ~5 min)
- [ ] Declaración de acceso a datos (DataSafety form)
- [ ] Declaración de anuncios (ninguno → seleccionar "No contiene anuncios")
- [ ] Declaración de pagos in-app (MercadoPago es pago externo, NO in-app purchase)

### L. Enviar a revisión
- [ ] Cambiar a track **Producción** (o primero Cerrada → Abierta → Producción)
- [ ] Revisión de Google: 1-7 días hábiles
- [ ] Responder si Google solicita cambios

---

## ⚠️ PENDIENTES TÉCNICOS — Revisados 13 Mar 2026

### M. Verificar webhook MercadoPago en producción
**Estado:** Webhook refactorizado — transaccional + idempotente + reduce stock ✅ (commit 4800428)
- [ ] Hacer una compra real con tarjeta de prueba en dispositivo físico
- [ ] Verificar en DB que se crea la orden + baja el stock + sube XP (profiles)
- [ ] Revisar logs de Render para confirmar webhook llegó: `✅ Order created from webhook`
- [ ] **Prioridad:** Alta — es la verificación final E2E del flujo core

### N. Comercios en producción (Seed)
**Estado:** ✅ COMPLETADO — 3 comercios con 9 productos activos en Supabase producción
- [x] Taquería las Delicias (3 packs) — store_id: 4
- [x] Pizza Orsinis (3 packs) — store_id: 5
- [x] Café Placeres (3 packs) — store_id: 6

### O. Favoritos — Decisión de arquitectura
**Estado:** `FavoritesScreen.js` usa solo `AsyncStorage` local
- [ ] **Opción A:** Dejar local (scope actual, documentar limitación) ← **Recomendado para v1**
- [ ] **Opción B:** Crear endpoint `POST /api/profiles/favorites` + tabla `favorites` en DB
- [ ] **Prioridad:** Baja — no afecta funcionalidad core

### P. AdminMetricsScreen — endpoints correctos
**Estado:** Pantalla usa `/admin/metrics/overview`, `/admin/metrics/trends`, `/admin/metrics/by-store` — todos existen ✅
- [x] Endpoints de métricas admin implementados y funcionando

---

## 🔵 BACKLOG (Post-lanzamiento)

- [ ] Notificaciones push (Expo Push + backend) para cambios de estado de órdenes
- [ ] Pantalla historial de pagos más detallada
- [ ] Build iOS para App Store (requiere cuenta Apple Developer $99/año)
- [ ] Panel web para comercios (React/Next.js)

---

## ✅ COMPLETADO — Resumen de sesiones anteriores

| Fecha | Tarea | Evidencia |
|-------|-------|-----------|
| 11 Mar 2026 | Split 18%/82% verificado en producción | Commit `f402100`, `merchantAmount: 49.2` ✅ |
| 11 Mar 2026 | APK funcionando en dispositivo Android físico | Login + pago E2E ✅ |
| 11 Mar 2026 | Sistema de gamificación verificado | `/api/profiles/gamification` devuelve XP/niveles/badges ✅ |
| 11 Mar 2026 | Webhook MercadoPago configurado | `https://delicrunch.onrender.com/api/payments/webhook` ✅ |
| 12 Mar 2026 | Sistema de reseñas — 3 bugs críticos corregidos | Commit `138076e`, deploy en Render ✅ |
| 12 Mar 2026 | reviews/admin/all funciona en producción | `total=0` (0 reseñas, sin error SQL) ✅ |
| 13 Mar 2026 | **Comisión 25% → 18%** en métricas de comercio | Commit `4800428` ✅ |
| 13 Mar 2026 | **Webhook idempotente + transaccional + reduce stock** | Commit `4800428` — previene duplicados y reduce stock al pagar ✅ |
| 13 Mar 2026 | **Admin panel**: AdminDashboard + AdminTransactions usan endpoint real | Commit `4800428` — antes fallaba silenciosamente ✅ |
| 13 Mar 2026 | **comision_plataforma** guardada en BD al crear orden | Commit `4800428` — métricas admin ahora precisas ✅ |

**Bugs corregidos (Commit `138076e` — 12 Mar 2026):**
- `r.nombre_producto` (no existe) → `p.nombre` en `getAllReviews` — causaba 500 en producción
- `createReview` ahora guarda `store_id` obtenido de la orden/producto
- `getMyStoreReviews` corregido: JOIN por `products.store_id` en vez de `reviews.store_id` (NULL siempre)

---

## 📌 Orden de Ejecución Recomendado

```
HOY (validar sistema core):
  1. [M] Hacer compra real → verificar en DB: orden creada + stock -1 + perfil actualizado
  2. Confirmar: comercio ve el pedido en MerchantOrdersScreen
  3. Comercio marca pedido como "listo" → cliente ve el cambio en MyOrdersScreen
  4. Comercio marca "recogido" → verificar balance 82% en MerchantDashboard

ESTA SEMANA (preparar Google Play):
  5. [B] Redactar y publicar política de privacidad
  6. [D] Crear Feature Graphic 1024×500 (Canva gratis)
  7. [E] Tomar screenshots desde el dispositivo (HomeScreen, ProductDetail, PaymentScreen, OrderConfirmation)

CUANDO TENGAS ASSETS LISTOS:
  8. [G] `cd Frontend && eas build --profile production --platform android`
  9. [H-L] Completar consola y subir .aab
```
