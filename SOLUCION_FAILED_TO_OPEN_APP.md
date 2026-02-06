# Solución: "Failed to open app" en Android

## 🔍 Problema Identificado

El error `java.lang.Exception: Failed to open app` ocurre cuando:
1. Intentas abrir la app con **Expo Go** pero la configuración actual requiere un **Development Build**
2. El mensaje "Using development build" indica que Expo detectó `expo-dev-client` instalado

## ✅ Soluciones Disponibles

### **✨ SOLUCIÓN MÁS RÁPIDA (RECOMENDADA)**

**Ya tienes Expo corriendo!** Solo necesitas cambiar el modo:

1. Ve a la terminal donde está corriendo Expo
2. **Presiona la tecla `s`** 
3. Expo cambiará automáticamente a modo "Expo Go"
4. Aparecerá un nuevo QR code
5. Escanea ese QR con la app **Expo Go** (no con la cámara normal)

```
› Press s │ switch to Expo Go  ← Presiona esta tecla!
```

### **Opción 2: Reiniciar en modo Expo Go desde inicio**

Si prefieres reiniciar Expo:

```bash
cd /workspaces/Delicrunch/Frontend
# Detener Expo actual
pkill -f "expo start"
# Iniciar en modo Expo Go
npx expo start --go
```

### **Opción 2: Construir Development Build**

Si necesitas las dependencias nativas, construye la app:

```bash
# Para Android
npx expo run:android

# O construir con EAS
eas build --profile development --platform android
```

### **Opción 3: Modificar la configuración para Expo Go**

Si tienes plugins que requieren custom native code, puedes:

1. Comentar temporalmente plugins nativos en `app.json`
2. Reiniciar con `npx expo start --clear --go`

## 🚀 Script Automatizado (Ya ejecutado)

Ya ejecuté el script `start-expo-go.sh` y tu app está corriendo. 

**Ahora solo necesitas:**
1. **Presionar `s`** en la terminal de Expo (está esperando tu comando)
2. Esperar a que aparezca el nuevo QR
3. Escanear con Expo Go

El script ya configuró:
- ✅ Backend corriendo en puerto 5001
- ✅ Metro Bundler activo
- ✅ URLs públicas de Codespaces configuradas
- ✅ Cache limpiado

## 📱 Cómo conectar tu dispositivo

1. **Instala Expo Go** desde Play Store (Android) o App Store (iOS)
2. **Abre Expo Go** en tu dispositivo
3. **Escanea el QR** que aparece en la terminal
4. La app se cargará automáticamente

## ⚠️ Limitaciones de Expo Go

Expo Go **NO soporta**:
- Custom native modules
- Algunos plugins de terceros
- Modificaciones al código nativo

Si necesitas estas características, usa un Development Build (Opción 2).

## 🔧 Verificar el modo actual

```bash
# Ver qué modo está usando Expo
ps aux | grep expo
```

Si ves `--dev-client`, está en modo Development Build.
Si ves `--go`, está en modo Expo Go.
