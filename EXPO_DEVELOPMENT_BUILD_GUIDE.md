# Guía Completa: Migración de Expo Go a Development Build

## 📋 Resumen de Cambios Realizados

Se ha configurado completamente el proyecto para usar **Expo Development Build** en lugar de Expo Go, necesario para usar el SDK nativo de Stripe.

---

## 🔧 Archivos Modificados

### 1. ✅ `/Frontend/.env` - Variables de Entorno

**ANTES:**
```dotenv
EXPO_PUBLIC_API_URL=https://silver-telegram-7vx44jrgxxqrhrw79-5001.app.github.dev
```

**DESPUÉS:**
```dotenv
EXPO_PUBLIC_API_URL=https://silver-telegram-7vx44jrgxxqrhrw79-5001.app.github.dev

# Stripe Configuration
# Get your keys from: https://dashboard.stripe.com/test/apikeys
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SRRYk8hoiRFdhGtFHnTJRVAPniX7lh6esuxdNc13Xw7GK3njphOGYTQ8An7HJSdcTxjeVMi2tULPp6DqKugVbDT00PMJuLLkJ
```

**✨ Cambios:**
- ✅ Agregada variable `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- ✅ Comentarios con enlace a dashboard de Stripe

---

### 2. ✅ `/Frontend/App.js` - StripeProvider Mejorado

**ANTES:**
```javascript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './navigation/AppNavigator';
// ... otros imports

export default function App() {
  return (
    <StripeProvider
      publishableKey="pk_test_51SRRYk8hoiRFdhGtFHnTJRVAPniX7lh6esuxdNc13Xw7GK3njphOGYTQ8An7HJSdcTxjeVMi2tULPp6DqKugVbDT00PMJuLLkJ"
    >
      {/* ... resto del código */}
    </StripeProvider>
  );
}
```

**DESPUÉS:**
```javascript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

import AppNavigator from './navigation/AppNavigator';
// ... otros imports

// Obtener Stripe publishable key desde variables de entorno
const STRIPE_PUBLISHABLE_KEY = 
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  Constants.expoConfig?.extra?.stripePublishableKey ||
  '';

if (!STRIPE_PUBLISHABLE_KEY) {
  console.warn('⚠️ STRIPE_PUBLISHABLE_KEY no está configurada');
}

export default function App() {
  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.delicrunch.app"
    >
      {/* ... resto del código */}
    </StripeProvider>
  );
}
```

**✨ Cambios:**
- ✅ Importado `Constants` de `expo-constants`
- ✅ Key extraída desde variables de entorno
- ✅ Validación con warning si no está configurada
- ✅ Agregado `merchantIdentifier` para Apple Pay

---

### 3. ✅ `/Frontend/app.config.js` - Configuración Dinámica

**ANTES:**
```javascript
module.exports = ({ config }) => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';
  
  console.log('📱 [app.config.js] API URL:', apiUrl);
  
  return {
    ...config,
    extra: {
      ...(config.extra || {}),
      apiUrl: apiUrl,
      eas: {
        projectId: config.extra?.eas?.projectId,
      },
    },
  };
};
```

**DESPUÉS:**
```javascript
module.exports = ({ config }) => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';
  const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  
  console.log('📱 [app.config.js] API URL:', apiUrl);
  console.log('📱 [app.config.js] Stripe Key:', stripePublishableKey ? '✅ Configurada' : '❌ No configurada');
  
  return {
    ...config,
    extra: {
      ...(config.extra || {}),
      apiUrl: apiUrl,
      stripePublishableKey: stripePublishableKey,
      eas: {
        projectId: config.extra?.eas?.projectId,
      },
    },
  };
};
```

**✨ Cambios:**
- ✅ Agregada carga de `stripePublishableKey`
- ✅ Log para verificar configuración
- ✅ Inyección en `extra` para acceso desde la app

---

### 4. ✅ `/Frontend/package.json` - Scripts y Dependencias

**ANTES:**
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "tunnel": "bash ./scripts/start-expo-tunnel.sh",
    "start:public": "bash ./scripts/start-expo-public.sh",
    "web:clean": "bash ./scripts/start-expo-web.sh"
  },
  "dependencies": {
    "@stripe/stripe-react-native": "0.50.3",
    "expo": "~54.0.30",
    // ... otras dependencias
  }
}
```

