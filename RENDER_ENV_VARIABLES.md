# Variables de Entorno para Render

## 📱 FRONTEND (Expo Web Service)

```bash
# URL del Backend desplegado en Render
# ⚠️ IMPORTANTE: Actualizar después del primer deploy del backend
EXPO_PUBLIC_API_URL=https://tu-backend-delicrunch.onrender.com/api

# Mercado Pago (solo PUBLIC KEY)
EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-375e7726-8315-48ad-9a60-e31973e44ffa

# Deep linking
EXPO_PUBLIC_APP_SCHEME=delicrunch

# Supabase (solo ANON KEY en cliente)
EXPO_PUBLIC_SUPABASE_URL=https://pruesizqytpscldieivb.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_iIRMgAQGgWka6eYNPN9i6w_GFNwfKuX
```

## 🖥️ BACKEND (Node.js Web Service)

```bash
# Puerto (Render lo asigna automáticamente)
PORT=5001

# Supabase Database - Session Pooler (puerto 5432)
DB_USER=postgres.pruesizqytpscldieivb
DB_HOST=aws-0-us-west-1.pooler.supabase.com
DB_DATABASE=postgres
DB_PASSWORD=bfOJpzZtcoGhAJdP
DB_PORT=5432

# DATABASE_URL completa
DATABASE_URL=postgresql://postgres.pruesizqytpscldieivb:bfOJpzZtcoGhAJdP@aws-0-us-west-1.pooler.supabase.com:5432/postgres

# Supabase API Keys
SUPABASE_URL=https://pruesizqytpscldieivb.supabase.co
SUPABASE_ANON_KEY=sb_publishable_iIRMgAQGgWka6eYNPN9i6w_GFNwfKuX
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBydWVzaXpxeXRwc2NsZGllaXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTc4MzAyNCwiZXhwIjoyMDg1MzU5MDI0fQ.8KRuUKFFaDZK1pBUuPKi6KKSV1zWxLeyu2KTKJYyJaY

# JWT Secret
JWT_SECRET=un_secreto_secretoso_jamas_contado1234

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=implanibot@gmail.com
EMAIL_PASS=qfjz gfrv qswq blss

# Mercado Pago (Backend necesita ACCESS_TOKEN)
MERCADOPAGO_PUBLIC_KEY=APP_USR-375e7726-8315-48ad-9a60-e31973e44ffa
MERCADOPAGO_ACCESS_TOKEN=APP_USR-7758657589560258-012213-ab05386993b304ffec8f442dd78d7b68-3151906188

# URLs
FRONTEND_URL=delicrunch://
APP_SCHEME=delicrunch
BACKEND_URL=https://tu-backend-delicrunch.onrender.com
```

## 🚀 Orden de Deploy

### 1. Despliega el BACKEND primero:
- Copia las variables de la sección **BACKEND**
- Build Command: `cd Backend && npm ci`
- Start Command: `cd Backend && npm start`
- **Guarda la URL generada** (ej: `https://delicrunch-backend-abc123.onrender.com`)

### 2. Actualiza el FRONTEND con la URL del backend:
- Copia las variables de la sección **FRONTEND**
- **Actualiza `EXPO_PUBLIC_API_URL`** con la URL del paso 1 + `/api`
  ```
  EXPO_PUBLIC_API_URL=https://delicrunch-backend-abc123.onrender.com/api
  ```
- Build Command: `cd Frontend && npm ci`
- Start Command: `cd Frontend && npm start`

## 📝 Notas Importantes

### Puerto de Supabase: 5432 vs 6543

**✅ Usamos puerto 5432 (Session Pooler)** porque:
- Render es un servidor persistente (no serverless)
- Session mode es recomendado para conexiones de larga duración
- Soporta prepared statements
- Siempre usa IPv4 (compatible con Render)

**Port 6543 (Transaction Pooler)** es para:
- Serverless functions (AWS Lambda, Vercel Edge, etc.)
- Conexiones cortas y transaccionales
- No soporta prepared statements

### Seguridad

**❌ NUNCA expongas en el Frontend:**
- `SUPABASE_SERVICE_KEY`
- `MERCADOPAGO_ACCESS_TOKEN`
- `EMAIL_PASS`
- `JWT_SECRET`
- Variables de base de datos (`DB_*`)

**✅ Solo en Frontend:**
- Variables con prefijo `EXPO_PUBLIC_*`
- Keys públicas (ANON_KEY, PUBLIC_KEY)

## 🔍 Verificación

Después del deploy, verifica:

1. **Backend Health Check:**
   ```
   https://tu-backend.onrender.com/health
   ```
   Debe responder: `{"success": true, "status": "healthy"}`

2. **Frontend conecta al Backend:**
   Revisa los logs de Render para verificar que no hay errores de conexión

3. **Base de datos conecta:**
   Revisa los logs del backend para confirmar:
   ```
   Conexión con la base de datos establecida exitosamente.
   ```
