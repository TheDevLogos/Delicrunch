# 🚀 Delicrunch - Expo SDK 54

## 📱 App de Marketplace Local con Mercado Pago

**Delicrunch** es una aplicación móvil de marketplace que conecta compradores con tiendas locales. Ahora actualizada a **Expo SDK 54** con integración completa de Mercado Pago.

---

## ⚡ Inicio Rápido

### 🚀 Inicio Automático (Recomendado)

```bash
# Iniciar todo (Backend + Frontend + PostgreSQL)
./start-delicrunch.sh
```

**Este script automáticamente:**
- ✅ Detecta GitHub Codespaces y configura puertos públicos
- ✅ Inicia PostgreSQL (Docker o existente)  
- ✅ Configura la base de datos y ejecuta migraciones
- ✅ Inicia el Backend API con Mercado Pago
- ✅ Pobla datos de prueba (comercios, productos, usuarios)
- ✅ Inicia el Frontend en modo tunnel
- ✅ Configura URLs públicas automáticamente

### 🔍 Diagnóstico de Problemas

```bash
# Ver estado del sistema y conectividad
./diagnose-connectivity.sh
```

### 🌐 Configurar Puertos Públicos (Solo Codespaces)

```bash
# Si tienes problemas de conexión desde tu dispositivo
./configure-public-ports.sh
```

### Requisitos Previos
- Node.js v22.21.1 o superior
- npm 9.8.1 o superior
- Docker (para PostgreSQL)
- **Expo Go** app en tu dispositivo Android (desde Google Play)

### 1. Clonar e Instalar

```bash
# Clonar el repositorio
git clone <tu-repo>
cd Delicrunch

# Instalar dependencias del backend
cd Backend
npm install

# Instalar dependencias del frontend
cd ../Frontend
npm install
```

### 2. Iniciar la Aplicación

#### Opción A: Todo junto (Backend + Frontend)
```bash
cd /workspaces/Delicrunch
bash ./scripts/start-dev.sh
```

#### Opción B: Solo Frontend (Expo SDK 54)
```bash
cd /workspaces/Delicrunch
bash ./scripts/start-expo-sdk54.sh
```

Luego escanea el código QR con **Expo Go** en tu dispositivo Android.

---

## 🎯 Características Principales

### Para Compradores
- 🏪 Explorar tiendas y productos locales
- 🛒 Carrito de compras y checkout
- 💳 Pagos integrados con Stripe
- 📍 Ubicación y mapas
- ⭐ Sistema de reseñas
- 📦 Historial de pedidos
- ❤️ Lista de favoritos

### Para Vendedores
- 📊 Panel de control del negocio
- 📦 Gestión de productos
- 💰 Gestión de pedidos
- 💳 Onboarding de Stripe
- 📈 Sistema de recompensas

---

## 📋 Stack Tecnológico

### Frontend (SDK 54)
- **Expo SDK**: 54.0.30
- **React**: 19.1.0
- **React Native**: 0.81.5
- **React Navigation**: 6.x (Stack, Tabs, Drawer)
- **Stripe React Native**: 0.50.3
- **React Native Maps**: 1.20.1
- **Axios**: HTTP client

### Backend
- **Node.js**: 22.x
- **Express**: 4.x
- **PostgreSQL**: Base de datos
- **JWT**: Autenticación
- **Bcrypt**: Hash de contraseñas
- **Stripe**: Pagos y Connect

---

## 🗂️ Estructura del Proyecto

```
Delicrunch/
├── Backend/
│   ├── server.js              # Servidor Express
│   ├── controllers/           # Lógica de negocio
│   ├── routes/                # Rutas API
│   ├── middleware/            # Autenticación, errores
│   └── db/                    # Migraciones y seeds
│
├── Frontend/
│   ├── App.js                 # App principal
│   ├── app.json               # Configuración Expo SDK 54
│   ├── app/                   # Pantallas
│   ├── components/            # Componentes reutilizables
│   ├── navigation/            # Navegación
│   ├── contexts/              # Context API
│   └── services/              # API calls
│
└── scripts/
    ├── start-dev.sh           # Iniciar todo
    └── start-expo-sdk54.sh    # Solo frontend
```

---

## 🔧 Configuración

### Variables de Entorno

