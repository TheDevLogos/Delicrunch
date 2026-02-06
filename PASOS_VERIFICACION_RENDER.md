# ✅ Pasos para Verificar tu Backend en Render

## 🎯 Objetivo
Verificar que tu backend en Render esté funcionando correctamente y conectado con Supabase antes de generar un EAS Dev Build.

---

## 📍 Paso 1: Obtener la URL de tu Backend en Render

1. Ve a [https://dashboard.render.com](https://dashboard.render.com)
2. Busca tu servicio de backend (probablemente se llama algo como "delicrunch-backend" o "backend")
3. **Copia la URL completa** que aparece en la parte superior del dashboard
   - Ejemplo: `https://delicrunch-backend-xxxx.onrender.com`
   - ⚠️ **NO** incluyas `/api` al final, solo la URL base

---

## 📍 Paso 2: Verificar que el Deploy esté Activo

En el dashboard de Render, verifica:

- ✅ El status debe ser **"Live"** (verde)
- ✅ Los logs no deben mostrar errores críticos
- ✅ El servicio debe haber completado el último deploy exitosamente

Si el servicio está en estado "Failed" o "Building":
- Espera a que termine
- Si falla, revisa los logs para ver el error

---

## 📍 Paso 3: Ejecutar el Script de Verificación

En tu terminal de Codespaces, ejecuta:

```bash
./test-render-backend.sh https://TU-URL-DE-RENDER.onrender.com
```

**Reemplaza `TU-URL-DE-RENDER.onrender.com` con la URL que copiaste en el Paso 1**

### Ejemplo:
```bash
./test-render-backend.sh https://delicrunch-backend-abc123.onrender.com
```

---

## 📊 Paso 4: Interpretar los Resultados

### ✅ Caso 1: TODAS LAS PRUEBAS PASARON

Si ves este mensaje:

```
═══════════════════════════════════════════════════
  RESUMEN DE PRUEBAS
═══════════════════════════════════════════════════

Total de pruebas: 12
✅ Pruebas exitosas: 12
❌ Pruebas fallidas: 0

¡TODAS LAS PRUEBAS PASARON!

✨ Tu backend en Render está funcionando correctamente ✨

Próximos pasos:
1. ✅ Backend desplegado y funcionando en Render
2. ✅ Conexión con Supabase establecida
3. 🚀 Puedes proceder a generar tu EAS Dev Build
```

**🎉 ¡Perfecto! Puedes proceder al Paso 5**

---

### ⚠️ Caso 2: ALGUNAS PRUEBAS FALLARON

Si algunas pruebas fallan, sigue estos pasos:

#### A) Identifica qué falló

Lee los mensajes de error específicos. Los más comunes:

**Error: Connection refused**
- ❌ El servicio no está corriendo
- **Solución:** Ve al dashboard de Render y asegúrate de que el servicio esté "Live"

**Error: Database connection failed**
- ❌ Las variables de Supabase están mal configuradas
- **Solución:** Ve a la sección "Troubleshooting" abajo

**Error: 404 Not Found**
- ❌ Las rutas no están configuradas correctamente
- **Solución:** Verifica que el Start Command sea `cd Backend && npm start`

#### B) Revisar Logs de Render

1. Dashboard de Render → Tu servicio → Tab **"Logs"**
2. Busca líneas que contengan "ERROR" o "Failed"
3. Presta atención a errores de variables de entorno

#### C) Verificar Variables de Entorno

1. Dashboard de Render → Tu servicio → Tab **"Environment"**
2. Compara con la lista de variables en [GUIA_VERIFICACION_RENDER.md](GUIA_VERIFICACION_RENDER.md)
3. Las variables críticas son:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `DB_USER`, `DB_HOST`, `DB_PASSWORD`, `DB_PORT`, `DB_DATABASE`
   - `JWT_SECRET`

#### D) Probar Endpoints Específicos

```bash
# Probar solo la conexión con Supabase
./test-render-endpoints.sh https://TU-URL.onrender.com database

# Probar solo health check
./test-render-endpoints.sh https://TU-URL.onrender.com health

# Probar solo tiendas
./test-render-endpoints.sh https://TU-URL.onrender.com stores
```

---

## 📍 Paso 5: Configurar tu Frontend para EAS Build

Una vez que todas las pruebas pasen:

### A) Actualiza tu configuración

En tu archivo `Frontend/app.json` o donde configures Expo:

```json
{
  "extra": {
    "EXPO_PUBLIC_API_URL": "https://TU-URL-DE-RENDER.onrender.com/api"
  }
}
```

O en tu archivo `.env`:

```bash
EXPO_PUBLIC_API_URL=https://TU-URL-DE-RENDER.onrender.com/api
```

⚠️ **IMPORTANTE:** Nota el `/api` al final de la URL

### B) Verifica la configuración

```bash
cd Frontend
cat app.json | grep EXPO_PUBLIC_API_URL
# Debe mostrar tu URL de Render con /api al final
```

---

## 📍 Paso 6: Generar EAS Dev Build

Ahora sí, puedes generar tu build:

```bash
cd Frontend

# Para Android
eas build --profile development --platform android

# Para iOS (si tienes cuenta de Apple Developer)
eas build --profile development --platform ios

# O ambas
eas build --profile development --platform all
```

---

## 🛠️ Troubleshooting Común

### ❌ Error: "SUPABASE_SERVICE_KEY not found"

**Causa:** Falta la variable de entorno en Render

**Solución:**
1. Dashboard de Render → Environment
2. Agrega:
   ```
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBydWVzaXpxeXRwc2NsZGllaXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTc4MzAyNCwiZXhwIjoyMDg1MzU5MDI0fQ.8KRuUKFFaDZK1pBUuPKi6KKSV1zWxLeyu2KTKJYyJaY
   ```
3. Guarda y espera el redeploy automático

---

### ❌ Error: "Connection timeout"

**Causa:** Usando el puerto incorrecto de Supabase

**Solución:**
Verifica que en Render tengas:
```
DB_PORT=5432
DB_HOST=aws-0-us-west-2.pooler.supabase.com
```

**NO** uses puerto 6543 (ese es para serverless)

---

### ❌ Error: "Invalid JWT"

**Causa:** Falta JWT_SECRET

**Solución:**
1. Dashboard de Render → Environment
2. Agrega:
   ```
   JWT_SECRET=un_secreto_secretoso_jamas_contado1234
   ```

---

### ❌ Render está en loop de redeploy

**Causa:** Error en el código o configuración que hace que el servicio falle al iniciar

**Solución:**
1. Ve a los logs de Render
2. Identifica el error específico
3. Generalmente es por:
   - Variable de entorno faltante
   - Error en la conexión a Supabase
   - Puerto mal configurado

---

## 📞 ¿Sigues teniendo problemas?

### 1. Genera un reporte de diagnóstico

```bash
./test-render-backend.sh https://TU-URL.onrender.com > diagnostico.txt
```

### 2. Revisa los logs de Render

Dashboard → Logs → Copia las últimas 50 líneas

### 3. Verifica las variables de entorno

Dashboard → Environment → Toma screenshot

### 4. Prueba endpoint por endpoint

```bash
# Uno por uno
./test-render-endpoints.sh https://TU-URL.onrender.com health
./test-render-endpoints.sh https://TU-URL.onrender.com database
./test-render-endpoints.sh https://TU-URL.onrender.com stores
./test-render-endpoints.sh https://TU-URL.onrender.com auth
```

---

## 📋 Checklist Final Antes de EAS Build

- [ ] Backend está "Live" en Render (no en Failed o Building)
- [ ] `./test-render-backend.sh` pasa TODAS las pruebas (0 fallos)
- [ ] El endpoint `/health` responde 200 OK
- [ ] El endpoint `/api/stores` retorna datos (aunque esté vacío)
- [ ] La conexión con Supabase está verificada
- [ ] Tienes la URL del backend anotada
- [ ] Has configurado `EXPO_PUBLIC_API_URL` en el frontend
- [ ] El frontend está configurado con la URL + `/api` al final

---

## 🚀 Después del EAS Build

Una vez que tengas tu `.apk` o instales el build en tu dispositivo:

1. La app debe conectarse a tu backend en Render
2. Verás datos reales de Supabase
3. Podrás probar el flujo completo de la aplicación

---

**¿Todo listo? ¡Adelante con el EAS Build! 🎉**

Para cualquier duda, revisa [GUIA_VERIFICACION_RENDER.md](GUIA_VERIFICACION_RENDER.md)
