# Guía de EAS Build para Android (Desarrollo)

## 📋 Pre-requisitos Verificados ✅

### Configuración de EAS
- ✅ `eas.json` configurado con perfil `development`
- ✅ `app.json` con `package: com.delicrunch.app`
- ✅ `app.config.js` lee variables de entorno correctamente
- ✅ `google-services.json` existe (placeholder válido para dev)
- ✅ EAS Project ID: `266fa507-5eba-4cf8-b44f-0aa42d08a694`

### Variables de Entorno
- ✅ `EXPO_PUBLIC_API_URL`: https://delicrunch.onrender.com/api
- ✅ `EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY`: Configurada
- ✅ `EXPO_PUBLIC_SUPABASE_URL`: Configurada
- ✅ `EXPO_PUBLIC_SUPABASE_KEY`: Configurada (anon key)

### Backend Desplegado
- ✅ URL: https://delicrunch.onrender.com
- ✅ Health Check: https://delicrunch.onrender.com/health
- ✅ Conexión Supabase: Activa

---

## 🚀 Paso 1: Testing de Endpoints (ANTES de Build)

### Verifica los endpoints críticos:

```bash
# Health Check
curl https://delicrunch.onrender.com/health

# Listar todas las tiendas
curl https://delicrunch.onrender.com/api/stores

# Login (Postman o curl)
curl -X POST https://delicrunch.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "comercio@delicrunch.com",
    "password": "Password123"
  }'

# Listar productos
curl https://delicrunch.onrender.com/api/products
```

### Respuestas Esperadas:

**✅ Health Check:**
```json
{"success": true, "status": "healthy", "uptime": 123}
```

**✅ Stores:**
```json
{
  "success": true,
  "count": 3,
  "data": [...]
}
```

**✅ Login:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {...}
}
```

---

## 🔧 Paso 2: Preparar Build de Desarrollo

### 2.1 Instalar EAS CLI (si no está instalado)

```bash
npm install -g eas-cli
```

### 2.2 Login en EAS (usando tu cuenta de Expo)

```bash
eas login
```

Usuario: `alonsovl88`

### 2.3 Verificar configuración del proyecto

```bash
cd /workspaces/Delicrunch/Frontend
eas build:configure
```

Debe confirmar que el `projectId` existe: `266fa507-5eba-4cf8-b44f-0aa42d08a694`

---

## 📱 Paso 3: Build de Desarrollo para Android

### Opción A: Build APK de Desarrollo (Recomendado para testing)

```bash
cd /workspaces/Delicrunch/Frontend
eas build --profile development --platform android
```

**Características:**
- ✅ APK instalable directo en dispositivo
- ✅ Incluye Development Client (Expo Dev Client)
- ✅ No requiere Expo Go
- ✅ Permite hot reload en desarrollo
- ⏱️ Tiempo de build: 10-20 minutos

### Opción B: Build APK Preview (Sin Development Client)

```bash
cd /workspaces/Delicrunch/Frontend
eas build --profile preview --platform android
```

**Características:**
- ✅ APK standalone completo
- ✅ Más rápido de buildear
- ❌ Sin hot reload
- ⏱️ Tiempo de build: 8-15 minutos

---

## 📥 Paso 4: Descargar e Instalar

### 4.1 Después del Build

EAS te dará un link como:
```
🎉 Build successful!
Download: https://expo.dev/accounts/alonsovl88/projects/delicrunch-frontend/builds/abc123...
```

### 4.2 Instalar en Android

1. Descarga el APK desde el link
2. Transfiere el APK a tu dispositivo Android
3. Habilita "Fuentes desconocidas" en Configuración → Seguridad
4. Instala el APK
5. Abre la app "Delicrunch"

---

## 🧪 Paso 5: Testing en Dispositivo

### Funcionalidades a probar:

1. **Login**
   - Email: `comercio@delicrunch.com`
   - Password: `Password123`

2. **Visualización de comercios**
   - Debe mostrar 3 comercios (Taquería las Delicias, etc.)

3. **Productos**
   - Ver productos por comercio
   - Filtros de categoría

4. **Mercado Pago**
   - Botón de pago debe abrir checkout
   - Sandbox mode activo

5. **Geolocalización**
   - Mapa con ubicación de comercios

---

## 🔥 Solución de Problemas Comunes

### Error: "google-services.json not found"

**Solución:** Ya tienes el placeholder correcto. Si persiste:
```bash
cd Frontend
ls google-services.json  # Debe existir
```

### Error: "Unable to resolve module"

**Solución:** Limpiar cache antes de build:
```bash
cd Frontend
rm -rf node_modules
npm cache clean --force
npm install
```

### Error: "Metro bundler failed"

**Solución:** Verificar que no haya errores de sintaxis:
```bash
cd Frontend
npx expo start --no-dev --minify
```

### Error en build: "Gradle execution failed"

**Solución:** Verificar que `app.json` tenga la estructura correcta de Android:
```json
{
  "android": {
    "package": "com.delicrunch.app",
    "permissions": [...]
  }
}
```

---

## 📊 Monitoreo del Build

Durante el build, puedes monitorear en:
```
https://expo.dev/accounts/alonsovl88/projects/delicrunch-frontend/builds
```

Estados del build:
- 🔵 **In Queue**: Esperando recursos
- 🟡 **In Progress**: Compilando
- 🟢 **Finished**: Exitoso - descargar APK
- 🔴 **Failed**: Error - revisar logs

---

## 🎯 Checklist Pre-Build

Antes de ejecutar el build, verifica:

- [ ] Backend funcionando en Render
- [ ] Health check responde correctamente
- [ ] Endpoint `/api/stores` retorna datos
- [ ] Login funciona con Postman
- [ ] Variables de entorno actualizadas en `.env`
- [ ] `google-services.json` existe en Frontend/
- [ ] `app.json` tiene `apiUrl` correcto
- [ ] Git commit y push realizados

---

## 🚀 Comando Final (Cuando todo esté listo)

```bash
cd /workspaces/Delicrunch/Frontend
eas build --profile development --platform android --non-interactive
```

⏱️ **Tiempo estimado:** 15-20 minutos

---

## 📱 Después del Build Exitoso

1. Descargar APK desde el link de Expo
2. Instalar en dispositivo Android físico
3. Probar login con credenciales de prueba
4. Verificar que la app conecta con el backend de Render
5. Probar flujo completo de compra

---

## 📝 Notas Importantes

- **Development Client**: Permite hot reload y debugging avanzado
- **Preview APK**: Build rápido para testing standalone
- **Production**: Requiere configuración adicional y Google Play signing
- **google-services.json**: Placeholder es suficiente para dev, pero necesitas el real para notificaciones push en producción

---

## 🆘 Soporte

Si algo falla:
1. Revisar logs del build en Expo dashboard
2. Verificar que el backend responde correctamente
3. Comprobar que las variables de entorno estén bien configuradas
4. Validar que no hay errores de TypeScript/JavaScript en el código

Para más información: https://docs.expo.dev/build/setup/
