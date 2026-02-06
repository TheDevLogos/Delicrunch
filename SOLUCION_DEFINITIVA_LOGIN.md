# 🔧 SOLUCIÓN DEFINITIVA - Errores de Login en Expo con GitHub Codespaces

## 📋 Resumen del Problema

Al iniciar sesión en la app de Expo, se presentaban los siguientes errores:

```
ERROR ⚠️ Servidor respondió con HTML en lugar de JSON: /profiles/gamification
ERROR ⚠️ Servidor respondió con HTML en lugar de JSON: /profiles/me
ERROR [API ERROR] en handleLogin: { "status": 401, "url": "/auth/login" }
www-authenticate: tunnel
```

### 🎯 Causa Root del Problema

El **puerto 5001 de GitHub Codespaces NO estaba configurado como público**, lo que causaba que el túnel de GitHub interceptara las peticiones y devolviera un error 401 de autenticación del túnel (no del backend).

## ✅ Solución Implementada

### 1. Script Automático de Corrección

Se creó el script `fix-codespaces-tunnel.sh` que:

- ✅ Verifica que el backend esté corriendo
- ✅ Configura el puerto 5001 como público usando `gh CLI`
- ✅ Prueba la conexión al backend
- ✅ Verifica que el login funcione correctamente
- ✅ Actualiza automáticamente el `Frontend/.env` con la URL correcta

**Uso:**
```bash
./fix-codespaces-tunnel.sh
```

### 2. Configuración Manual (Alternativa)

Si el script no funciona automáticamente:

1. **Abrir la pestaña PORTS en VS Code** (panel inferior)
2. **Buscar el puerto 5001**
3. **Clic derecho → "Port Visibility" → "Public"**
4. **Esperar unos segundos** para que el cambio se aplique

### 3. Verificación de las Configuraciones

#### Backend (`/workspaces/Delicrunch/Backend/.env`):
```env
JWT_SECRET=un_secreto_secretoso_jamas_contado1234
DATABASE_URL=postgresql://postgres:Qazwsx1234@localhost:5432/delicrunch
PORT=5001
```

#### Frontend (`/workspaces/Delicrunch/Frontend/.env`):
```env
EXPO_PUBLIC_API_URL=https://silver-telegram-7vx44jrgxxqrhrw79-5001.app.github.dev/api
```

## 🔍 Análisis Técnico Completo

### Backend (Node.js/Express)

#### 1. Servidor Principal ([server.js](Backend/server.js))
- ✅ Escucha en `0.0.0.0:5001` (todas las interfaces)
- ✅ CORS habilitado
- ✅ Middleware `ensureJson` asegura respuestas JSON
- ✅ Rutas correctamente configuradas:
  - `/api/auth/*` → Autenticación
  - `/api/profiles/*` → Perfiles de usuario
  - `/api/products/*` → Productos
  - `/api/orders/*` → Pedidos

#### 2. Controlador de Autenticación ([authController.js](Backend/controllers/authController.js))
- ✅ `loginUser` valida email y contraseña
- ✅ Usa bcrypt para comparar contraseñas hasheadas
- ✅ Genera JWT con `user.id` y `user.role`
- ✅ Logs detallados para debugging

#### 3. Middleware de Autenticación ([authMiddleware.js](Backend/middleware/authMiddleware.js))
- ✅ Verifica token JWT en header `x-auth-token`
- ✅ También soporta `Authorization: Bearer <token>`
- ✅ Decodifica y valida el token
- ✅ Inyecta `req.user` para rutas protegidas

#### 4. Base de Datos
- ✅ Usuario de prueba existe: `compradordelicias@test.com`
- ✅ Contraseña correctamente hasheada con bcrypt
- ✅ Rol: `buyer`
- ✅ Hash válido: `$2b$10$HjNTjxQEN0H4zCisEQS38.FwG0i9Ym3hcoDosrlJXI56tXKUiODV2`

### Frontend (React Native/Expo)

#### 1. Cliente API ([services/api.js](Frontend/services/api.js))

**Configuración de URL:**
```javascript
const getApiUrl = () => {
  // 1. Prioridad: extra.apiUrl de app.config.js
  const expoExtraApi = Constants.expoConfig?.extra?.apiUrl;
  
  // 2. Variable de entorno runtime
  if (process.env.EXPO_PUBLIC_API_URL) {
    return ensureApiSuffix(process.env.EXPO_PUBLIC_API_URL);
  }
  
  // 3. Fallbacks...
}
```

**Interceptores de Axios:**
- ✅ **Request Interceptor**: Añade automáticamente el token a cada petición
- ✅ **Response Interceptor**: 
  - Detecta respuestas HTML y las convierte en errores claros
  - Limpia el token automáticamente en errores 401
  - Maneja errores de túnel

#### 2. Contexto de Autenticación ([contexts/AuthContext.js](Frontend/contexts/AuthContext.js))
- ✅ Almacena el token en AsyncStorage
- ✅ Incluye el token en todas las peticiones autenticadas
- ✅ Maneja el estado de autenticación globalmente

