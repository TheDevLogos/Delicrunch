# 📚 Lecciones Aprendidas - Delicrunch

> **Propósito:** Capturar patrones de errores, soluciones exitosas y reglas de desarrollo para prevenir problemas recurrentes.
> **Revisión:** Consultar al inicio de cada sesión de trabajo

---

## 🔴 Errores Críticos y Sus Soluciones

### Patrón: reviewController.js — Columnas SQL en Inglés Sobreviven a Auditorías Parciales
**Fecha:** 2026-03-10
**Contexto:** Revisión completa del proyecto para identificar tareas pendientes
**Causa Raíz:** La auditoría de columnas inglés/español se corrigió en `productController`, `authController`, `profileController` y `storeController`, pero `reviewController.js` quedó parcialmente corregido. Líneas 68, 99, 293, 296, 448 todavía referencian `p.name`, `u.name`, `o.seller_id` y `p.seller_id` que no existen en el schema.
**Impacto:** `GET /api/reviews` y endpoints de reseñas relacionados fallan con error 500 (column does not exist) cuando hay products o users involucrados.
**Solución pendiente:** Corregir en `reviewController.js`:
- `p.name` → `p.nombre`
- `u.name` → `u.nombre`
- `o.seller_id` → `o.store_id` (o eliminar si no aplica al schema de orders)
- `p.seller_id` → `p.store_id`
**Prevención:**
- ✅ Regla: Al hacer auditoría de columnas, listar TODOS los controllers con `grep -rn "\.name\b\|\.role\b\|seller_id" /Backend/controllers/` antes de marcar como completado
- ✅ Regla: No marcar "inconsistencia de columnas resuelta" hasta verificar TODOS los archivos en el directorio, no solo los mencionados explícitamente

### Patrón: Variables de Entorno Desincronizadas entre Local y Producción
**Fecha:** 2026-03-10
**Contexto:** Usuario reporta "no se pudo crear referencia de pago" al intentar pagar desde la app
**Causa Raíz:** 
- Backend LOCAL tiene credenciales actualizadas de MercadoPago ✅ FUNCIONAN
- Backend en RENDER tiene credenciales antiguas/desactualizadas ❌ FALLAN  
- Frontend apunta a Render en producción → errores para usuarios reales
**Diagnóstico Senior Dev:**
1. ✅ NO asumir el backend local - probar AMBOS entornos
2. ✅ Local create-preference → SUCCESS (preferenceId creado)
3. ✅ Render create-preference → ERROR ("Error al crear la preferencia de pago")
4. ✅ Identificar discrepancia → variables de entorno diferentes
**Solución:**
- Actualizar variables en dashboard.render.com → Environment
- Credenciales correctas: `MERCADOPAGO_ACCESS_TOKEN` y `MERCADOPAGO_PUBLIC_KEY`
- Esperar re-deploy automático (2-3 min)
- Verificar con script de prueba end-to-end
**Prevención:**
- ✅ Regla: Ante error "solo en producción" → verificar ENV vars PRIMERO
- ✅ Regla: Al actualizar credenciales locales → crear tarea para actualizar producción
- ✅ Regla: Mantener scripts de prueba por entorno (test-local, test-render)
- ✅ Regla: Probar cambios sensibles (pagos, APIs) en AMBOS entornos
- ✅ Regla: Documentar credenciales por entorno en lugar seguro

### Patrón: Diagnóstico Incompleto - Confundir Síntoma con Causa Raíz
**Fecha:** 2026-03-10
**Contexto:** Error en frontend → fácil asumir que el problema es del frontend
**Aprendizaje:** El lugar donde se MANIFIESTA ≠ La CAUSA RAÍZ
- Frontend muestra: "no se pudo crear referencia"
- Pero la causa real: credenciales inválidas en backend de producción
**Metodología Senior Dev para Debugging:**
1. ✅ Verificar cadena completa: Frontend → Backend → API Externa
2. ✅ Revisar logs en CADA capa
3. ✅ Probar componentes aisladamente
4. ✅ Comparar local vs producción
5. ✅ No hacer suposiciones sin evidencia
**Prevención:**
- ✅ Regla: Trazar flujo completo desde origen hasta destino
- ✅ Regla: Revisar logs del servidor SIEMPRE (no solo cliente)
- ✅ Regla: Crear herramientas de diagnóstico end-to-end
- ✅ Regla: Documentar diagnóstico paso a paso, no solo la solución

