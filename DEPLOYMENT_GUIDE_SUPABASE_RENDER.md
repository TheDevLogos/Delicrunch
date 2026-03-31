# 🚀 Guía Completa de Deployment - Supabase + Render

**Fecha:** 9 de Febrero 2026  
**Versión:** 2.0 (con soporte de imágenes en reviews)

---

## 📋 Pre-requisitos

- ✅ Cuenta de Supabase activa
- ✅ Cuenta de Render activa
- ✅ Repositorio Git con el código actualizado
- ✅ Variables de entorno preparadas (ver archivo `.env`)

---

## 🎯 PASO 1: Configurar Base de Datos en Supabase

### 1.1 Acceder al Dashboard de Supabase

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto: **pruesizqytpscldieivb**
3. Navega a: **SQL Editor** (icono de `<>` en el menú lateral)

### 1.2 Ejecutar Script de Migración

1. Copia el contenido completo de: [`supabase_migration_complete.sql`](./supabase_migration_complete.sql)
2. En SQL Editor, pégalo en el editor
3. Haz clic en **"Run"** (▶️)
4. Espera la confirmación: "✅ Migración completada exitosamente"

**Este script incluye:**
- ✅ Todas las tablas base (users, stores, products, orders, etc.)
- ✅ Columnas de MercadoPago (preference_id, payment_id, access_token)
- ✅ **Soporte de imágenes en reviews** (columna `images` JSONB)
- ✅ Índices optimizados para queries rápidas
- ✅ Foreign Keys y constraints
- ✅ Es idempotente (puede ejecutarse múltiples veces)

### 1.3 Verificar Migración

En SQL Editor, ejecuta:

```sql
-- Verificar tablas creadas
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS columnas
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verificar columna de imágenes en reviews
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reviews' 
AND column_name IN ('images', 'is_verified', 'rating', 'comment');
```

**Resultado esperado:**
- `images` - jsonb
- `is_verified` - boolean
- `rating` - integer
- `comment` - text

### 1.4 Obtener Credenciales de Conexión

1. Ve a: **Settings** → **Database**
2. Busca la sección **"Connection string"**
3. Selecciona: **"Session Pooler"** (puerto 5432)
4. Copia la cadena de conexión completa

**Formato:**
```
postgresql://postgres.pruesizqytpscldieivb:bfOJpzZtcoGhAJdP@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

---

## 🖥️ PASO 2: Desplegar Backend en Render

### 2.1 Crear Web Service

1. Ve a: https://dashboard.render.com
2. Haz clic en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub: `Alonsovl88074/Delicrunch`
4. Configura:
   - **Name:** `delicrunch-backend`
   - **Region:** Oregon (us-west)
   - **Branch:** `main`
   - **Root Directory:** `Backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (o el que prefieras)

### 2.2 Configurar Variables de Entorno

En la sección **"Environment"**, agrega las siguientes variables:

```bash
# Puerto (Render lo asigna automáticamente)
PORT=5001

# ========= SUPABASE DATABASE =========
DATABASE_URL=postgresql://postgres.pruesizqytpscldieivb:bfOJpzZtcoGhAJdP@aws-0-us-west-2.pooler.supabase.com:5432/postgres

# Credenciales individuales (opcional, pero recomendado)
DB_USER=postgres.pruesizqytpscldieivb
DB_HOST=aws-0-us-west-2.pooler.supabase.com
DB_DATABASE=postgres
DB_PASSWORD=bfOJpzZtcoGhAJdP
DB_PORT=5432

# ========= SUPABASE API =========
SUPABASE_URL=https://pruesizqytpscldieivb.supabase.co
SUPABASE_ANON_KEY=sb_publishable_iIRMgAQGgWka6eYNPN9i6w_GFNwfKuX
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBydWVzaXpxeXRwc2NsZGllaXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTc4MzAyNCwiZXhwIjoyMDg1MzU5MDI0fQ.8KRuUKFFaDZK1pBUuPKi6KKSV1zWxLeyu2KTKJYyJaY

# ========= JWT SECRET =========
JWT_SECRET=un_secreto_secretoso_jamas_contado1234

# ========= EMAIL (GMAIL) =========
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=implanibot@gmail.com
EMAIL_PASS=qfjz gfrv qswq blss

# ========= MERCADO PAGO =========
MERCADOPAGO_PUBLIC_KEY=APP_USR-375e7726-8315-48ad-9a60-e31973e44ffa
MERCADOPAGO_ACCESS_TOKEN=APP_USR-7758657589560258-012213-ab05386993b304ffec8f442dd78d7b68-3151906188

# ========= URLS =========
FRONTEND_URL=delicrunch://
APP_SCHEME=delicrunch
BACKEND_URL=https://delicrunch-backend.onrender.com
```