**DESPUÉS:**
```json
{
  "scripts": {
    "start": "expo start",
    "start:dev": "expo start --dev-client",
    "android": "expo start --android",
    "android:dev": "expo start --android --dev-client",
    "ios": "expo start --ios",
    "ios:dev": "expo start --ios --dev-client",
    "web": "expo start --web",
    "tunnel": "bash ./scripts/start-expo-tunnel.sh",
    "start:public": "bash ./scripts/start-expo-public.sh",
    "web:clean": "bash ./scripts/start-expo-web.sh",
    "prebuild": "expo prebuild",
    "prebuild:clean": "expo prebuild --clean",
    "build:android": "eas build --platform android --profile development",
    "build:ios": "eas build --platform ios --profile development",
    "build:all": "eas build --platform all --profile development"
  },
  "dependencies": {
    "@stripe/stripe-react-native": "0.50.3",
    "expo": "~54.0.30",
    "expo-dev-client": "~6.0.17",
    // ... otras dependencias
  }
}
```

**✨ Cambios:**
- ✅ Agregado `expo-dev-client` en dependencias
- ✅ Nuevos scripts para development client (`start:dev`, `android:dev`, `ios:dev`)
- ✅ Scripts de prebuild para generar código nativo
- ✅ Scripts de build EAS para compilar apps

---

### 5. ✅ `/Frontend/app.json` - Plugin de Stripe

**YA ESTABA CONFIGURADO ✅:**
```json
{
  "expo": {
    "plugins": [
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": "merchant.com.delicrunch.app",
          "enableGooglePay": true
        }
      ]
    ]
  }
}
```

**✅ Configuración correcta:**
- Plugin de Stripe ya incluido
- merchantIdentifier configurado para Apple Pay
- Google Pay habilitado

---

### 6. ✅ `/Frontend/eas.json` - Configuración EAS Build (NUEVO)

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "buildConfiguration": "Debug"
      }
    },
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
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

---

## 🚀 Paso a Paso: Instalación y Build

### Paso 1: Instalar Dependencias

```bash
cd /workspaces/Delicrunch/Frontend

# Instalar nuevas dependencias
npm install

# O con expo específicamente
npx expo install expo-dev-client
```

**Salida esperada:**
```
✓ Installed expo-dev-client@~6.0.17
```

---

### Paso 2: Instalar EAS CLI (si no está instalado)

```bash
npm install -g eas-cli

# Verificar instalación
eas --version
```

**Salida esperada:**
```
eas-cli/12.x.x
```

---

### Paso 3: Configurar EAS (si es primera vez)

```bash
# Login en Expo
eas login

# Configurar proyecto
eas build:configure
```

**Esto creará/actualizará:**
- `eas.json` (ya lo creamos)
- Registrará el proyecto en tu cuenta Expo

---

### Paso 4: Opción A - Build Local con Prebuild (Más Rápido)

#### Android Local

```bash
# Generar carpetas android/ e ios/ con código nativo
npx expo prebuild --clean

# Abrir Android Studio (si está instalado)
npx expo run:android

# O compilar APK directamente
cd android
./gradlew assembleDebug

# El APK estará en:
# android/app/build/outputs/apk/debug/app-debug.apk
```

**Instalar en dispositivo:**
```bash
# Via USB
adb install android/app/build/outputs/apk/debug/app-debug.apk

# O arrastra el APK al emulador
```

#### iOS Local (solo en macOS)

```bash
# Generar código nativo
npx expo prebuild --clean

# Abrir Xcode
open ios/delicrunchfrontend.xcworkspace

# O compilar desde terminal
cd ios
pod install
cd ..
npx expo run:ios
```

---

### Paso 5: Opción B - Build en la Nube con EAS (Recomendado)

#### Android Build

