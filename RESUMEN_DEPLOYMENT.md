# 📋 Resumen de Scripts y Deployment - Delicrunch

**Generado:** 9 de Febrero 2026  
**Estado:** ✅ Listo para Deployment

---

## 🎯 Archivos Generados

### 1. **Script SQL Completo para Supabase**
📄 [`supabase_migration_complete.sql`](./supabase_migration_complete.sql)

**Contenido:**
- ✅ Todas las tablas base (users, stores, products, orders, etc.)
- ✅ Columnas de MercadoPago (preference_id, payment_id, tokens)
- ✅ **Nueva funcionalidad:** Soporte de imágenes en reviews (columna `images` JSONB)
- ✅ Todos los índices optimizados (30+ índices)
- ✅ Foreign Keys y constraints
- ✅ Idempotente (puede ejecutarse múltiples veces sin errores)

**Cómo usar:**
1. Accede a Supabase Dashboard → SQL Editor
2. Copia y pega el contenido completo del archivo
3. Haz clic en "Run" ▶️
4. Verifica el mensaje: "✅ Migración completada exitosamente"

---

### 2. **Guía Completa de Deployment**
📘 [`DEPLOYMENT_GUIDE_SUPABASE_RENDER.md`](./DEPLOYMENT_GUIDE_SUPABASE_RENDER.md)

**Contenido:**
- 📋 Pre-requisitos necesarios
- 🎯 PASO 1: Configurar Base de Datos en Supabase
- 🖥️ PASO 2: Desplegar Backend en Render
- 📱 PASO 3: Configurar Frontend (Expo/React Native)
- 📦 PASO 4: Build de Producción
- 🔍 PASO 5: Verificación Completa
- 🐛 PASO 6: Troubleshooting (problemas comunes)
- 📊 PASO 7: Monitoreo
- 🎉 PASO 8: Checklist Final

**Destaca:**
- Guía paso a paso con capturas conceptuales
- Variables de entorno completas
- Solución a problemas comunes (404, timeouts, imágenes)
- Checklist de verificación

---

### 3. **Script de Verificación Automatizado**
🔧 [`verify-deployment-ready.sh`](./verify-deployment-ready.sh)

**Funcionalidad:**
- ✅ Verifica estructura de archivos
- ✅ Valida variables de entorno del Backend
- ✅ Comprueba dependencias instaladas (Express, multer, MercadoPago)
- ✅ Verifica archivos críticos
- ✅ Confirma correcciones recientes aplicadas
- ✅ Genera resumen con contadores (éxitos/advertencias/errores)

**Cómo usar:**
```bash
cd /workspaces/Delicrunch
./verify-deployment-ready.sh
```

**Resultado esperado:**
```
🎉 ¡Todo listo para deployment!
✅ Exitosos: 25
⚠️  Advertencias: 2
❌ Errores: 0
```

---

## 🗂️ Estructura Actual de la Base de Datos

### Tablas Principales (11 tablas)

| Tabla | Descripción | Columnas Clave |
|-------|-------------|----------------|
| **users** | Usuarios del sistema | `id`, `nombre`, `email`, `rol`, `password_hash` |
| **stores** | Tiendas/Comercios | `id`, `user_id`, `nombre_comercio`, `mercadopago_*` |
| **products** | Productos (packs sorpresa) | `id`, `store_id`, `precio_descuento`, `rating` |
| **profiles** | Perfiles extendidos | `id`, `user_id`, `total_xp`, `unlocked_badges` |
| **orders** | Pedidos | `id`, `user_id`, `store_id`, `mercadopago_*`, `status` |
| **order_items** | Items de pedidos | `id`, `order_id`, `product_id`, `cantidad` |
| **reviews** | Reseñas **CON FOTOS** | `id`, `user_id`, `product_id`, **`images`**, `rating` |
| **favorites** | Tiendas favoritas | `id`, `user_id`, `store_id` |
| **notifications** | Notificaciones | `id`, `user_id`, `tipo`, `mensaje`, `leido` |
| **payment_preferences** | Preferencias MercadoPago | `id`, `mercadopago_preference_id`, `user_id` |
| **saved_cards** | Métodos de pago guardados | `id`, `user_id`, `brand`, `last4` |