### 2.3 Configurar Health Check

En **"Settings"** → **"Health & Alerts"**:
- **Health Check Path:** `/api/health` o `/`
- **Health Check Enabled:** ✅ Yes

### 2.4 Iniciar Deploy

1. Haz clic en **"Create Web Service"**
2. Render comenzará el build automáticamente
3. Espera a que el estado sea **"Live"** (verde)
4. **Guarda la URL generada**, por ejemplo:
   ```
   https://delicrunch-backend-abc123.onrender.com
   ```

### 2.5 Verificar Backend Funcionando

Abre en el navegador:
```
https://delicrunch-backend-abc123.onrender.com/api/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-02-09T..."
}
```

---

## 📱 PASO 3: Configurar Frontend (Expo/React Native)

### 3.1 Actualizar Variables de Entorno

Edita: `Frontend/.env` o crea si no existe:

```bash
# URL del Backend en Render (ACTUALIZA CON TU URL)
EXPO_PUBLIC_API_URL=https://delicrunch-backend-abc123.onrender.com/api

# Mercado Pago (solo PUBLIC KEY)
EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-375e7726-8315-48ad-9a60-e31973e44ffa

# Deep linking
EXPO_PUBLIC_APP_SCHEME=delicrunch

# Supabase (solo ANON KEY - nunca SERVICE KEY)
EXPO_PUBLIC_SUPABASE_URL=https://pruesizqytpscldieivb.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_iIRMgAQGgWka6eYNPN9i6w_GFNwfKuX
```

### 3.2 Actualizar app.config.js

Edita: `Frontend/app.config.js`:

```javascript
export default ({ config }) => ({
  ...config,
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://delicrunch-backend-abc123.onrender.com/api',
    mercadopagoPublicKey: process.env.EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY || 'APP_USR-375e7726-8315-48ad-9a60-e31973e44ffa',
    // ... demás configuraciones
  },
});
```

### 3.3 Probar en Desarrollo

```bash
cd Frontend
npm install
npx expo start
```

Escanea el QR con Expo Go y verifica:
- ✅ Login funciona
- ✅ Productos se cargan desde Supabase
- ✅ MercadoPago crea preferencias correctamente
- ✅ Reviews con fotos se pueden crear

---

## 📦 PASO 4: Build de Producción (Opcional)

### 4.1 Para Android (APK)

```bash
cd Frontend
eas build --platform android --profile production
```

### 4.2 Para iOS (IPA)

```bash
cd Frontend
eas build --platform ios --profile production
```

---

## 🔍 PASO 5: Verificación Completa

### 5.1 Checklist de Verificación

**Backend en Render:**
- [ ] Status: **Live** (verde)
- [ ] Logs sin errores críticos
- [ ] Endpoint `/api/health` responde con status 200
- [ ] Conexión a Supabase exitosa

**Base de Datos en Supabase:**
- [ ] Todas las tablas creadas (11 tablas)
- [ ] Columna `images` existe en `reviews`
- [ ] Índices creados (30+ índices)
- [ ] Foreign keys funcionando correctamente

**Frontend:**
- [ ] Variable `EXPO_PUBLIC_API_URL` apunta a Render
- [ ] Login funciona sin errores 404
- [ ] Productos se cargan desde la base de datos
- [ ] MercadoPago inicia checkout correctamente
- [ ] Reviews con fotos se pueden crear y visualizar

### 5.2 Testing Manual

#### Test 1: Login
```bash
# Cliente de prueba
Email: cliente@delicrunch.com
Password: (tu password)
```

#### Test 2: MercadoPago
1. Seleccionar producto
2. Ir a pantalla de pago
3. Verificar que no haya error 404 en logs
4. Completar pago (usar tarjeta de prueba)

#### Test 3: Reviews con Fotos
1. Como cliente, completar un pedido
2. Comercio marca pedido como "entregado"
3. Cliente ve botón "Dejar reseña"
4. Subir 1-3 fotos
5. Enviar review
6. Verificar en `StoreReviewsScreen` que las fotos aparecen

---

## 🐛 PASO 6: Troubleshooting

### Problema 1: Error 404 en MercadoPago

**Síntoma:**
```
Error 404: Ruta no encontrada: POST /api/api/payments/create-preference
```

