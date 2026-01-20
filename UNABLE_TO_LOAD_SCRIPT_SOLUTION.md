# SOLUCIÓN: java.lang.RuntimeException: Unable to load script

## ✅ Problema Resuelto

El error "Unable to load script" ocurre cuando tu Development Build no puede conectarse al Metro Bundler. 

### 🔧 Cambios Aplicados:

1. **Metro Config creado** ([Frontend/metro.config.js](Frontend/metro.config.js))
   - Headers CORS configurados
   - Acepta conexiones de cualquier origen
   - Configuración optimizada para Development Builds

2. **Variables de entorno actualizadas** ([Frontend/.env](Frontend/.env))
   - `REACT_NATIVE_PACKAGER_HOSTNAME` configurado con la URL pública de Codespaces
   - Metro ahora usa el hostname correcto

3. **Script de inicio mejorado** ([start-expo-dev-build.sh](start-expo-dev-build.sh))
   - Configura automáticamente el hostname de Metro
   - Exporta `REACT_NATIVE_PACKAGER_HOSTNAME` antes de iniciar Expo

## 📱 Cómo Conectar tu Development Build:

### Método 1: Configuración Manual (MÁS CONFIABLE)

1. **Abre tu app Delicrunch** en el dispositivo (NO Expo Go)

2. **Abre el Dev Menu:**
   - Android: Sacude el dispositivo o presiona `Ctrl+M`
   - iOS: Sacude el dispositivo o presiona `Cmd+D`

3. **Toca "Settings"**

4. **En "Debug server host & port" ingresa:**
   ```
   silver-telegram-7vx44jrgxxqrhrw79-8081.app.github.dev:443
   ```

5. **Regresa al menú y toca "Reload"**

### Método 2: URL del Bundle Directo

Si el método 1 no funciona, ingresa la URL completa del bundle:

1. En el Dev Menu, toca "Enter URL manually"
2. Ingresa:
   ```
   https://silver-telegram-7vx44jrgxxqrhrw79-8081.app.github.dev/index.bundle?platform=android&dev=true&hot=false
   ```

## 🔍 Verificación

Verifica que Metro esté corriendo:
```bash
curl http://localhost:8081/status
```

Deberías ver: `{"packager":"running"}`

## ⚠️ Importante

1. **Puerto 8081 debe ser PÚBLICO**
   - Ve a la pestaña "PORTS" en VS Code
   - Click derecho en puerto 8081 → "Port Visibility" → "Public"

2. **Usa la app Development Build instalada**
   - NO uses Expo Go
   - Debe ser el APK/IPA que generaste con `eas build`

3. **Verifica la conectividad**
   - Tu dispositivo debe tener acceso a Internet
   - Las URLs de Codespaces deben ser accesibles desde tu dispositivo

## 🚀 Iniciar el Sistema

Usa el script actualizado con la nueva configuración:

```bash
./start-expo-dev-build.sh --clean
```

El script ahora:
- ✅ Configura Metro hostname automáticamente
- ✅ Muestra la URL correcta de conexión
- ✅ Genera el QR code en terminal
- ✅ Limpia cachés corruptos

## 📋 Script de Ayuda

Si el error persiste, ejecuta:

```bash
./fix-unable-to-load-script.sh
```

Este script:
- Limpia todos los cachés
- Verifica la configuración
- Muestra instrucciones detalladas de conexión
- Configura el puerto 8081 como público

## 🐛 Troubleshooting

Si aún tienes problemas:

1. **Reinicia completamente el sistema:**
   ```bash
   ./start-expo-dev-build.sh --clean
   ```

2. **Verifica los logs:**
   ```bash
   tail -f frontend.log
   ```

3. **Prueba con la URL del puerto directamente:**
   - Ve a PORTS tab
   - Copia la URL del puerto 8081 (algo como `https://silver-telegram-7vx44jrgxxqrhrw79-8081.app.github.dev`)
   - En tu dispositivo, usa esa URL con el formato: `https://[URL]/index.bundle?platform=android&dev=true`

4. **Verifica la build:**
   - Asegúrate de tener instalado un Development Build válido
   - Si hace tiempo que no actualizas la build, reconstruye:
     ```bash
     cd Frontend
     npx eas build --platform android --profile development
     ```

## ✨ Cambios Técnicos

- **metro.config.js**: Configura CORS y extensiones de archivo
- **.env**: Agrega `REACT_NATIVE_PACKAGER_HOSTNAME`
- **start-expo-dev-build.sh**: Exporta hostname antes de iniciar Metro
- **fix-unable-to-load-script.sh**: Script de diagnóstico y solución

---

**Fecha de solución:** 20 de enero de 2026
**Commit:** fix: Configurar Metro para Development Builds en Codespaces
