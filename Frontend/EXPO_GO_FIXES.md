# 🔧 Correcciones para Expo Go - Delicrunch Frontend

## ✅ Problemas Corregidos

### 1. **Dependencias Incompatibles con Expo Go**
- ❌ Removido: `@stripe/react-stripe-js` (solo web)
- ❌ Removido: `@stripe/stripe-js` (solo web)
- ✅ Agregado: `expo-constants` v16.0.2
- ⚠️ Mantenido: `@stripe/stripe-react-native` (funciona en builds nativos)

### 2. **API de Constants Deprecado**
- **Archivo:** `services/api.js`
- **Cambio:** Actualizado de `Constants.manifest` a `Constants.expoConfig`
- **Mejora:** Implementado sistema robusto de detección de URL del backend con múltiples fallbacks

### 3. **Funcionalidad de Pagos**
- **Archivo:** `app/PaymentScreen.js`
- **Cambio:** Agregada detección de Expo Go con mensaje informativo
- **Resultado:** La app no crashea, muestra mensaje claro al usuario

### 4. **Imports Web Removidos**
- Eliminados imports de paquetes web que causaban errores en React Native
- La app ahora es compatible con Expo Go para desarrollo

---

## 📱 Cómo Usar la App Ahora

### En Expo Go (Desarrollo)
```bash
# 1. Instalar dependencias actualizadas
npm install

# 2. Limpiar caché de Expo
npx expo start -c

# 3. Escanear QR con Expo Go
```

**Funcionalidades Disponibles en Expo Go:**
- ✅ Navegación completa
- ✅ Autenticación (Login/Registro)
- ✅ Explorar productos
- ✅ Ver detalles de productos
- ✅ Ver perfil y pedidos
- ✅ Gestión de productos (comercios)
- ⚠️ Pagos (muestra mensaje informativo)

**Funcionalidades que Requieren Build Nativo:**
- ❌ Procesamiento de pagos con Stripe
- ❌ Stripe Onboarding para comercios

---

## 🏗️ Para Funcionalidad Completa (Build Nativo)

### Opción 1: Build de Desarrollo con EAS
```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login en Expo
eas login

# Crear build de desarrollo
eas build --profile development --platform android
# o
eas build --profile development --platform ios
```

### Opción 2: Build Local
```bash
# Para Android
npx expo run:android

# Para iOS (requiere Mac)
npx expo run:ios
```

---

## 🔍 Detalles Técnicos de las Correcciones

### services/api.js
```javascript
// ANTES (Deprecado en Expo SDK 51)
const { manifest } = Constants;
const apiHost = manifest.debuggerHost.split(':').shift();

// DESPUÉS (Compatible con Expo SDK 51+)
const expoConfig = Constants.expoConfig;
if (expoConfig?.hostUri) {
  const host = expoConfig.hostUri.split(':')[0];
  return `http://${host}:5001/api`;
}
```

### app/PaymentScreen.js
```javascript
// Detección de Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Mensaje informativo en lugar de crash
if (isExpoGo) {
  Alert.alert(
    'Funcionalidad No Disponible en Expo Go',
    'Los pagos requieren un build nativo...'
  );
  return;
}
```

---

## 🐛 Solución de Problemas

### Error: "Cannot find module expo-constants"
```bash
npm install expo-constants@~16.0.2
npx expo start -c
```

### Error: "Unable to resolve module @stripe/react-stripe-js"
✅ Ya corregido - estos paquetes fueron removidos

### La app no se conecta al backend
1. Verifica que tu backend esté corriendo en el puerto 5001
2. Revisa la consola de Expo para ver la URL detectada
3. Si usas Android, asegúrate de que el backend sea accesible desde el emulador

### Pagos no funcionan
⚠️ **Esto es esperado en Expo Go**. Los pagos requieren un build nativo.

---

## 📝 Notas Importantes

1. **Expo Go Limitaciones:**
   - Expo Go no puede ejecutar código nativo personalizado
   - Stripe requiere módulos nativos para funcionar completamente
   - Esto es una limitación de Expo Go, no un bug

2. **Desarrollo Recomendado:**
   - Usa Expo Go para desarrollo rápido de UI/UX
   - Crea builds de desarrollo para probar pagos
   - Usa simuladores/emuladores para testing completo

3. **Producción:**
   - Siempre usa builds nativos para producción
   - Configura EAS Build para CI/CD
   - Prueba exhaustivamente en dispositivos reales

---

## 🎯 Próximos Pasos

1. ✅ Instalar dependencias: `npm install`
2. ✅ Limpiar caché: `npx expo start -c`
3. ✅ Probar en Expo Go
4. 🔄 Crear build de desarrollo si necesitas probar pagos
5. 🚀 Configurar EAS para producción

---

## 📞 Soporte

Si encuentras problemas adicionales:
1. Revisa los logs de Expo en la terminal
2. Verifica que todas las dependencias estén instaladas
3. Asegúrate de usar Expo SDK 51
4. Consulta la documentación de Expo: https://docs.expo.dev

---

**Última actualización:** $(date)
**Expo SDK:** 51.0.14
**React Native:** 0.74.2