**Solución:**
✅ Ya corregido en `Frontend/services/mercadoPagoService.js`
- Asegúrate de tener la última versión del código
- Verifica que `EXPO_PUBLIC_API_URL` termine en `/api`

---

### Problema 2: Backend no se conecta a Supabase

**Síntoma:**
```
Error: connection timeout
```

**Solución:**
1. Verifica que uses **Session Pooler** (puerto 5432, no 6543)
2. Verifica `DATABASE_URL` en variables de entorno de Render
3. En Supabase Dashboard → Settings → Database → verifica que "SSL Enforcement" esté habilitado

---

### Problema 3: Columna `images` no existe en reviews

**Síntoma:**
```
column "images" does not exist
```

**Solución:**
```sql
-- Ejecutar en SQL Editor de Supabase
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
```

---

### Problema 4: Build de Render falla con npm install

**Síntoma:**
```
npm ERR! peer dependency conflict
```

**Solución:**
```bash
# En Frontend/.npmrc (ya existe)
legacy-peer-deps=true
```

O en Render, cambiar Build Command a:
```bash
npm install --legacy-peer-deps
```

---

### Problema 5: Imágenes no se suben

**Síntoma:**
```
Error: multer: file too large
```

**Solución:**
1. Verificar límite en `Backend/middleware/upload.js`:
   ```javascript
   limits: { fileSize: 1024 * 1024 * 5 } // 5MB
   ```
2. Verificar que la carpeta `Backend/uploads/` exista:
   ```bash
   mkdir -p Backend/uploads
   ```
3. Agregar a `.gitignore`:
   ```
   Backend/uploads/*
   !Backend/uploads/.gitkeep
   ```

---

## 📊 PASO 7: Monitoreo

### 7.1 Logs en Render

1. Ve a tu servicio en Render Dashboard
2. Haz clic en **"Logs"**
3. Monitorea errores en tiempo real

### 7.2 Metrics en Supabase

1. Ve a: Supabase Dashboard → **Database** → **Metrics**
2. Revisa:
   - Conexiones activas
   - CPU usage
   - Memory usage

### 7.3 Alertas Recomendadas

En Render, configura alertas para:
- ❌ Deploy failed
- ⚠️ Health check failing
- 📈 High CPU usage (> 80%)
- 💾 High memory usage (> 80%)

---

## 🎉 PASO 8: ¡Listo para Producción!

### Checklist Final

- [ ] ✅ Script SQL ejecutado en Supabase
- [ ] ✅ Backend desplegado en Render
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Frontend conectado al backend
- [ ] ✅ MercadoPago funcionando sin errores
- [ ] ✅ Reviews con fotos habilitadas
- [ ] ✅ Testing manual completado
- [ ] ✅ Logs limpios sin errores críticos
- [ ] ✅ Monitoreo configurado

---

## 📚 Recursos Adicionales

### Documentación Oficial:
- **Supabase Docs:** https://supabase.com/docs
- **Render Docs:** https://render.com/docs
- **Expo Docs:** https://docs.expo.dev
- **MercadoPago Docs:** https://www.mercadopago.com.mx/developers

### Archivos Importantes:
- [`supabase_migration_complete.sql`](./supabase_migration_complete.sql) - Script de migración
- [`RENDER_ENV_VARIABLES.md`](./RENDER_ENV_VARIABLES.md) - Variables de entorno
- [`CORRECCIONES_ENTORNO_CLIENTE.md`](./CORRECCIONES_ENTORNO_CLIENTE.md) - Últimas correcciones
- [`.env.example`](./Backend/.env.example) - Plantilla de variables

### Soporte:
- 📧 Email: implanibot@gmail.com
- 💬 Issues: GitHub repository

---

## 🔄 Actualizaciones Futuras

Para actualizar el código en producción:

### Backend:
1. Push cambios a GitHub (rama `main`)
2. Render detectará automáticamente y hará redeploy
3. Verifica logs en Render Dashboard

### Frontend:
1. Actualiza código localmente
2. Reconstruye con `eas build`
3. Distribuye nuevo APK/IPA

### Base de Datos:
1. Crea nueva migración SQL
2. Prueba en SQL Editor de Supabase
3. Aplica en producción cuando esté lista

---

**¡Tu aplicación Delicrunch está ahora en producción con todas las últimas funcionalidades! 🎊**

**Versión del deployment:** 2.0  
**Fecha:** Febrero 9, 2026  
**Incluye:** Pagos MercadoPago + Reviews con Fotos