### Patrón: Pool de BD Creando Nueva Conexión en Cada Query
**Fecha:** 2026-03-04
**Contexto:** `db/index.js` creaba un nuevo `PgPool` con `new PgPool({...})` dentro de cada llamada a `pool.query()`, luego lo cerraba con `pgPool.end()`. Esto significa N conexiones para N queries, agotando recursos y causando timeouts.
**Causa Raíz:** Implementación de "compatibilidad" que intentaba convertir el cliente Supabase en un wrapper de pool, pero lo hacía incorrectamente creando connections efímeras.
**Solución:** Pool persistente inicializado UNA VEZ al cargar el módulo, reutilizado en todas las queries.
**Prevención:**
- ✅ Regla: El pool de PostgreSQL DEBE inicializarse una sola vez fuera de cualquier función
- ✅ Regla: Verificar que `module.exports` del pool sea la instancia, no un wrapper

### Patrón: SQL Roto en Actualización de Comercio (mercadopago_email)
**Fecha:** 2026-03-04
**Contexto:** `paymentController.merchantSetup` tenía SQL completamente inválido para actualizar tienda existente: `SET mercadopago_email = $1, mercadopago_configured = true, updated_at =user_id = $1, mercadopago_onboarding_complete`
**Causa Raíz:** SQL escrito sin verificar el schema real de la tabla `stores`. Las columnas `mercadopago_email` y `mercadopago_configured` no existen. La columna real es `mercadopago_user_id`.
**Solución:** Verificar schema con `SELECT column_name FROM information_schema.columns WHERE table_name='stores'` antes de escribir el UPDATE. Columnas correctas: `mercadopago_user_id`, `mercadopago_onboarding_complete`.
**Prevención:**
- ✅ Regla: SIEMPRE verificar nombres de columnas reales antes de escribir SQL
- ✅ Regla: No asumir que una columna existe - verificar con información_schema

### Patrón: Transacciones BEGIN/COMMIT con pool.query() en lugar de client.query()
**Fecha:** 2026-03-04
**Contexto:** `addSavedCard` y `setDefaultSavedCard` usaban `pool.query('BEGIN')`, `pool.query('COMMIT')`, `pool.query('ROLLBACK')`. Con un pool de conexiones, cada `pool.query()` puede obtener una conexión diferente, rompiendo la atomicidad de la transacción.
**Causa Raíz:** Confusión entre `pool.query()` (obtiene conexión temporal) y `client.query()` (usa conexión dedicada).
**Solución:** Usar `const client = await pool.connect(); client.query('BEGIN'); ... client.query('COMMIT'); client.release();`
**Prevención:**
- ✅ Regla: Para transacciones, SIEMPRE usar `pool.connect()` y `client.*`
- ✅ Regla: `pool.query()` es para queries atómicas individuales, NO para transacciones multi-step

### Patrón: Roles Mapeados Incorrectamente en authController
**Fecha:** 2026-03-04
**Contexto:** `authController.registerUser` mapeaba `'comprador' → 'buyer'` y `'comercio' → 'seller'` antes de insertar en la BD, pero la BD tiene constraint `CHECK (rol IN ('comprador', 'comercio', 'admin'))`. Resultado: violación de constraint al registrar usuarios.
**Causa Raíz:** Código legado que intentaba normalizar roles de inglés (de una versión anterior de la BD) pero el schema ya fue actualizado a español.
**Solución:** Mapear en sentido inverso: `'buyer' → 'comprador'`, `'seller' → 'comercio'`. Roles en español se pasan directamente.
**Prevención:**
- ✅ Regla: Verificar el CHECK constraint de la columna rol antes de escribir el INSERT
- ✅ Regla: Los roles en la BD de Delicrunch son en ESPAÑOL: comprador, comercio, admin

