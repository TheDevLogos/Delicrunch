# 📋 Lista de Tareas Activas - Delicrunch

> **Última actualización:** 31 de marzo de 2026 — UI/UX nav fixes ✅ · Perfiles tiendas + portada (v2 UX) IN PROGRESS
> **Estado del proyecto:** Backend en producción ✅ · Leaderboard real ✅ · Cupones schema pending ⚠️ · Pagos MP estructura ready ⚠️
> **Próximo objetivo:** Portada tiendas visibles + Modal promociones iniciales → Lanzamiento Google Play

---

## 🔴 URGENTE (1 solo paso pendiente — 5 minutos)

### 1️⃣ EJECUTAR MIGRACIÓN EN SUPABASE
**Por qué:** Las tablas `coupon_definitions`, `user_coupons` y `xp_transactions` NO existen en producción.
Mientras no se ejecute: tab Cupones → error 500, stats de gamificación incompletas.

**Cómo:**
1. Abrir → [supabase.com/dashboard](https://supabase.com/dashboard) → tu proyecto Delicrunch
2. Menú izquierdo → **SQL Editor** → **New Query**
3. Copiar y pegar el archivo completo: `Backend/db/migrations/gamification_migration.sql`
4. Click **Run** (▶)
5. Verificar que el resultado final muestre **14 filas** en `coupon_definitions`

**Resultado esperado al final:**
```
tabla                    | filas
coupon_definitions       | 14
user_coupons             | 0
xp_transactions          | 0
profiles_con_total_xp   | (número de usuarios)
```

---

## ✅ VERIFICADO EN PRODUCCIÓN (20 Mar 2026 — post redeploy)

| Endpoint | Estado | Detalle |
|---|---|---|
| `GET /api/health` | ✅ | Backend activo en Render |
| `GET /api/profiles/leaderboard` | ✅ | Ranking real: 1 usuario (Test, 483 XP, Bronce) |
| `GET /api/profiles/gamification` | ✅ | 483 XP, 5 packs, 2 badges, $340 ahorrados |
| `GET /api/coupons/my` | ✅ | Responde (0 cupones activos — normal) |
| `GET /api/coupons/definitions` | ❌ | Error 500 — tabla no existe (pendiente migración) |
| `GET /api/coupons/stats` | ⚠️ | `currentLevel: 1` stale — se corrige al ejecutar migración |

---

## ✅ DEPLOYADO HOY (commit 11f5dfe — 20 Mar 2026)

| # | Fix/Feature | Estado |
|---|-------------|--------|
| 1 | **Fix crítico `db/index.js`** — SyntaxError en startup | ✅ Producción |
| 2 | **Endpoint `GET /api/profiles/leaderboard`** — ranking real | ✅ Producción |
| 3 | **`postGamification` persiste `current_level`** | ✅ Producción |
| 4 | **`postGamification` persiste racha completa** | ✅ Producción |
| 5 | **`getLevelCoupons` nivel dinámico desde `total_xp`** | ✅ Producción |
| 6 | **`gamification_migration.sql`** — listo para Supabase | ✅ En repo |
| 7 | **`CouponModal` rediseñado** completo | ✅ Frontend |
| 8 | **53 avatares** expandidos | ✅ Frontend |
| 9 | **Headers duplicados** eliminados | ✅ Frontend |

---

## 🚀 RUTA GOOGLE PLAY — Estado Actual

```
[FASE 1 ADMIN]──►[FASE 2 ASSETS]──►[FASE 3 BUILD]──►[FASE 4 CONSOLA]──►[LANZAMIENTO]
  ✅ Cuenta           ⬜ Screenshots    ⬜ .aab build    ⬜ Upload          ⬜ Revisión
  ✅ Privacy Policy   ✅ Icono OK       ⬜ Esperar EAS   ⬜ Listing         Google
  (HTML lista)        ⬜ Feature Art                     ⬜ Testers
```

---

## 🔴 FASE 1 — REQUISITOS ADMINISTRATIVOS

### A. Cuenta Google Play Developer
- [x] **Cuenta creada ✅** (13 Mar 2026)

### B. Política de Privacidad
- [x] **Archivo `privacy-policy.html` creado ✅** (20 Mar 2026)
- [ ] **Publicar online** — opciones (elige una):
  - **Opción A — Google Sites (gratis, 5 min):**
    1. Ir a [sites.google.com](https://sites.google.com) → Crear sitio nuevo
    2. Título: "Delicrunch Privacy Policy"
    3. Insertar → Embed → pegar el HTML de `privacy-policy.html`
    4. Publicar → copiar URL pública (ej: `https://sites.google.com/view/delicrunch-privacy`)
  - **Opción B — GitHub Pages (si tienes cuenta GitHub configurada):**
    ```bash
    # El archivo ya está en el repo, solo activar GitHub Pages
    # Settings → Pages → Source: main → /privacy-policy.html
    ```
- [ ] Guardar la URL — se necesita en Google Play Console

---

## 🟠 FASE 2 — ASSETS DEL LISTING

### C. Icono de la App
- [x] **`Frontend/assets/icon.png` — 1024×1024 PNG ✅**

### D. Feature Graphic (Banner)
- [ ] Crear imagen **1024×500 px PNG** con nombre `Delicrunch` + tagline
- [ ] Herramienta recomendada: [Canva](https://canva.com) → "Presentation 16:9" → cambiar a 1024×500
- [ ] Exportar como PNG

### E. Screenshots (mínimo 2, recomendado 4-8)
- [ ] Tomar desde dispositivo Android con la app instalada
- [ ] Pantallas recomendadas:
  1. **HomeScreen** — packs disponibles de comercios
  2. **ProductDetailScreen** — detalle de pack con botón Comprar
  3. **RewardsScreen (Overview)** — nivel, XP, barra progreso
  4. **RewardsScreen (Ranking)** — leaderboard de usuarios reales

### F. Textos del Listing (listos para copiar)
- [x] **Nombre:** `Delicrunch` (10 chars / máx 30)
- [x] **Descripción corta** (78 chars):
  ```
  Rescata packs de comida a precio reducido y reduce el desperdicio alimentario.
  ```
- [x] **Descripción larga:** Ver sección expandible abajo
- [x] **Categoría:** Comida y bebida
- [x] **Contenido:** Para todos

<details>
<summary>📝 Descripción larga — lista para copiar en Google Play Console</summary>

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
• Compite en el ranking con otros salvadores de comida

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
```bash
cd /workspaces/Delicrunch/Frontend
eas build --profile production --platform android
```
- Esperar ~10-15 min (build en servidores de Expo)
- Descargar `.aab` desde [expo.dev](https://expo.dev)
- **Datos del build:** Package `com.delicrunch.app` · Versión `1.1.0` · versionCode `2`
- **API URL en build:** `https://delicrunch.onrender.com/api` ✅

---

## 🟢 FASE 4 — GOOGLE PLAY CONSOLE

### H. Crear la app
- Nueva app → "Delicrunch" → Español → Comida y bebida → Gratuita → Package: `com.delicrunch.app`

### I. Ficha de la tienda
- Subir: icono (1024×1024), feature graphic (1024×500), screenshots
- Pegar descripción corta y larga (ver Fase 2-F)
- Agregar URL política de privacidad (de Fase 1-B)

### J. Prueba interna (Internal Testing)
- Track: Pruebas internas → Subir .aab → Invitar tester por email → Instalar y verificar

### K. Declaraciones obligatorias
- [ ] Clasificación de contenido (cuestionario ~5 min)
- [ ] Data Safety form (permisos: email, nombre, historial de pedidos)
- [ ] "No contiene anuncios"
- [ ] MercadoPago es pago EXTERNO — NO in-app purchase

### L. Enviar a revisión → Producción
- Revisión Google: 1-7 días hábiles

---

---

## 🎯 V. PERFILES y PORTADAS (Para miércoles — Lanzamiento)

### V.A. Portada de Tiendas (Cover Image)
**Estado:** Auditoría completa — SEGURO implementar (ver [`AUDITORIA_PORTADA_STORES.md`](AUDITORIA_PORTADA_STORES.md))

- [ ] **Backend:** Actualizar SELECT en storeController para incluir `cover_url` (20 min)
  - `getAllStores()` — agregar `cover_url` al SELECT
  - `getStoresWithProducts()` — agregar `cover_url` al SELECT
  - `getStoreById()` — agregar `cover_url` al SELECT
- [ ] **Backend:** Crear `PUT /api/stores/me/cover` — upload endpoint (25 min)
- [ ] **Frontend:** Renderizar portada en `StoreProfileScreen` hero (20 min)
- [ ] **Frontend:** Crear `UploadCoverModal.js` reutilizable (25 min)
- [ ] **Frontend:** Botón "📷 Editar Portada" en `MerchantDashboardScreen` (10 min)
- [ ] **Test:** Portada visible en perfil tienda (comprador) + upload funciona

**Prioridad:** ALTA — Comercios ven su propia tienda realista, compradores ven tienda con identidad visual

---

### V.B. Modal Inicial - Promociones (Onboarding)
**Estado:** Listo para UI nuevo

- [ ] Crear `PromotionalOnboardingModal.js` en componentes (30 min)
- [ ] Mostrar 1 sola vez al primer login (localStorage `@delicrunch_promo_seen`)
- [ ] Contenido: 3 slides (XP system, Cupones, CO2 impact) o simple modal
- [ ] Integrar en `AuthContext` o `ProfileScreen` init

**Prioridad:** MEDIA — Nice to have para retención

---

### V.C. Modales de XP al Comprar
**Estado:** Existe pero revisar diseño

- [ ] Revisar `XPRewardsModal.js` en componentes
- [ ] Asegurar visible + animaciones suave
- [ ] Test en OrderConfirmationScreen

**Prioridad:** BAJA — Funciona, solo perfeccionar

---

## ⚠️ PENDIENTES TÉCNICOS (Anterior)
- [ ] Hacer compra con tarjeta test `5031 7557 3453 0604` CVV `123` Fecha `11/25` Nombre `APRO`
- [ ] Verificar en Supabase: orden creada + stock -1 + XP sumado en `profiles` + `xp_transactions` creado
- [ ] Verificar en Render logs: `✅ Order created from webhook`

### MP. Estado MercadoPago y pagos
- [ ] `GET /api/payments/user-status` responde `{totalPayments:0, hasMercadoPagoAccount:false}` → OK para estado inicial
- [ ] `POST /api/payments/create` actualmente devuelve `404 Not Found` (endpoint no implementado en backend, pendiente)
- [ ] Ajustar `PaymentScreen` + `mercadoPagoService.js` para flujos de pago cuando el endpoint esté disponible
- [ ] Confirmar en backend que `mongo`/Status `mercadoPago` dice `active` (aun con credenciales de producción)

### UX/UI: navegación y responsive
- [x] Evitar duplicado de botón "atrás":
  - `ProductDetail` ahora `headerShown: false` en `AppNavigator` (antes estaba `true`)
- [ ] Revisar otras rutas y componentes con header personalizado vs stack header
- [ ] Verificar que las pantallas usan `SafeAreaView` + padding inferior en Android (navbar) y en iOS (bottom inset)
- [ ] Validar que no haya un `ScrollView` con `height: 1000` estático; usar `flex:1`, `width:'100%'`, `maxWidth` global

### N. Favoritos (Decisión pendiente)
- [ ] **Opción A (recomendada v1):** Dejar en AsyncStorage local — sin cambios
- [ ] **Opción B:** Crear tabla `favorites` + `POST /api/profiles/favorites`

---

## 📌 Orden de Ejecución Recomendado

```
HOY (5 min — desbloquea cupones y stats):
  1. Ejecutar gamification_migration.sql en Supabase SQL Editor

ESTA SEMANA (preparar Google Play):
  2. Publicar privacy-policy.html online (Google Sites — 5 min)
  3. Crear Feature Graphic 1024×500 en Canva
  4. Tomar 4 screenshots desde el dispositivo
  5. cd Frontend && eas build --profile production --platform android

CUANDO TENGAS .aab:
  6. Completar Google Play Console (H → K)
  7. Enviar a revisión → Lanzamiento
```


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