---

## 🔑 Nuevas Funcionalidades Implementadas

### 1. Reviews con Imágenes 📸

**Backend:**
- ✅ Columna `images` (JSONB) en tabla `reviews`
- ✅ Middleware `multer` configurado (máx 3 imágenes, 5MB c/u)
- ✅ Endpoint actualizado: `POST /api/reviews` con multipart/form-data
- ✅ Almacenamiento en `Backend/uploads/`

**Frontend:**
- ✅ [`LeaveReviewScreen.js`](./Frontend/app/LeaveReviewScreen.js) actualizado
- ✅ Selección de fotos de galería o cámara
- ✅ Preview de imágenes antes de enviar
- ✅ Límite de 3 fotos por review
- ✅ Botones de eliminación de imágenes

**SQL:**
```sql
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
```

---

### 2. Corrección de Rutas MercadoPago 🔧

**Problema:** Error 404 en `/api/api/payments/create-preference`

**Solución:**
- ✅ Actualizado [`mercadoPagoService.js`](./Frontend/services/mercadoPagoService.js)
- ✅ Implementada función `ensureApiSuffix()`
- ✅ Eliminadas duplicaciones de `/api`
- ✅ Cambiado header de autenticación a `x-auth-token`

---

### 3. Mejoras de UI/UX 📐

**PaymentScreen:**
- ✅ `scrollContent.paddingBottom`: 120px (espacio para botón fijo)
- ✅ `bottomContainer.paddingBottom` Android: 24px
- ✅ Botones ahora totalmente accesibles

---

## 📊 Variables de Entorno Necesarias

### Backend en Render

```bash
# Base de Datos Supabase
DATABASE_URL=postgresql://postgres.pruesizqytpscldieivb:bfOJpzZtcoGhAJdP@aws-0-us-west-2.pooler.supabase.com:5432/postgres

# Supabase API
SUPABASE_URL=https://pruesizqytpscldieivb.supabase.co
SUPABASE_ANON_KEY=sb_publishable_iIRMgAQGgWka6eYNPN9i6w_GFNwfKuX
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT
JWT_SECRET=un_secreto_secretoso_jamas_contado1234

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=implanibot@gmail.com
EMAIL_PASS=qfjz gfrv qswq blss

# MercadoPago
MERCADOPAGO_PUBLIC_KEY=APP_USR-375e7726-8315-48ad-9a60-e31973e44ffa
MERCADOPAGO_ACCESS_TOKEN=APP_USR-7758657589560258-012213-ab05386993b304ffec8f442dd78d7b68-3151906188

# URLs
PORT=5001
FRONTEND_URL=delicrunch://
BACKEND_URL=https://tu-backend.onrender.com
```

### Frontend (Expo)

```bash
# URL del Backend (ACTUALIZAR después del deploy)
EXPO_PUBLIC_API_URL=https://tu-backend.onrender.com/api

# MercadoPago (solo PUBLIC KEY)
EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-375e7726-8315-48ad-9a60-e31973e44ffa

# Supabase (solo ANON KEY)
EXPO_PUBLIC_SUPABASE_URL=https://pruesizqytpscldieivb.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_iIRMgAQGgWka6eYNPN9i6w_GFNwfKuX

# Deep Linking
EXPO_PUBLIC_APP_SCHEME=delicrunch
```

---

## 🚀 Orden de Deployment

### 1️⃣ Supabase (Base de Datos)
```bash
# 1. Accede a Supabase Dashboard
# 2. Ve a SQL Editor
# 3. Ejecuta supabase_migration_complete.sql
# 4. Verifica: "✅ Migración completada exitosamente"
```

### 2️⃣ Render (Backend)
```bash
# 1. Crear Web Service en Render
# 2. Conectar repo: Alonsovl88074/Delicrunch
# 3. Root Directory: Backend
# 4. Build: npm install
# 5. Start: npm start
# 6. Configurar variables de entorno
# 7. Guardar URL generada
```