### Patrón: Variables de Entorno Faltantes en eas.json Production
**Fecha:** 2026-03-04
**Contexto:** El build de `production` en `eas.json` no tenía `EXPO_PUBLIC_API_URL` ni `EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY`. La app de producción en Google Play conectaría a `localhost:5001` en lugar del servidor real.
**Causa Raíz:** Variables de entorno solo configuradas en build de `development`, no replicadas en `preview` y `production`.
**Solución:** Agregar `env` a todos los perfiles de build en `eas.json`.
**Prevención:**
- ✅ Regla: Siempre especificar `env` en TODOS los perfiles de eas.json
- ✅ Regla: Revisar eas.json antes de hacer cualquier build

### Patrón: App abre sandboxInitPoint en lugar de initPoint en producción
**Fecha:** 2026-03-04
**Contexto:** `PaymentScreen.js` usaba `preference.sandboxInitPoint || preference.initPoint`. Con credenciales de PRODUCCIÓN, `sandboxInitPoint` permite pagos de prueba pero en Google Play los usuarios necesitan pagar real.
**Causa Raíz:** Variable de fallback incorrecta - sandbox tiene prioridad pero no debería en producción.
**Solución:** Usar el flag `__DEV__` de React Native: en dev usar sandbox, en producción usar `initPoint`.
**Prevención:**
- ✅ Regla: Usar `__DEV__` para diferenciar comportamiento sandbox/producción
- ✅ Regla: Para Google Play, el checkoutUrl DEBE ser `initPoint` (pagos reales)

---


**Fecha:** 2026-03-03
**Contexto:** orderController.updateOrderStatus aceptaba tanto `status` como `estado` para compatibilidad
**Causa Raíz:** Intento de mantener compatibilidad retroactiva con frontend sin verificar qué estaba enviando realmente
**Solución:**
- Verificar el código del frontend para confirmar qué campos envía (encontrado que ya usa `estado`)
- Eliminar compatibilidad con inglés (`status`)
- Renombrar variables internas a español (`finalStatus` → `estado`)
- Mantener un solo idioma consistente en toda la aplicación
**Prevención:**
- ✅ Regla: No asumir compatibilidad necesaria - verificar el código consumidor
- ✅ Regla: Mantener consistencia de idioma en toda la aplicación (español)
- ✅ Regla: No crear "puentes de compatibilidad" innecesarios que añaden complejidad

### Patrón: Credenciales de Supabase Inválidas o Proyecto Pausado
**Fecha:** 2026-03-03
**Contexto:** Backend no puede conectarse a Supabase, errores: "Tenant or user not found" y "fetch failed"
**Causa Raíz:** 
- Credenciales pueden ser antiguas/incorrectas
- Proyecto de Supabase puede estar pausado o eliminado
- Restricciones de firewall en entorno Codespaces
**Solución Temporal:**
- Documentar el problema y crear instrucciones para verificación
- Probar con Direct Connection (db.*.supabase.co:5432)
- Probar con Session Pooler (*.pooler.supabase.com:5432)
- Probar con Transaction Pooler (*.pooler.supabase.com:6543)
**Solución Definitiva:**
- Verificar en Dashboard de Supabase que el proyecto existe y está activo
- Obtener nuevas credenciales si es necesario:
  - SUPABASE_URL desde Dashboard
  - SUPABASE_SERVICE_KEY desde Settings > API
  - DB_PASSWORD desde Settings > Database
- Verificar que IP de Codespaces no esté bloqueada
- Ejecutar seeds después de confirmar conexión exitosa
**Prevención:**
- ✅ Regla: Verificar estado del proyecto de Supabase antes de debugging local
- ✅ Regla: Documentar credenciales en lugar seguro (no en .env versionado)
- ✅ Regla: Crear script de health-check para verificar conectividad al inicio
- ✅ Regla: Tener plan B para desarrollo local (PostgreSQL local con Docker)