**Backend** (`Backend/.env`):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/delicrunch
JWT_SECRET=tu_jwt_secret_aqui
STRIPE_SECRET_KEY=tu_stripe_secret_key
STRIPE_WEBHOOK_SECRET=tu_stripe_webhook_secret
PORT=3000
```

**Frontend** (`Frontend/.env`):
```env
EXPO_PUBLIC_API_URL=http://tu-ip:3000
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=tu_stripe_publishable_key
```

---

## 📱 Navegación de la App

### Compradores (DrawerNavigator)

```
┌─────────────────────────┐
│   🏠 Home               │ → Catálogo de productos
│   👤 Mi Perfil          │ → Perfil del usuario
│   📦 Mis Pedidos        │ → Historial de compras
│   ⭐ Mis Reseñas        │ → Reseñas enviadas
│   ❤️  Favoritos         │ → Productos guardados
│   💰 Mis Recompensas    │ → Puntos y premios
│   💳 Métodos de Pago    │ → Tarjetas guardadas
│   🔍 Explorar           │ → Buscar tiendas
│   📍 Descubrir          │ → Mapa de tiendas
└─────────────────────────┘
```

### Vendedores (TabNavigator)

```
┌───────────────┬───────────────┬───────────────┐
│   📊 Panel    │  📦 Productos │  💰 Pedidos   │
└───────────────┴───────────────┴───────────────┘
```

---

## 🎨 Diseño

La app utiliza un sistema de diseño **neobrutalism** con:
- Colores vibrantes (naranja, cyan, púrpura)
- Bordes gruesos negros
- Sombras pronunciadas
- Tipografía bold

---

## 🔐 Autenticación

El sistema de autenticación incluye:
- Registro de usuarios (Buyer/Merchant)
- Login con JWT
- Recuperación de contraseña
- Protección de rutas por rol
- Tokens de sesión persistentes

---

## 💳 Integración de Pagos

### Stripe Connect
- Onboarding de vendedores
- Pagos directos a vendedores
- Gestión de cuentas connect
- Webhooks para eventos

### Stripe Payments
- Checkout con tarjeta
- Guardado de métodos de pago
- Procesamiento seguro
- Historial de transacciones

---

## 📚 Documentación Adicional

- [**Actualización a SDK 54**](EXPO_SDK_54_UPGRADE.md) - Detalles de la migración
- [**Guía de Navegación**](DRAWER_NAVIGATOR_GUIDE.md) - Implementación del Drawer
- [**Sistema de Reseñas**](REVIEWS_SYSTEM.md) - Documentación de reviews
- [**Guía de Inicio**](QUICK_START.md) - Setup rápido
- [**Estado del Sistema**](SYSTEM_STATUS.md) - Features completados

---

## 🐛 Solución de Problemas

### La app no inicia en Expo Go
1. Verifica que Expo Go esté actualizado (versión 2.31.0+)
2. Asegúrate de estar en la misma red WiFi
3. Limpia la caché:
   ```bash
   cd Frontend
   npx expo start --clear
   ```

### Error "Cannot find module 'react-native-worklets/plugin'"
Este error ya está resuelto. Si aparece, verifica:
1. Que `react-native-worklets@0.5.1` esté instalado
2. Que exista el archivo `babel.config.js`
3. Limpia la caché: `rm -rf .expo && npx expo start --clear`

Ver [solución completa](Frontend/WORKLETS_FIX.md) para más detalles.

### Error de conexión con el backend
1. Verifica que el backend esté corriendo en el puerto 3000
2. Asegúrate de que `EXPO_PUBLIC_API_URL` tenga la IP correcta
3. Verifica que no haya firewall bloqueando

### Error "Port 8081 already in use"
```bash
pkill -f "expo start"
npx expo start
```

### Problemas con dependencias
```bash
cd Frontend
rm -rf node_modules .expo
npm cache clean --force
npm install
```

---

## 🚀 Deployment

### Backend
- Puede desplegarse en Railway, Render, DigitalOcean
- Requiere PostgreSQL
- Configurar variables de entorno

### Frontend
- Puede construirse con EAS Build
- Publicar en Google Play / App Store
- O usar Expo Go para desarrollo

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la licencia 0BSD - ver el archivo LICENSE para más detalles.

---

## 👥 Soporte

Si tienes problemas o preguntas:
1. Revisa la [documentación](EXPO_SDK_54_UPGRADE.md)
2. Busca en issues existentes
3. Crea un nuevo issue con detalles

---

## ✨ Actualizado

**Fecha**: 2 de enero de 2026  
**Versión**: Expo SDK 54.0.30  
**Estado**: ✅ Producción

---

**Hecho con ❤️ para conectar comunidades locales**
