# 🚀 DELICRUNCH - Inicio Rápido

## ⚡ Un Solo Comando

```bash
./start.sh
```

**Esto hace todo automáticamente:**
1. ✅ Inicia PostgreSQL (Docker)
2. ✅ Configura usuarios de prueba
3. ✅ Arranca el Backend (puerto 5001)
4. ✅ Hace el puerto público en Codespace
5. ✅ Configura `EXPO_PUBLIC_API_URL`
6. ✅ Inicia Expo con túnel

---

## 📱 Probar la App

### 1. Escanea el QR con Expo Go
Cuando aparezca el código QR en la terminal:
- **iPhone**: App Cámara → escanear → "Abrir en Expo Go"
- **Android**: Expo Go → botón "Scan QR code"

### 2. Inicia sesión
```
Email: admindeli@delicrunch.com
Password: Admin1234
```

### 3. ¡Listo! 🎉
Navega por la app usando el menú ☰

---

## 🔧 Solución de Problemas

### Error "Network Error" o "Failed to connect"
El puerto 5001 no está público. Solución:
1. Panel PORTS en VS Code (abajo)
2. Click derecho en puerto 5001
3. Port Visibility → Public

### Error 401 en login
Las contraseñas no están configuradas. Ejecuta:
```bash
PGPASSWORD=Qazwsx1234 psql -h localhost -U postgres -d delicrunch -c \
"UPDATE users SET password_hash = '\$2b\$10\$Ikj.SYxhDZ6H9jLZIySKnuv6nbS0XzyD0XAil.nGZKdWasgYCMZVq' WHERE email LIKE '%delicrunch.com' OR email LIKE '%demo.com';"
```

### Reiniciar todo desde cero
```bash
# Detener todo
pkill -f "node.*server.js"
pkill -f "expo start"

# Iniciar de nuevo
./start.sh
```

---

## 👥 Usuarios de Prueba

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admindeli@delicrunch.com | Admin1234 |
| Comercio | espiga@demo.com | Admin1234 |
| Comercio | aroma@demo.com | Admin1234 |
| Comprador | comprador@delicrunch.com | Comprador123 |

---

## 📊 Sistema Completo

✅ Backend corriendo (puerto 5001)  
✅ PostgreSQL conectada  
✅ 16 productos disponibles  
✅ Frontend Expo activo  
✅ Autenticación JWT  
✅ Todas las pantallas integradas  

---

## 📁 Documentos Útiles

En `/workspaces/Delicrunch/`:
- **README_FINAL.md** - Resumen completo
- **SYSTEM_STATUS.md** - Estado del sistema
- **DRAWER_NAVIGATOR_GUIDE.md** - Guía detallada de cada pantalla
- **IMPLEMENTATION_COMPLETE.md** - Documentación técnica

---

## 🧪 Probar Funcionalidades

### Historial de Compras
1. Ir a "Mis Compras"
2. Ver lista de pedidos (si existen)
3. Deslizar hacia abajo para refresh
4. Si hay pedidos recogidos, verás botón "Dejar Reseña"

### Mis Reseñas
1. Ir a "Mis Reseñas"
2. Ver reseñas enviadas
3. Calificación con estrellas
4. Comentarios

### Favoritos
1. Ir a "Favoritos"
2. Ver productos guardados
3. Ver detalles del producto
4. Eliminar con botón "Quitar"

### Cambiar Categoría
1. Selecciona una categoría del menú
2. Ve productos de esa categoría
3. Búscalo en Home también

---

## 🌐 Codespaces: API y Puertos

- Edita `Frontend/.env` y asegúrate de que tenga:

  ```
  EXPO_PUBLIC_API_URL=https://<TU_CODESPACE>-5001.app.github.dev/api
  ```

- Haz público el puerto `5001` para que Expo Go (fuera del Codespace) pueda acceder al backend:

  ```bash
  gh codespace ports visibility -c "$CODESPACE_NAME" 5001:public
  ```

- Reinicia Expo con tunnel para que los dispositivos móviles se conecten fácilmente (o fuerza LAN si lo prefieres):

  ```bash
  # Modo por defecto: tunnel
  ./scripts/start-dev.sh
  
  # Forzar modo LAN (útil si ngrok falla):
  EXPO_MODE=lan ./scripts/start-dev.sh
  
  # Forzar puerto (por ejemplo 8081):
  EXPO_PORT=8081 ./scripts/start-dev.sh
  ```

Si ves `401` en login desde Expo Go, normalmente es porque el puerto 5001 no es público o la `EXPO_PUBLIC_API_URL` no apunta al dominio del Codespace.

## ⚠️ Si algo no funciona

### Producto no carga
→ Espera 1-2 minutos (Metro bundler)

### Cargas infinitas en Mis Compras
→ Asegúrate de estar logueado
→ Desliza hacia abajo (pull-to-refresh)

### Token expirado
→ Logout (en perfil)
→ Login nuevamente

### Backend no responde
```bash
# Revisa logs:
cat /tmp/backend.log

# Reinicia:
pkill -f "node.*server"
cd Backend && node server.js &
```

---

## 🎯 Flujo Completo

```
Login
  ↓
DrawerNavigator (9 pantallas)
  ├→ Home (ver productos)
  │   └→ ProductDetail (detalles)
  │       ├→ Agregar favorito
  │       └→ Comprar
  │
  ├→ Mi Perfil (datos usuario)
  │   └→ Editar/Logout
  │
  ├→ Mis Compras (historial) ⭐
  │   └→ Dejar reseña (si aplica)
  │
  ├→ Mis Reseñas (evaluaciones) ⭐
  │
  ├→ Favoritos (wishlist) ⭐
  │   ├→ Ver detalles
  │   └→ Eliminar
  │
  └→ Categorías (4 opciones)
```

---

## 💡 Tips

- El menú ☰ se abre desde cualquier pantalla
- Desliza a la derecha para cerrar el menu
- Pull-to-refresh (desliza hacia abajo) en Mis Compras
- Todos los botones tienen confirmación
- El diseño es "neobrutalism" (bordes gruesos, colores vibrantes)

---

## 📞 Verificación Rápida

```bash
# Backend funcionando?
curl http://localhost:5001/api/products | jq '.length'
# Deberías ver: 16 (o más)

# Puedes logearte?
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admindeli@delicrunch.com","password":"Admin1234"}' | jq '.token'
# Deberías ver un token JWT
```

---

**¡Sistema listo para producción!** ✨

Presiona `r` en terminal de Expo si necesitas recargar.