### Patrón: Inconsistencia de Nombres de Columnas (Español vs Inglés)
**Fecha:** 2026-02-06 (Identificado previamente)
**Contexto:** Controllers usando nombres en inglés cuando el schema de BD está 100% en español
**Causa Raíz:** Falta de documentación clara del schema y migración parcial de código legacy
**Solución:** 
- Auditar todos los controllers y queries SQL
- Actualizar referencias a nombres de columnas en español
- Crear documento de schema como referencia (PROJECT_CONTEXT.md)
**Prevención:** 
- ✅ Regla: Siempre consultar schema documentado antes de escribir queries
- ✅ Usar constantes para nombres de columnas si es posible
- ✅ Hacer code review enfocado en nombres de columnas

### Patrón: Referencias a Columnas Inexistentes
**Fecha:** 2026-02-06 (Identificado previamente)
**Contexto:** profileController intentando acceder a `phone`, `street`, `city`, `avatar_url` en tabla `users`
**Causa Raíz:** Asunción incorrecta sobre estructura de tablas. Estos campos están en `profiles`, no en `users`
**Solución:**
- Verificar schema real en Supabase antes de escribir query
- Hacer JOIN apropiado con tabla `profiles` cuando se necesitan estos datos
- Eliminar referencias a columnas que no existen
**Prevención:**
- ✅ Regla: Ejecutar `\d table_name` en PostgreSQL para ver estructura real
- ✅ Revisar schema documentation en PROJECT_CONTEXT.md
- ✅ Nunca asumir, siempre verificar

### Patrón: Uso Incorrecto de Foreign Keys
**Fecha:** 2026-02-06 (Identificado previamente)
**Contexto:** productController usando `seller_id` cuando debería usar `store_id`
**Causa Raíz:** Confusión entre modelo de datos antiguo (productos por seller) vs nuevo (productos por store)
**Solución:**
- Productos pertenecen a `stores`, no directamente a `users`
- JOIN correcto: `products.store_id = stores.id`
- Para obtener seller: `stores.user_id = users.id`
**Prevención:**
- ✅ Regla: Entender relaciones de tablas antes de escribir queries
- ✅ Documentar diagrama ER si es necesario
- ✅ Validar foreign keys existen antes de usar

### Patrón: Base de Datos Vacía en Producción/Staging
**Fecha:** 2026-02-06 (Identificado previamente)
**Contexto:** API retorna "Tienda no encontrada" porque no hay datos en Supabase
**Causa Raíz:** Seeds no ejecutados o ejecutados parcialmente
**Solución:**
- Ejecutar seeds en orden correcto: schema → data → fixes
- Verificar datos con queries básicas después de seed
**Prevención:**
- ✅ Regla: Siempre verificar que hay datos de prueba después de setup
- ✅ Documentar proceso de seed en orden
- ✅ Crear script de verificación que valide datos existen

---

## ✅ Reglas de Desarrollo Establecidas

### Backend (Node.js/Express/Supabase)
1. **Autenticación & Autorización**
   - Siempre verificar `user_id` en las operaciones de base de datos
   - Nunca confiar en datos del cliente para identificar usuarios
   - Validar permisos antes de cualquier operación sensible

2. **Base de Datos**
   - Usar prepared statements para prevenir SQL injection
   - Implementar índices apropiados para queries frecuentes
   - Verificar schemas antes de ejecutar migraciones

3. **APIs y Controladores**
   - Validar todos los inputs antes de procesarlos
   - Manejar errores de manera consistente
   - Retornar códigos HTTP apropiados

4. **Integración con Servicios Externos**
   - Implementar retry logic para servicios externos (ej: MercadoPago)
   - Manejar timeouts apropiadamente
   - Logs detallados de requests/responses para debugging

### Frontend (React Native/Expo)
1. **Estado y Datos**
   - Validar datos antes de renderizar
   - Manejar estados de loading/error apropiadamente
   - Sincronizar estado con backend de manera consistente

2. **Navegación**
   - Verificar rutas protegidas requieran autenticación
   - Limpiar estado al hacer logout

3. **Performance**
   - Optimizar re-renders innecesarios
   - Implementar lazy loading cuando sea apropiado

