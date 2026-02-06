# 🧪 Guía de Verificación del Backend en Render

## 📋 Antes de Probar

Asegúrate de que tu backend esté desplegado en Render y tengas la URL del servicio.

### ¿Dónde encontrar tu URL de Render?

1. Ve a [https://dashboard.render.com](https://dashboard.render.com)
2. Selecciona tu servicio de backend (ej: "delicrunch-backend")
3. Copia la URL que aparece en la parte superior (ej: `https://delicrunch-backend-xxxx.onrender.com`)

---

## 🚀 Scripts Disponibles

### 1️⃣ `check-render-config.sh` - Verificar Configuración Local

**Uso:**
```bash
./check-render-config.sh
```

**¿Qué hace?**
- ✅ Verifica que los archivos del backend existan
- ✅ Muestra las variables de entorno necesarias para Render
- ✅ Proporciona los comandos de build correctos
- ✅ Da un checklist completo antes del deployment

**Cuándo usar:**
- **ANTES** de desplegar en Render
- Para verificar que no falte nada
- Como referencia de configuración

---

### 2️⃣ `test-render-backend.sh` - Prueba Completa del Backend

**Uso:**
```bash
./test-render-backend.sh https://tu-backend.onrender.com
```

**¿Qué hace?**
- 🔍 Prueba todos los endpoints principales
- 🗄️ Verifica la conexión con Supabase
- ✅ Valida que las respuestas sean JSON válido
- 📊 Genera un reporte completo con estadísticas

**Ejemplo de salida:**
```
═══════════════════════════════════════════════════
  1. PRUEBAS DE CONECTIVIDAD BÁSICA
═══════════════════════════════════════════════════

✅ Root Endpoint - OK
✅ Health Check (/health) - OK
✅ Health Check (/api/health) - OK

═══════════════════════════════════════════════════
  RESUMEN DE PRUEBAS
═══════════════════════════════════════════════════

Total de pruebas: 12
✅ Pruebas exitosas: 12
❌ Pruebas fallidas: 0

¡TODAS LAS PRUEBAS PASARON!
```

**Cuándo usar:**
- **DESPUÉS** de desplegar en Render
- Antes de generar un EAS Dev Build
- Para verificar que todo funciona correctamente

---

### 3️⃣ `test-render-endpoints.sh` - Pruebas Específicas

**Uso:**
```bash
# Probar todo
./test-render-endpoints.sh https://tu-backend.onrender.com

# Probar solo health check
./test-render-endpoints.sh https://tu-backend.onrender.com health

# Probar solo tiendas
./test-render-endpoints.sh https://tu-backend.onrender.com stores

# Probar solo productos
./test-render-endpoints.sh https://tu-backend.onrender.com products

# Probar solo autenticación
./test-render-endpoints.sh https://tu-backend.onrender.com auth

# Probar solo conexión con base de datos
./test-render-endpoints.sh https://tu-backend.onrender.com database
```

**¿Qué hace?**
- 🎯 Permite probar endpoints específicos
- 📝 Muestra respuestas detalladas
- 🔧 Útil para debugging de endpoints individuales

**Cuándo usar:**
- Para debugear un endpoint específico
- Cuando quieres ver la respuesta completa de un endpoint
- Para pruebas rápidas durante el desarrollo

---

## 📝 Workflow Recomendado

### Paso 1: Verificar Configuración Local
```bash
./check-render-config.sh
```

Revisa el checklist y asegúrate de que todo esté configurado.

### Paso 2: Desplegar en Render

En el dashboard de Render:

**Build Command:**
```bash
cd Backend && npm ci
```

**Start Command:**
```bash
cd Backend && npm start
```

**Variables de Entorno:** (copiar de la salida del script anterior)

### Paso 3: Esperar el Deploy

Espera a que el deployment complete (puede tardar 2-5 minutos la primera vez).

### Paso 4: Probar el Backend

```bash
./test-render-backend.sh https://tu-backend.onrender.com
```

### Paso 5: Si Todo Funciona ✅

Estás listo para generar tu EAS Dev Build con:

```bash
# En tu archivo app.json o eas.json, asegúrate de tener:
EXPO_PUBLIC_API_URL=https://tu-backend.onrender.com/api
```

---

## 🔍 Interpretando los Resultados

### ✅ Si todas las pruebas pasan:

```
¡TODAS LAS PRUEBAS PASARON!

Tu backend en Render está funcionando correctamente ✨

Próximos pasos:
1. ✅ Backend desplegado y funcionando en Render
2. ✅ Conexión con Supabase establecida
3. 🚀 Puedes proceder a generar tu EAS Dev Build
```

**Acción:** Procede a generar tu EAS Dev Build

---

### ❌ Si algunas pruebas fallan:

```
ALGUNAS PRUEBAS FALLARON

Revisa los errores anteriores y verifica:
1. Las variables de entorno en Render
2. Los logs del servicio en el dashboard de Render
3. La configuración de Supabase
```

**Acciones:**

1. **Revisa los logs en Render:**
   - Dashboard de Render → Tu servicio → Tab "Logs"
   - Busca errores relacionados con las variables de entorno

2. **Verifica las variables de entorno:**
   - Dashboard de Render → Tu servicio → Tab "Environment"
   - Compara con la lista de `check-render-config.sh`

3. **Prueba endpoints específicos:**
   ```bash
   ./test-render-endpoints.sh https://tu-backend.onrender.com stores
   ```

4. **Verifica la conexión con Supabase:**
   ```bash
   ./test-render-endpoints.sh https://tu-backend.onrender.com database
   ```

---

## 🛠️ Troubleshooting Común

### Error: "Connection refused"

**Causa:** El servicio no está ejecutándose o la URL es incorrecta.

**Solución:**
- Verifica que el servicio esté "Running" en el dashboard de Render
- Asegúrate de que la URL sea correcta (sin trailing slash)

---

### Error: "Database connection failed"

**Causa:** Variables de entorno de Supabase incorrectas.

**Solución:**
1. Verifica las variables en Render:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `DB_USER`, `DB_HOST`, `DB_DATABASE`, `DB_PASSWORD`, `DB_PORT`

2. Verifica que uses el **Session Pooler** (puerto 5432) de Supabase, NO el Transaction Pooler (6543)

---

### Error: "404 Not Found" en endpoints

**Causa:** El routing no está funcionando correctamente.

**Solución:**
- Verifica que el Start Command sea: `cd Backend && npm start`
- Revisa los logs de Render para ver si hay errores al iniciar

---

### Error: "500 Internal Server Error"

**Causa:** Error en el código del backend o configuración incorrecta.

**Solución:**
1. Revisa los logs en Render (Dashboard → Logs)
2. Busca errores relacionados con:
   - Variables de entorno faltantes
   - Errores de conexión a Supabase
   - Errores en las queries

---

## 📊 Variables de Entorno Críticas

Las siguientes variables **DEBEN** estar configuradas en Render:

```bash
# Base de Datos (Supabase Session Pooler)
DB_USER=postgres.pruesizqytpscldieivb
DB_HOST=aws-0-us-west-2.pooler.supabase.com
DB_DATABASE=postgres
DB_PASSWORD=bfOJpzZtcoGhAJdP
DB_PORT=5432

# Supabase API
SUPABASE_URL=https://pruesizqytpscldieivb.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT
JWT_SECRET=un_secreto_secretoso_jamas_contado1234

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-7758657589560258-012213...
MERCADOPAGO_PUBLIC_KEY=APP_USR-375e7726-8315-48ad-9a60...

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=implanibot@gmail.com
EMAIL_PASS=qfjz gfrv qswq blss
```

---

## 🎯 Checklist Rápido

Antes de generar tu EAS Dev Build:

- [ ] Backend desplegado en Render
- [ ] Todas las variables de entorno configuradas
- [ ] `./test-render-backend.sh` pasa todas las pruebas
- [ ] Endpoint de health check responde OK
- [ ] Conexión con Supabase verificada
- [ ] Endpoints de tiendas retornan datos
- [ ] Tienes la URL del backend anotada

---

## 🚀 Siguiente Paso: EAS Dev Build

Una vez que todas las pruebas pasen, puedes generar tu EAS Dev Build:

```bash
# 1. Configura la URL del backend en tu app
# En Frontend/app.json o .env:
EXPO_PUBLIC_API_URL=https://tu-backend.onrender.com/api

# 2. Genera el build
cd Frontend
eas build --profile development --platform android
# o
eas build --profile development --platform ios
```

---

## 📞 ¿Necesitas Ayuda?

Si encuentras algún error que no puedes resolver:

1. Ejecuta el script de diagnóstico completo:
   ```bash
   ./test-render-backend.sh https://tu-backend.onrender.com > test-results.txt
   ```

2. Revisa los logs de Render (Dashboard → Logs)

3. Verifica la configuración de Supabase

4. Comparte los logs y resultados para obtener ayuda específica

---

**✨ ¡Buena suerte con tu deployment!**