```bash
# Build de desarrollo (APK instalable)
eas build --platform android --profile development

# O usar el script del package.json
npm run build:android
```

**Proceso:**
1. EAS sube tu código a la nube
2. Compila el APK en servidores de Expo
3. Te da un link para descargar

**Salida esperada:**
```
✔ Build successfully queued
✔ View build details: https://expo.dev/accounts/[tu-cuenta]/projects/delicrunch/builds/[build-id]

Build finished in 5-10 minutes...
✔ APK: https://expo.dev/artifacts/eas/[id].apk
```

**Descargar e instalar:**
```bash
# Descargar APK
wget https://expo.dev/artifacts/eas/[id].apk -O delicrunch-dev.apk

# Instalar en dispositivo
adb install delicrunch-dev.apk
```

#### iOS Build

```bash
# Build de desarrollo
eas build --platform ios --profile development

# O usar el script
npm run build:ios
```

**Nota:** Para iOS necesitas:
- Cuenta de Apple Developer ($99/año)
- Certificados configurados en EAS
- Dispositivo registrado en la cuenta

**Proceso simplificado con EAS:**
```bash
# EAS maneja automáticamente:
# - Certificados
# - Provisioning profiles
# - Registro de dispositivos

eas build --platform ios --profile development
```

---

### Paso 6: Iniciar Development Server

```bash
# Iniciar con dev client
npm run start:dev

# O específicamente para Android/iOS
npm run android:dev
npm run ios:dev
```

**Diferencias con Expo Go:**

| Aspecto | Expo Go | Development Build |
|---------|---------|-------------------|
| QR Code | ✅ Funciona | ❌ No funciona |
| URL | exp:// | delicrunch:// |
| Módulos nativos | ❌ Limitado | ✅ Todos |
| Stripe SDK | ❌ No funciona | ✅ Funciona |
| Tamaño | ~200MB (todo) | ~50MB (solo lo necesario) |

**Conectar al dev server:**
```bash
# Android via ADB
adb reverse tcp:8081 tcp:8081

# iOS via network (automático si estás en la misma red)
```

---

## 🔍 Validación: StripeProvider

### Verificar que Stripe se Inicializa Correctamente

Abre la app y verifica los logs:

```javascript
// En App.js ya agregamos validación
const STRIPE_PUBLISHABLE_KEY = 
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  Constants.expoConfig?.extra?.stripePublishableKey ||
  '';

if (!STRIPE_PUBLISHABLE_KEY) {
  console.warn('⚠️ STRIPE_PUBLISHABLE_KEY no está configurada');
}
```

**Logs esperados:**
```
📱 [app.config.js] API URL: https://...
📱 [app.config.js] Stripe Key: ✅ Configurada
```

**Si ves el warning:**
```
⚠️ STRIPE_PUBLISHABLE_KEY no está configurada
```

**Solución:**
1. Verifica que `.env` tenga la key
2. Reinicia el bundler: `Ctrl+C` y `npm run start:dev`
3. Verifica en `app.config.js` que se está leyendo

---

### Test Manual de Stripe

1. **Abrir PaymentScreen:**
   - Navega a cualquier pantalla que use `useStripe()`
   
2. **Verificar inicialización:**
   ```javascript
   // En PaymentScreen.js
   const { initPaymentSheet, presentPaymentSheet } = useStripe();
   
   console.log('✅ Stripe hook disponible:', !!initPaymentSheet);
   ```

3. **Intentar un pago de prueba:**
   - Usar tarjeta de prueba: `4242 4242 4242 4242`
   - Cualquier fecha futura
   - Cualquier CVC de 3 dígitos

**Si funciona:**
```
✅ Payment sheet se abre
✅ Tarjeta se procesa
✅ Pago se confirma
```

**Si falla en Expo Go:**
```
❌ Error: "@stripe/stripe-react-native" is not available
❌ Necesitas Development Build
```

---

## 📊 Comparación: Antes vs Después

### Expo Go (Antes)

```bash
npm start
# Escanear QR
# ❌ Stripe no funciona
# ❌ Módulos nativos limitados
```

### Development Build (Ahora)