### DevOps y Despliegue
1. **Variables de Entorno**
   - Nunca commitear secretos al repositorio
   - Verificar todas las env vars antes del deploy
   - Documentar variables requeridas

2. **Bases de Datos**
   - Testear migraciones en entorno de prueba primero
   - Hacer backups antes de cambios estructurales
   - Verificar integridad después de migraciones

---

## 🎯 Mejores Prácticas Identificadas

### Debugging
- ✅ Agregar logs informativos en puntos críticos
- ✅ Usar herramientas de debugging apropiadas
- ✅ Reproducir errores antes de intentar arreglarlos

### Testing
- ✅ Escribir tests para funcionalidad crítica
- ✅ Testear casos edge y manejo de errores
- ✅ Validar manualmente en diferentes escenarios

### Documentación
- ✅ Documentar decisiones arquitecturales importantes
- ✅ Mantener README actualizado
- ✅ Comentar código complejo o no obvio

---

## 🔧 Soluciones Elegantes Aplicadas

### [Nombre de la Solución]
**Problema:** *Descripción del problema original*
**Solución Inicial (Hacky):** *Primera aproximación no óptima*
**Solución Elegante:** *Implementación final limpia*
**Aprendizaje:** *Por qué la solución elegante es mejor*

---

## 🚨 Anti-Patrones a Evitar

1. **❌ Arreglos Temporales**
   - No usar hacks o workarounds sin documentación
   - Siempre buscar la causa raíz
   - Si es temporal, crear ticket para arreglarlo correctamente