## 🧪 Pruebas de Validación

### 1. Prueba Local (Exitosa)
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"compradordelicias@test.com","password":"password123"}'

# Respuesta: {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
```

### 2. Prueba del Túnel (Exitosa después de configurar como público)
```bash
curl -X POST https://silver-telegram-7vx44jrgxxqrhrw79-5001.app.github.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"compradordelicias@test.com","password":"password123"}'

# Respuesta: {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
```

### 3. Verificación de Contraseña (Exitosa)
```bash
node -e "const bcrypt = require('bcryptjs'); \
  bcrypt.compare('password123', '$2b$10$HjNTjxQEN0H4zCisEQS38.FwG0i9Ym3hcoDosrlJXI56tXKUiODV2') \
  .then(r => console.log('Match:', r));"

# Respuesta: Match: true
```

## 📱 Pasos para Probar en la App

### 1. Reiniciar el Servidor de Expo
```bash
cd /workspaces/Delicrunch/Frontend
npx expo start --clear
```

### 2. Abrir en tu Dispositivo
- Abre la app **Expo Go** en tu teléfono
- Escanea el código QR
- Espera a que la app se cargue

### 3. Iniciar Sesión
- Email: `compradordelicias@test.com`
- Contraseña: `password123`

### 4. Verificación
Los siguientes endpoints deberían funcionar correctamente:
- ✅ `POST /api/auth/login` → Login
- ✅ `GET /api/profiles/me` → Perfil del usuario
- ✅ `GET /api/profiles/gamification` → Datos de gamificación
- ✅ `GET /api/products` → Lista de productos
- ✅ `GET /api/stores` → Lista de tiendas

## 🐛 Debugging Adicional

### Si sigues viendo errores 401:

1. **Verificar que el puerto es público:**
```bash
gh codespace ports -c $CODESPACE_NAME
```
Debe mostrar "public" en la columna Visibility para el puerto 5001.

2. **Verificar logs del backend:**
```bash
tail -f /workspaces/Delicrunch/backend.log
```

3. **Probar directamente con curl:**
```bash
curl -i https://silver-telegram-7vx44jrgxxqrhrw79-5001.app.github.dev/api/health
```
No debe devolver `www-authenticate: tunnel`.

### Si el login falla con credenciales correctas:

1. **Verificar el usuario en la BD:**
```bash
psql postgresql://postgres:Qazwsx1234@localhost:5432/delicrunch \
  -c "SELECT id, email, role FROM users WHERE email='compradordelicias@test.com';"
```

2. **Verificar que JWT_SECRET esté configurado:**
```bash
grep JWT_SECRET /workspaces/Delicrunch/Backend/.env
```

3. **Ver logs detallados del backend:**
Los logs incluyen:
```
🔐 Intento de login: { email, passwordLength }
✅ Usuario encontrado: { id, email, rol }
🔑 Comparación de contraseña: { isMatch }
```

## 📚 Referencias de Archivos Clave

### Backend
- [server.js](Backend/server.js) - Servidor principal
- [authController.js](Backend/controllers/authController.js) - Lógica de autenticación
- [authMiddleware.js](Backend/middleware/authMiddleware.js) - Protección de rutas
- [authRoutes.js](Backend/routes/authRoutes.js) - Rutas de autenticación
- [profileRoutes.js](Backend/routes/profileRoutes.js) - Rutas de perfil

### Frontend
- [api.js](Frontend/services/api.js) - Cliente HTTP con Axios
- [AuthContext.js](Frontend/contexts/AuthContext.js) - Contexto de autenticación
- [app.config.js](Frontend/app.config.js) - Configuración de Expo

## 🎉 Resultado Final

✅ **Puerto 5001 configurado como público**  
✅ **Backend accesible desde el túnel de Codespaces**  
✅ **Login funcionando correctamente**  
✅ **Token JWT generado y validado**  
✅ **Rutas protegidas funcionando**  
✅ **Frontend conectado correctamente al backend**

## 💡 Lecciones Aprendidas

1. **GitHub Codespaces requiere puertos públicos** para acceso externo (como desde Expo Go)
2. **El error 401 con `www-authenticate: tunnel`** indica que el puerto no es público
3. **El backend funcionaba perfectamente localmente**, el problema era solo el túnel
4. **Los interceptores de Axios** son cruciales para detectar estos errores temprano
5. **Logs detallados en el backend** facilitan enormemente el debugging

## 🔄 Mantenimiento Futuro

### Al reiniciar Codespaces:
1. Ejecutar `./fix-codespaces-tunnel.sh`
2. O configurar manualmente el puerto 5001 como público

### Para persistir la configuración:
Crear `.devcontainer/devcontainer.json`:
```json
{
  "forwardPorts": [5001],
  "portsAttributes": {
    "5001": {
      "label": "Backend API",
      "onAutoForward": "notify",
      "visibility": "public"
    }
  }
}
```

---

**Autor:** GitHub Copilot  
**Fecha:** 26 de Enero de 2026  
**Versión:** 1.0.0
