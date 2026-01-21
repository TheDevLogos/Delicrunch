# 📚 ÍNDICE DE SOLUCIONES - Delicrunch Development Build

Este archivo te ayuda a encontrar la solución correcta para tu problema.

## 🚨 PROBLEMAS COMUNES Y SUS SOLUCIONES

### 1. Error: "Unable to load script"

**Síntoma:** `java.lang.RuntimeException: Unable to load script`

**Solución Rápida:**
```bash
./fix-and-start-expo.sh
```

**Documentación:**
- [README_CONEXION.txt](README_CONEXION.txt) - ⭐ EMPIEZA AQUÍ
- [CONEXION_DISPOSITIVO_PASO_A_PASO.txt](CONEXION_DISPOSITIVO_PASO_A_PASO.txt) - Guía paso a paso
- [UNABLE_TO_LOAD_SCRIPT_SOLUTION.md](UNABLE_TO_LOAD_SCRIPT_SOLUTION.md) - Documentación técnica
- [CONEXION_RAPIDA.txt](CONEXION_RAPIDA.txt) - Referencia rápida

**Scripts:**
- `./fix-and-start-expo.sh` - ⭐ Todo-en-uno (RECOMENDADO)
- `./fix-unable-to-load-script.sh` - Solo diagnóstico

---

### 2. Error: "Value<!doctype cannot be converted to JSONObject"

**Síntoma:** `Value<!doctype of type java.lang.String cannot be converted to JSONObject`

**Causa:** Backend respondía con HTML en lugar de JSON

**Solución:** Ya está PERMANENTEMENTE solucionado en el código

**Documentación:**
- [JSON_PARSE_ERROR_SOLUTION.md](JSON_PARSE_ERROR_SOLUTION.md) - Solución completa
- [SOLUCION_JSON_ERROR.txt](SOLUCION_JSON_ERROR.txt) - Resumen rápido

**Verificación:**
```bash
./test-json-response.sh
```

---

### 3. No puedo conectar mi Development Build

**Documentación:**
- [CONEXION_DISPOSITIVO_PASO_A_PASO.txt](CONEXION_DISPOSITIVO_PASO_A_PASO.txt)
- [GUIA_CONEXION_DISPOSITIVO.txt](GUIA_CONEXION_DISPOSITIVO.txt)

**Pasos:**
1. Ejecuta: `./fix-and-start-expo.sh`
2. Configura puerto 8081 como público (PORTS tab)
3. Escanea el QR o ingresa manualmente:
   ```
   silver-telegram-7vx44jrgxxqrhrw79-8081.app.github.dev:443
   ```

---

### 4. No sé cómo crear el Development Build

**Documentación:**
- [GUIA_EXPO_DEV_BUILD.md](GUIA_EXPO_DEV_BUILD.md)
- [EXPO_DEVELOPMENT_BUILD_GUIDE.md](EXPO_DEVELOPMENT_BUILD_GUIDE.md)

**Comandos:**
```bash
cd Frontend
npx eas login
npx eas build --platform android --profile development
```

---

## 📋 SCRIPTS DISPONIBLES

### Scripts Principales

| Script | Propósito | Cuándo Usar |
|--------|-----------|-------------|
| `fix-and-start-expo.sh` ⭐ | Todo-en-uno: soluciona e inicia | Primera opción siempre |
| `start-expo-dev-build.sh --clean` | Inicio completo del sistema | Uso normal |
| `fix-unable-to-load-script.sh` | Solo diagnóstico | Para verificar config |
| `test-json-response.sh` | Prueba respuestas JSON | Validar backend |

### Scripts de Diagnóstico

| Script | Qué Hace |
|--------|----------|
| `diagnose-expo-connection.sh` | Diagnóstico completo de conexión |
| `fix-ports-public.sh` | Configura puertos como públicos |
| `show-expo-connection.sh` | Muestra URL y QR de conexión |

### Scripts de Validación

| Script | Qué Valida |
|--------|------------|
| `test-co2-system.sh` | Sistema de CO2 |
| `test-json-response.sh` | Respuestas JSON del backend |
| `validate-system.sh` | Sistema completo |

---

## 📖 DOCUMENTACIÓN POR TEMA

### Conexión y Desarrollo

- **README_CONEXION.txt** - ⭐ Guía principal de conexión
- **CONEXION_DISPOSITIVO_PASO_A_PASO.txt** - Tutorial paso a paso
- **CONEXION_RAPIDA.txt** - Referencia rápida
- **GUIA_CONEXION_DISPOSITIVO.txt** - Guía alternativa

### Errores y Soluciones

- **UNABLE_TO_LOAD_SCRIPT_SOLUTION.md** - Error "Unable to load script"
- **JSON_PARSE_ERROR_SOLUTION.md** - Error de parseo JSON
- **SOLUCION_JSON_ERROR.txt** - Resumen de solución JSON

### Desarrollo con Expo

- **GUIA_EXPO_DEV_BUILD.md** - Guía completa de Development Build
- **EXPO_DEVELOPMENT_BUILD_GUIDE.md** - Guía detallada
- **EXPO_SDK_54_UPGRADE.md** - Upgrade a SDK 54
- **EXPO_GO_FIXES.md** - Diferencias con Expo Go

### Funcionalidades del Sistema

- **SISTEMA_COMPRAS_COMPLETO.md** - Sistema de compras
- **SISTEMA_RECOMPENSAS_VALIDADO.md** - Sistema de recompensas
- **PAYMENT_INTEGRATION_COMPLETE.md** - Integración de pagos
- **REVIEWS_SYSTEM.md** - Sistema de reseñas

---

## 🎯 INICIO RÁPIDO (Para nuevos desarrolladores)

### 1. Primera vez configurando el entorno:

```bash
# Ejecuta el script automático
./fix-and-start-expo.sh
```

### 2. Configura tu dispositivo:

1. Ve a pestaña "PORTS" en VS Code
2. Haz público el puerto 8081
3. Escanea el QR que aparece en la terminal

### 3. Si tienes problemas:

Lee: [README_CONEXION.txt](README_CONEXION.txt)

---

## 🆘 AYUDA RÁPIDA

### El sistema no inicia:
```bash
pkill node
./fix-and-start-expo.sh
```

### No aparece el QR:
```bash
./show-expo-connection.sh
```

### Backend responde con HTML:
```bash
./test-json-response.sh
```

### Verificar configuración:
```bash
./fix-unable-to-load-script.sh
```

---

## 📞 CONTACTO Y RECURSOS

### Logs del Sistema
```bash
tail -f frontend.log  # Logs de Expo/Metro
tail -f backend.log   # Logs del backend
```

### URLs Importantes
- Backend: https://silver-telegram-7vx44jrgxxqrhrw79-5001.app.github.dev
- Metro: https://silver-telegram-7vx44jrgxxqrhrw79-8081.app.github.dev

### Cuentas de Prueba
- Admin: admindeli@delicrunch.com / Admin1234
- Comercio: espiga@demo.com / Admin1234
- Comprador: comprador@delicrunch.com / Comprador123

---

## ✨ RESUMEN

**Problema más común:** "Unable to load script"  
**Solución más rápida:** `./fix-and-start-expo.sh`  
**Documento más útil:** [README_CONEXION.txt](README_CONEXION.txt)

---

*Última actualización: 21 de enero de 2026*
