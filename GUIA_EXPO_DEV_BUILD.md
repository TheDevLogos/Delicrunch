# 🥐 Guía Completa: Ejecutar Delicrunch con Expo Development Build

## 📋 Resumen

Tu aplicación Delicrunch utiliza `@stripe/stripe-react-native` que requiere **código nativo**. Esto significa que **NO puedes usar Expo Go** - necesitas crear un **Development Build** personalizado.

---

## 🔄 ¿Cuál es la diferencia?

| Característica | Expo Go | Development Build |
|----------------|---------|-------------------|
| Instalación | App Store/Play Store | Build personalizado |
| Código nativo | ❌ No soportado | ✅ Soportado |
| Stripe SDK | ❌ No funciona | ✅ Funciona |
| Hot Reload | ✅ Sí | ✅ Sí |
| Tamaño | ~80MB (incluye todo) | ~30-50MB (solo lo necesario) |

---

## 🚀 INICIO RÁPIDO

### Paso 1: Ejecutar el script de desarrollo

```bash
cd /workspaces/Delicrunch
./start-expo-dev-build.sh
```

Este script:
- ✅ Inicia PostgreSQL
- ✅ Configura la base de datos
- ✅ Inicia el Backend
- ✅ Crea un túnel público
- ✅ Inicia Expo Dev Server en modo `--dev-client`

### Paso 2: Crear el Development Build (primera vez)

#### Para Android (APK):

```bash
cd /workspaces/Delicrunch/Frontend

# 1. Login en EAS (Expo Application Services)
npx eas-cli login

# 2. Crear el build
npx eas build --platform android --profile development
```

Esto tomará ~10-15 minutos. Al finalizar recibirás un **link para descargar el APK**.

#### Para iOS:

```bash
cd /workspaces/Delicrunch/Frontend

# Requiere cuenta de Apple Developer ($99/año)
npx eas build --platform ios --profile development
```

### Paso 3: Instalar en tu dispositivo

#### Android:
1. Descarga el APK desde el link proporcionado por EAS
2. Habilita "Instalar desde fuentes desconocidas" en tu teléfono
3. Instala el APK
4. Abre la app **"Delicrunch"** (NO Expo Go)

#### iOS:
1. Usa TestFlight para instalar
2. O instala directamente vía Xcode/dispositivo conectado

### Paso 4: Conectar al Dev Server

1. Asegúrate de que el script `start-expo-dev-build.sh` esté corriendo
2. Abre la app **Delicrunch** en tu teléfono
3. La app mostrará una pantalla para ingresar la URL del dev server
4. Escanea el QR code que aparece en la terminal, o
5. Ingresa la URL manualmente (ej: `exp://...`)

---

## 📱 Comandos Útiles

### Scripts disponibles en Frontend/package.json:

```bash
cd Frontend

# Iniciar servidor de desarrollo (para Development Build)
npm run start:dev

# Iniciar con modo túnel (para acceso remoto)
npm run tunnel

# Crear prebuild (genera carpetas android/ios)
npm run prebuild:clean

# Builds con EAS
npm run build:android    # Build APK de desarrollo
npm run build:ios        # Build iOS de desarrollo
npm run build:all        # Ambas plataformas
```

### Limpiar caché:

```bash
cd Frontend
npx expo start --clear --dev-client
```

### Ver logs:

```bash
# Backend
tail -f /workspaces/Delicrunch/backend.log

# Frontend
tail -f /workspaces/Delicrunch/frontend.log

# Base de datos
docker compose logs -f postgres
```

---

## 🔧 Configuración Actual

### eas.json (perfiles de build):

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### app.json (configuración de la app):

- **Bundle ID Android**: `com.delicrunch.app`
- **Bundle ID iOS**: `com.delicrunch.app`
- **SDK Version**: 54.0.0
- **Plugins nativos**: Stripe, expo-build-properties, expo-font

---

## 🐛 Solución de Problemas

### Error: "Unable to find expo-dev-client"

```bash
cd Frontend
npm install expo-dev-client
npx expo prebuild --clean
```

### Error: "Stripe not initialized"

Verifica que `.env` tenga la key de Stripe:
```dotenv
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### La app no se conecta al backend

1. Verifica que el túnel esté activo
2. Revisa `.env` tenga la URL correcta
3. En Codespaces: asegúrate de que el puerto 5001 sea público

### Build falla con error de dependencias

```bash
cd Frontend
rm -rf node_modules package-lock.json
npm install
npx expo prebuild --clean
```

---

## 📊 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        TU TELÉFONO                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Delicrunch App (Development Build)             │  │
│  │  ┌────────────────┐  ┌──────────────────────────────┐   │  │
│  │  │  React Native  │  │   @stripe/stripe-react-native │   │  │
│  │  │   (JavaScript) │  │        (Código Nativo)        │   │  │
│  │  └───────┬────────┘  └──────────────────────────────┘   │  │
│  └──────────┼───────────────────────────────────────────────┘  │
└─────────────┼───────────────────────────────────────────────────┘
              │ Metro Bundler (hot reload)
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVIDOR DE DESARROLLO                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │   Expo Dev       │  │    Backend       │  │  PostgreSQL  │  │
│  │   Server         │  │   (Node.js)      │  │   (Docker)   │  │
│  │   Puerto 8081    │  │   Puerto 5001    │  │  Puerto 5432 │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │   Localtunnel   │                          │
│                    │   o Codespaces  │                          │
│                    │   (URL pública) │                          │
│                    └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Cuentas de Prueba

| Tipo | Email | Contraseña |
|------|-------|------------|
| Admin | admindeli@delicrunch.com | Admin1234 |
| Comercio | espiga@demo.com | Admin1234 |
| Comprador | comprador@delicrunch.com | Comprador123 |

---

## 📅 Flujo de Trabajo Diario

1. **Iniciar el entorno:**
   ```bash
   ./start-expo-dev-build.sh
   ```

2. **Abrir la app en tu teléfono** (la que instalaste, NO Expo Go)

3. **Desarrollar:** Los cambios se reflejan automáticamente (hot reload)

4. **Detener:** `Ctrl+C` en la terminal

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs: `tail -f backend.log`
2. Limpia caché: `./start-expo-dev-build.sh --clean`
3. Revisa la documentación en `EXPO_DEVELOPMENT_BUILD_GUIDE.md`