### 3️⃣ Frontend (Configuración)
```bash
# 1. Actualizar EXPO_PUBLIC_API_URL con URL de Render
# 2. npm install
# 3. npx expo start (para testing local)
# 4. eas build (para producción)
```

---

## ✅ Checklist de Verificación

Antes de continuar con el deployment, asegúrate de:

### Pre-Deployment
- [ ] ✅ Script SQL generado (`supabase_migration_complete.sql`)
- [ ] ✅ Guía de deployment lista (`DEPLOYMENT_GUIDE_SUPABASE_RENDER.md`)
- [ ] ✅ Script de verificación ejecutado sin errores
- [ ] ✅ Carpeta `Backend/uploads/` creada
- [ ] ✅ Variables de entorno revisadas en `.env`
- [ ] ✅ Dependencias instaladas (`node_modules`)
- [ ] ✅ Correcciones recientes aplicadas

### Durante Deployment
- [ ] Ejecutar script SQL en Supabase
- [ ] Verificar que todas las tablas se crearon
- [ ] Desplegar Backend en Render
- [ ] Configurar variables de entorno en Render
- [ ] Copiar URL del Backend
- [ ] Actualizar `EXPO_PUBLIC_API_URL` en Frontend

### Post-Deployment
- [ ] Verificar endpoint `/api/health` responde 200
- [ ] Probar login de cliente
- [ ] Probar creación de pedido
- [ ] Probar pago con MercadoPago
- [ ] Probar review con fotos
- [ ] Revisar logs en Render (sin errores críticos)

---

## 🐛 Problemas Comunes y Soluciones

### Error 404 en MercadoPago
**Causa:** Rutas duplicadas `/api/api`  
**Solución:** ✅ Ya corregido en `mercadoPagoService.js`

### Columna `images` no existe
**Causa:** Migración SQL no ejecutada  
**Solución:** Ejecutar `supabase_migration_complete.sql`

### Backend no se conecta a Supabase
**Causa:** Puerto incorrecto (6543 en lugar de 5432)  
**Solución:** Usar Session Pooler (puerto 5432)

### Imágenes no se suben
**Causa:** Carpeta `uploads` no existe  
**Solución:** `mkdir -p Backend/uploads`

---

## 📚 Documentación de Referencia

| Archivo | Descripción |
|---------|-------------|
| [`supabase_migration_complete.sql`](./supabase_migration_complete.sql) | Script SQL completo |
| [`DEPLOYMENT_GUIDE_SUPABASE_RENDER.md`](./DEPLOYMENT_GUIDE_SUPABASE_RENDER.md) | Guía paso a paso |
| [`verify-deployment-ready.sh`](./verify-deployment-ready.sh) | Script de verificación |
| [`CORRECCIONES_ENTORNO_CLIENTE.md`](./CORRECCIONES_ENTORNO_CLIENTE.md) | Últimas correcciones |
| [`RENDER_ENV_VARIABLES.md`](./RENDER_ENV_VARIABLES.md) | Variables de entorno |
| [`Backend/.env`](./Backend/.env) | Configuración local |

---

## 🎉 Próximos Pasos

1. **Ejecuta el script de verificación:**
   ```bash
   ./verify-deployment-ready.sh
   ```

2. **Revisa la guía de deployment:**
   ```bash
   cat DEPLOYMENT_GUIDE_SUPABASE_RENDER.md
   ```

3. **Ejecuta el script SQL en Supabase:**
   - Dashboard → SQL Editor → Copiar/Pegar → Run

4. **Despliega en Render:**
   - New Web Service → Conectar repo → Configurar

5. **¡Listo para producción! 🚀**

---

**Versión:** 2.0  
**Fecha:** 9 de Febrero 2026  
**Incluye:** Reviews con Fotos + Correcciones MercadoPago  
**Estado:** ✅ LISTO PARA DEPLOYMENT