```bash
# 1. Build una vez
npm run build:android  # o eas build

# 2. Instalar APK
adb install delicrunch-dev.apk

# 3. Iniciar dev server
npm run start:dev

# 4. Abrir app en dispositivo
# ✅ Stripe funciona
# ✅ Hot reload funciona
# ✅ Todos los módulos nativos disponibles
```

---

## 🎯 Comandos de Referencia Rápida

```bash
# Instalación inicial
npm install
npx expo install expo-dev-client

# Development
npm run start:dev           # Iniciar dev server
npm run android:dev         # Android + dev client
npm run ios:dev             # iOS + dev client

# Build local
npx expo prebuild --clean   # Generar código nativo
npx expo run:android        # Compilar y ejecutar Android
npx expo run:ios            # Compilar y ejecutar iOS

# Build en la nube (EAS)
npm run build:android       # Build Android en EAS
npm run build:ios           # Build iOS en EAS
npm run build:all           # Build ambas plataformas

# Utilidades
npx expo prebuild --clean   # Regenerar carpetas nativas
eas build:configure         # Configurar EAS
eas login                   # Login en Expo
```

---

## 🐛 Troubleshooting

### Problema: "Stripe is not available"

**Causa:** Usando Expo Go en lugar de Development Build

**Solución:**
```bash
# 1. Build la app con dev client
npm run build:android

# 2. Instalar APK
adb install [archivo].apk

# 3. Iniciar con --dev-client
npm run start:dev
```

---

### Problema: "publishableKey is required"

**Causa:** Variable de entorno no cargada

**Solución:**
```bash
# 1. Verificar .env
cat Frontend/.env

# Debe tener:
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# 2. Reiniciar completamente
Ctrl+C
npm run start:dev
```

---

### Problema: Build falla con "No Android SDK"

**Solución local:**
```bash
# 1. Instalar Android Studio
# 2. Configurar SDK
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# 3. Intentar de nuevo
npx expo run:android
```

**Solución en la nube:**
```bash
# Usar EAS en su lugar (no requiere SDK local)
npm run build:android
```

---

### Problema: iOS requiere certificados

**Solución con EAS:**
```bash
# EAS maneja certificados automáticamente
eas build --platform ios --profile development

# Seguir los prompts para:
# - Crear certificados
# - Registrar dispositivos
# - Configurar provisioning
```

---

## ✅ Checklist Final

Antes de considerar la migración completa:

- [x] ✅ `@stripe/stripe-react-native` instalado (v0.50.3)
- [x] ✅ Plugin agregado en `app.json`
- [x] ✅ `expo-dev-client` agregado a `package.json`
- [x] ✅ `STRIPE_PUBLISHABLE_KEY` en `.env`
- [x] ✅ `App.js` usa variable de entorno
- [x] ✅ `app.config.js` inyecta configuración
- [x] ✅ `eas.json` creado con perfiles
- [x] ✅ Scripts de build agregados a `package.json`
- [ ] 🔄 Build compilado (ejecutar `npm run build:android`)
- [ ] 🔄 APK instalado en dispositivo
- [ ] 🔄 Stripe validado funcionando

---

## 🎓 Recursos Adicionales

- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Stripe React Native](https://stripe.com/docs/payments/accept-a-payment?platform=react-native)
- [Expo + Stripe Guide](https://docs.expo.dev/guides/using-stripe/)

---

## 📝 Notas Importantes

1. **Primera build toma tiempo (10-15 min)**
   - Builds subsecuentes son más rápidas (incrementales)
   
2. **Development Build != Producción**
   - El perfil "development" es solo para desarrollo
   - Para producción usar perfil "production"

3. **Hot Reload sigue funcionando**
   - No necesitas rebuilar por cada cambio de JS
   - Solo rebuild si cambias código nativo o dependencias

4. **APK expira en 30 días**
   - EAS limpia builds antiguas
   - Rebuilar si necesitas reinstalar

---

**Estado actual:** ✅ Configuración completada - Listo para build
**Próximo paso:** Ejecutar `npm run build:android` o `npm run build:ios`