2. **❌ Código Duplicado**
   - Extraer lógica común a funciones/componentes reutilizables
   - Usar DRY (Don't Repeat Yourself)

3. **❌ Cambios sin Verificación**
   - Nunca marcar completado sin probar
   - Verificar en múltiples escenarios
   - Revisar logs y comportamiento

---

## 📈 Métricas de Mejora

### Tasa de Bugs Recurrentes
*Objetivo: Reducir bugs del mismo tipo a través del aprendizaje documentado*

### Velocidad de Resolución
*Objetivo: Resolver problemas más rápido usando lecciones previas*

### Calidad de Código
*Objetivo: Incrementar porcentaje de código que pasa revisión sin cambios*

---

## 🔄 Proceso de Actualización

1. **Después de cada corrección del usuario:** Agregar entrada en este documento
2. **Al final de cada sesión:** Revisar y consolidar lecciones
3. **Al inicio de cada sesión:** Leer lecciones relevantes al trabajo actual
4. **Semanal:** Revisar y refinar reglas, eliminar obsoletas

---

## 📝 Notas de Sesión Reciente

**Fecha:** 25 de febrero de 2026

### Implementación del Workflow Orchestration Framework
- ✅ Implementado sistema de Workflow Orchestration basado en mejores prácticas
- ✅ Creada estructura completa de seguimiento (tasks/)
- ✅ Documentadas lecciones aprendidas de errores previos del proyecto
- 🎯 **Objetivo:** Reducir bugs repetitivos y mejorar calidad del código

### Sistema Implementado
1. **WORKFLOW_GUIDELINES.md** - Framework completo de desarrollo (300+ líneas)
2. **tasks/todo.md** - Sistema de seguimiento de tareas
3. **tasks/lessons.md** - Este archivo para captura de aprendizajes
4. **tasks/PROJECT_CONTEXT.md** - Documentación completa del estado del proyecto
5. **workflow-review.sh** - Script de revisión diaria

### Principios Establecidos
- **Plan Mode Default** - Planificar antes de implementar tareas complejas
- **Verification Before Done** - Nunca marcar completo sin probar
- **Self-Improvement Loop** - Aprender y documentar de cada error
- **Demand Elegance** - Buscar soluciones simples y elegantes
- **Autonomous Bug Fixing** - Resolver problemas de forma autónoma

### Lecciones Migradas
Se documentaron 4 patrones de error identificados previamente en el proyecto:
1. Inconsistencia de nombres de columnas (Español vs Inglés)
2. Referencias a columnas inexistentes
3. Uso incorrecto de foreign keys
4. Base de datos vacía en ambientes

### Próximos Pasos
1. Aplicar este workflow en próximas tareas de desarrollo
2. Actualizar este archivo cada vez que se aprenda algo nuevo
3. Revisar lecciones al inicio de cada sesión
4. Refinar reglas basado en experiencia

---

## 🟡 Lecciones de Sesión 4 de Marzo 2026

### Patrón: Credenciales MercadoPago Sandbox vs Producción
**Fecha:** 2026-03-04
**Contexto:** App usaba credenciales antiguas de una app de sandbox/prueba. Para Google Play se necesitan credenciales de la app de producción con Checkout Pro habilitado.
**Causa Raíz:** No se había actualizado Backend/.env y Frontend/.env con las credenciales definitivas de la cuenta real del negocio.
**Solución:**
- Actualizar `MERCADOPAGO_ACCESS_TOKEN` y `MERCADOPAGO_PUBLIC_KEY` en Backend/.env
- Actualizar `EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY` en Frontend/.env
- Agregar `MERCADOPAGO_USER_ID` y `MERCADOPAGO_APP_ID` para referencia
- Actualizar también las vars de entorno en Render Dashboard
**Prevención:**
- ✅ Regla: Documentar User ID y App ID de MP junto al token para facilitar diagnóstico
- ✅ Regla: Verificar las vars de entorno en Render después de cada rotación de credenciales
- ✅ Regla: Configurar webhook en panel de MP cada vez que cambian las credenciales de app

### Patrón: Middleware de Route no Aplicado
**Fecha:** 2026-03-04
**Contexto:** `getMerchantBalance` y `getMerchantPayouts` necesitaban `req.storeId` que provee el middleware `getStoreId`, pero las rutas no lo incluían.
**Causa Raíz:** Al agregar nuevas rutas se copió el patrón de `authMiddleware` pero se olvidó el middleware adicional específico del dominio.
**Solución:** Agregar `getStoreId` como segundo middleware en las rutas que usan `req.storeId`.
**Prevención:**
- ✅ Regla: Al agregar rutas de comercio, verificar siempre que incluyen `authMiddleware + getStoreId`
- ✅ Regla: Documentar en el controller qué req fields necesita (storeId, userId, etc.)

### Patrón: Alias de columna inexistente en SELECT  
**Fecha:** 2026-03-12  
**Contexto:** `getAllReviews` usaba `r.nombre_producto` en un `COALESCE`, pero `reviews` no tiene esa columna. Pasó desapercibido en revisiones parciales porque la query solo fallaba cuando había condiciones específicas.  
**Causa Raíz:** Se escribió `r.nombre_producto` asumiendo que la columna existía en la tabla `reviews`, cuando en realidad el nombre del producto solo existe en `products.nombre` (via JOIN).  
**Solución:** `COALESCE(r.nombre_producto, p.nombre)` → `COALESCE(p.nombre, 'Producto eliminado')`  
**Prevención:**  
- ✅ Regla: Tras escribir cualquier SELECT, verificar que cada `tabla.columna` existe corriendo `node check-reviews-schema.js` (o equivalente)  
- ✅ Regla: Probar el endpoint `/reviews/admin/all` con al menos 1 reseña en staging antes de deploy  
- ✅ Regla: Usar aliases descriptivos solo sobre columnas existentes, nunca sobre columnas hipotéticas  

### Patrón: store_id no persistido al crear entidad relacionada  
**Fecha:** 2026-03-12  
**Contexto:** `createReview` hacía el SELECT del pedido para obtener `store_id`, pero no lo insertaba en el INSERT. Resultado: `reviews.store_id` siempre NULL, rompiendo `getMyStoreReviews`.  
**Causa Raíz:** El campo `storeId` se declaraba en `let storeId, productIdToUse, productName` pero nunca se asignaba ni se usaba en el INSERT.  
**Solución:** Asignar `storeId = orderResult.rows[0].store_id` y añadirlo al INSERT.  
**Prevención:**  
- ✅ Regla: Al crear un INSERT, listar explícitamente todas las FK (store_id, user_id, product_id, order_id) y verificar que cada una se asigna en el código previo  
