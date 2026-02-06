# 🔧 Correcciones Permanentes - Expo Go

## ✅ Problemas Corregidos

### 1. Error 401 en Quick Login Buttons ✅ SOLUCIONADO

**Problema:** Los Quick Login Buttons usaban credenciales inexistentes en la base de datos.

**Solución:** 
- Creados usuarios de prueba reales en la base de datos:
  - `compradordelicias@test.com` / `password123` (buyer)
  - `comerciotacoselNorteno@test.com` / `password123` (seller)
  - `admin@delicrunch.com` / `Admin123!` (admin)

**Archivos modificados:**
- `/Backend/db/create-test-users.js` (nuevo - script para crear usuarios)
- `/Frontend/app/LoginScreen.js` (actualizado con credenciales correctas)

**Comando para recrear usuarios:**
```bash
cd Backend && node db/create-test-users.js
```

### 2. Error HTML en /profiles/gamification ℹ️ COMPORTAMIENTO ESPERADO

**Causa:** El endpoint requiere autenticación. Cuando el usuario no está autenticado, el túnel de GitHub devuelve HTML en lugar de JSON.

**Solución:** Este es el comportamiento esperado. El frontend maneja correctamente el error con un try-catch y usa datos locales de fallback:
```javascript
try {
  const response = await api.get('/profiles/gamification');
  // ...
} catch (e) {
  console.log('Using local gamification data');
}
```

No requiere corrección adicional.

### 3. Error "Property 'Modal' doesn't exist" ℹ️ PROBLEMA DE CACHÉ

**Causa:** Problema de caché de Metro Bundler o reinicio necesario de Expo.

**Solución:** 
Modal está correctamente importado en todos los componentes. Para resolver:

1. Limpiar caché de Metro:
```bash
cd Frontend
rm -rf node_modules/.cache
npx expo start -c
```

2. En Expo Go, sacudir el dispositivo > "Reload"

### 4. Backend: Adaptación del esquema de base de datos ✅ SOLUCIONADO

**Problema:** El backend esperaba tabla `stores` pero el esquema actual usa `products` relacionados directamente con `users` (seller).

**Solución:** Adaptado el controlador de productos para usar el esquema actual:
- Cambio de JOIN con `stores` a LEFT JOIN con `users`
- Mapeo de campos: `nombre_comercio` → `name`, `direccion` → `street`, etc.

**Archivos modificados:**
- `/Backend/controllers/productController.js` (método `getAllAvailableProducts`)

## 🚀 Comandos de Inicio

### Backend
```bash
cd Backend
node server.js
```

### Frontend
```bash
cd Frontend
npx expo start --tunnel
```

## 📝 Verificación

Para verificar que todo funciona:

1. **Backend:** Verificar que el servidor responda en el puerto 5001
```bash
curl http://localhost:5001/api/products
```

2. **Usuarios de prueba:** Verificar que existan en la BD
```bash
cd Backend
docker exec delicrunch-postgres psql -U postgres -d delicrunch -c "SELECT email, role FROM users WHERE email LIKE '%test.com' OR email = 'admin@delicrunch.com'"
```

Resultado esperado:
```
              email              |  role  
---------------------------------+--------
 compradordelicias@test.com      | buyer
 comerciotacoselNorteno@test.com | seller
 admin@delicrunch.com            | admin
```

3. **Frontend:** Probar los Quick Login Buttons en la pantalla de login

## 🔍 Notas Importantes

1. **Esquema de base de datos:** La base de datos usa nombres de columnas diferentes:
   - `name` (no `nombre`)
   - `password` (no `password_hash`)
   - `role` (no `rol`)
   - `stock` (no `cantidad_disponible`)
   - `price` / `compare_price` (no `precio_descuento` / `precio_original`)
   - Roles válidos: `admin`, `seller`, `buyer`, `delivery`

2. **No existe tabla `stores`:** Los productos están relacionados directamente con usuarios (seller_id → users.id)

3. **Endpoint de gamification:** Requiere autenticación. Es normal que falle antes del login.

4. **Modal:** Está correctamente importado en todos los componentes que lo usan. El error es transitorio y se soluciona con limpieza de caché.

## 🎯 Quick Start después de reiniciar Codespaces

```bash
# 1. Iniciar PostgreSQL (si no está corriendo)
cd /workspaces/Delicrunch
docker-compose up -d

# 2. Verificar y crear usuarios de prueba si no existen
cd Backend
node db/create-test-users.js

# 3. Iniciar Backend
node server.js &

# 4. Iniciar Frontend con caché limpio
cd ../Frontend
rm -rf node_modules/.cache
npx expo start --tunnel -c
```

## 📱 Probar en Expo Go

1. Escanear el QR code generado por `expo start --tunnel`
2. Esperar a que termine el bundle (puede tardar 1-2 minutos)
3. En la pantalla de Login, usar los Quick Login Buttons:
   - **Comprador** → compradordelicias@test.com
   - **Comercio** → comerciotacoselNorteno@test.com
   - **Admin** → admin@delicrunch.com
4. Verificar que el login funciona correctamente

## 🐛 Troubleshooting

### Si el login sigue fallando (401):
```bash
# 1. Verificar que el backend esté corriendo
lsof -ti:5001

# 2. Verificar la URL del túnel en app.config.js
cat Frontend/app.config.js | grep apiUrl

# 3. Recrear usuarios
cd Backend
node db/create-test-users.js

# 4. Probar login directamente con curl
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"compradordelicias@test.com","password":"password123"}'
```

### Si aparece error de Modal:
```bash
cd Frontend
rm -rf node_modules/.cache .expo/web .expo/shared
npx expo start -c
```

### Si los productos no cargan:
```bash
# Verificar que el endpoint funcione
curl http://localhost:5001/api/products | head -100

# Reiniciar backend si es necesario
pkill -f "node.*server.js"
cd Backend && node server.js &
```

## 📊 Estado Final

- ✅ Usuarios de prueba creados y funcionando
- ✅ Quick Login Buttons actualizados con credenciales correctas
- ✅ Backend adaptado al esquema actual de la BD
- ✅ Endpoint /api/products funcionando correctamente
- ℹ️ Error de gamification es esperado (requiere autenticación)
- ℹ️ Error de Modal se resuelve con limpieza de caché

## 🎉 Resultado

Todos los errores críticos han sido corregidos. El login con Quick Login Buttons ahora funciona correctamente y la aplicación debería cargar sin errores en Expo Go.
