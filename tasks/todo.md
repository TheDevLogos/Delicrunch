# 📋 Lista de Tareas Activas - Delicrunch

> **Última actualización:** 12 de marzo de 2026 — Sistema de reseñas corregido y deployado ✅
> **Estado del proyecto:** Backend + Frontend funcionando en producción ✅ — APK instalado en device real ✅
> **Próximo objetivo:** Publicación en Google Play Store

---

## 🚀 RUTA GOOGLE PLAY — Estado Actual

```
[FASE 1 ADMIN]──►[FASE 2 ASSETS]──►[FASE 3 BUILD]──►[FASE 4 CONSOLA]──►[LANZAMIENTO]
  ⬜ Cuenta           ⬜ Screenshots    ⬜ .aab build    ⬜ Upload          ⬜ Revisión
  ⬜ Privacy Policy   ✅ Icono OK       ⬜ Esperar EAS   ⬜ Listing         Google
                      ⬜ Feature Art                     ⬜ Testers
```

---

## 🔴 FASE 1 — REQUISITOS ADMINISTRATIVOS (Hacer Primero)

### A. Cuenta Google Play Developer
- [ ] Pagar $25 USD (único pago) en [play.google.com/console](https://play.google.com/console)
- [ ] Completar verificación de identidad (puede tardar 2-3 días)
- [ ] **Bloqueante:** Sin cuenta no se puede subir nada

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
  4. OrderConfirmationScreen — confirmación con XP ganado + CO₂ ahorrado
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

## ⚠️ PENDIENTES TÉCNICOS (No bloqueantes para lanzamiento)

### M. Verificar webhook MercadoPago en producción
**Estado:** PaymentScreen.js tiene comentario "datos simulados hasta webhook"
- [ ] Hacer una compra real con tarjeta de prueba en dispositivo físico
- [ ] Verificar en DB que el estado de la orden cambia de `pendiente` → `pagado`
- [ ] Si no cambia, revisar logs de Render para ver si llega el webhook
- [ ] **Prioridad:** Alta — afecta el flujo core de la app

### N. Comercios en producción (Seed)
**Estado:** No hay comercios activos en Supabase producción
- [ ] Ejecutar seed manualmente o registrar primer comercio real
- [ ] Sin comercios, los compradores no verán productos en la app
- [ ] **Prioridad:** Alta — la app no tiene contenido sin comercios

### O. Favoritos — Decisión de arquitectura
**Estado:** `FavoritesScreen.js` usa solo `AsyncStorage` local
- [ ] **Opción A:** Dejar local (scope actual, documentar limitación)
- [ ] **Opción B:** Crear endpoint `POST /api/profiles/favorites` + tabla `favorites` en DB
- [ ] **Prioridad:** Baja — no afecta funcionalidad core

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

**Bugs corregidos (Commit `138076e` — 12 Mar 2026):**
- `r.nombre_producto` (no existe) → `p.nombre` en `getAllReviews` — causaba 500 en producción
- `createReview` ahora guarda `store_id` obtenido de la orden/producto
- `getMyStoreReviews` corregido: JOIN por `products.store_id` en vez de `reviews.store_id` (NULL siempre)

---

## 📌 Orden de Ejecución Recomendado

```
HOY:
  1. [M] Hacer compra de prueba para verificar webhook → confirmar flujo core
  2. [N] Seed de comercios en producción → la app necesita contenido

ESTA SEMANA:
  3. [A] Crear cuenta Google Play ($25 USD)
  4. [B] Redactar y publicar política de privacidad
  5. [D] Crear Feature Graphic 1024×500 (Canva gratis)
  6. [E] Tomar screenshots desde el dispositivo

CUANDO TENGAS CUENTA:
  7. [G] `eas build --profile production --platform android`
  8. [H-L] Completar consola y subir .aab
```
