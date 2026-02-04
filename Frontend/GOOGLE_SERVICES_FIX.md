# Solución: Error google-services.json en EAS Build

## ❌ Problema Original
```
Error: ENOENT: no such file or directory, open '/home/expo/workingdir/build/Frontend/google-services.json'
Error: "google-services.json" is missing, make sure that the file exists. 
Remember that EAS Build only uploads the files tracked by git.
```

## ✅ Solución Implementada

### 1. Archivo google-services.json Creado
Se creó un archivo `google-services.json` placeholder en `/Frontend/google-services.json` con una configuración válida pero genérica que permite que el build funcione.

**Ubicación:** `Frontend/google-services.json`

### 2. Configuración Dinámica en app.config.js
Se actualizó `app.config.js` para:
- Detectar automáticamente si existe `google-services.json`
- Configurar dinámicamente la propiedad `googleServicesFile` en Android
- Mostrar logs informativos durante el build

```javascript
// Verificar si existe google-services.json
const googleServicesPath = path.join(__dirname, 'google-services.json');
const hasGoogleServices = fs.existsSync(googleServicesPath);

// Solo agregar googleServicesFile si el archivo existe
if (hasGoogleServices) {
  androidConfig.googleServicesFile = "./google-services.json";
}
```

### 3. Actualización de app.json
Se removió la referencia estática a `googleServicesFile` de `app.json` ya que ahora se maneja dinámicamente en `app.config.js`.

**Antes:**
```json
"android": {
  "googleServicesFile": "./google-services.json",
  ...
}
```

**Después:**
```json
"android": {
  // Sin googleServicesFile - se configura en app.config.js
  ...
}
```

### 4. Actualización de .gitignore
Se modificó `.gitignore` para **incluir** `google-services.json` en el control de versiones, ya que EAS Build solo sube archivos rastreados por git.

```
# Native
.kotlin/
*.orig.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision
# google-services.json is now tracked for EAS Build
```

## 🧪 Pruebas Realizadas

### ✅ Test 1: Verificar Configuración
```bash
npx expo config --type public
```
**Resultado:** ✅ Google Services: ✅ Encontrado

### ✅ Test 2: Prebuild Android
```bash
npx expo prebuild --clean --platform android
```
**Resultado:** ✅ Finished prebuild (sin errores)

### ✅ Test 3: Archivo Copiado Correctamente
```bash
ls -la android/app/google-services.json
```
**Resultado:** ✅ Archivo presente en ubicación correcta

## 📋 Pasos para EAS Build

### 1. Commit de Cambios
```bash
cd Frontend
git add google-services.json app.config.js app.json .gitignore
git commit -m "fix: add google-services.json for EAS Build"
git push origin main
```

### 2. Ejecutar Build
```bash
cd Frontend
eas build --platform android --profile development
```

## 🔄 Para Usar Firebase Real (Futuro)

Si necesitas usar Firebase en producción:

1. **Obtén el archivo real de Firebase Console:**
   - Ve a Firebase Console → Configuración del proyecto → Tus apps
   - Descarga `google-services.json` para Android

2. **Reemplaza el placeholder:**
   ```bash
   # Reemplazar Frontend/google-services.json con el archivo real
   cp /path/to/real-google-services.json Frontend/google-services.json
   ```

3. **Commit el archivo real:**
   ```bash
   git add Frontend/google-services.json
   git commit -m "chore: update google-services.json with production config"
   git push
   ```

## 📝 Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `Frontend/google-services.json` | ✨ Creado (placeholder) |
| `Frontend/app.config.js` | 🔧 Configuración dinámica de Google Services |
| `Frontend/app.json` | 🗑️ Removido `googleServicesFile` estático |
| `Frontend/.gitignore` | 📝 Permitir rastreo de `google-services.json` |

## ⚠️ Notas Importantes

1. **Git Tracking:** `google-services.json` ahora está rastreado por git (necesario para EAS Build)
2. **Placeholder:** El archivo actual es un placeholder - funciona para builds pero no para features de Firebase
3. **Seguridad:** Si usas Firebase real, considera usar EAS Secrets para datos sensibles
4. **Logs:** Durante el build verás: `📱 [app.config.js] Google Services: ✅ Encontrado`

## 🎯 Estado Final

✅ **google-services.json** presente y rastreado por git  
✅ **app.config.js** configurado dinámicamente  
✅ **Prebuild** funciona sin errores  
✅ **EAS Build** listo para ejecutarse  

## 🚀 Siguiente Paso

Ejecuta tu build:
```bash
cd Frontend
eas build --platform android --profile development
```
