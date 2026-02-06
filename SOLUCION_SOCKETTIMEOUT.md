# 🔧 SOLUCIÓN: SocketTimeoutException en Expo + Codespaces

## 📋 Problema

```
java.net.SocketTimeoutException: Failed to connect to /10.0.3.231 (port 8081) 
from /10.10.0.52 (port 56832)
```

### Causa
Tu dispositivo Android no puede conectarse al servidor Metro de Expo en GitHub Codespaces porque:
1. El puerto 8081 no está configurado como público
2. Expo intenta conectarse por IP local en lugar del túnel de Codespaces
3. El dispositivo está en una red diferente al servidor

## ✅ Solución Implementada

### 1. Script Automático Creado
**Archivo**: `Frontend/start-expo-codespaces.sh`

Este script:
- ✅ Configura puerto 8081 como público automáticamente
- ✅ Limpia procesos y cache de Expo
- ✅ Configura variables de entorno para Codespaces
- ✅ Inicia Expo con modo túnel

### 2. Configuración de Puertos
```bash
Puerto 8081 → Público (Metro Bundler)
Puerto 5001 → Público (Backend API)
```

## 🚀 Cómo Usar

### Opción A: Script Automático (Recomendado)
```bash
cd /workspaces/Delicrunch/Frontend
./start-expo-codespaces.sh
```

### Opción B: Manual
```bash
cd /workspaces/Delicrunch/Frontend

# Limpiar cache
npx expo start --clear --tunnel

# Esperar a que se genere el QR
# Escanear con Expo Go
```

## 📱 Conectar tu Dispositivo

### Método 1: QR Code (Más Fácil)
1. Ejecuta `./start-expo-codespaces.sh`
2. Espera a que aparezca el QR code
3. Abre **Expo Go** en tu teléfono
4. Escanea el QR code
5. Espera a que cargue (puede tardar 30-60 segundos la primera vez)

### Método 2: URL Manual
1. Cuando Expo inicie, copia la URL que empieza con `exp://`
2. Abre Expo Go
3. Ve a "Enter URL manually"
4. Pega la URL
5. Conecta

### Método 3: Túnel Ngrok (Si los anteriores fallan)
Si Expo muestra la opción de túnel:
```bash
# Cuando Expo pregunte, selecciona "tunnel"
# O presiona 's' para cambiar a modo túnel
```

## 🔍 Verificación

### 1. Verificar que los puertos están públicos:
```bash
gh codespace ports -c $CODESPACE_NAME | grep -E "8081|5001"
```

Deberías ver:
```
8081    public    ...
5001    public    ...
```

### 2. Verificar que Backend responde:
```bash
curl -s https://silver-telegram-7vx44jrgxxqrhrw79-5001.app.github.dev/api/health
```

### 3. Verificar variables de entorno:
```bash
cd Frontend
grep EXPO_PUBLIC_API_URL .env
```

## ⚠️ Problemas Comunes

### Problema 1: "Unable to resolve module"
**Solución**:
```bash
cd Frontend
rm -rf node_modules .expo
npm install
npx expo start --clear
```

### Problema 2: "Network request failed"
**Solución**:
- Verifica que el puerto 8081 sea público
- Usa modo túnel: `npx expo start --tunnel`
- Reinicia Expo Go en el dispositivo

### Problema 3: "Could not connect to development server"
**Solución**:
```bash
# Limpiar todo
pkill -f expo
cd Frontend
rm -rf .expo node_modules/.cache
./start-expo-codespaces.sh
```

### Problema 4: QR no aparece
**Solución**:
```bash
# Iniciar con túnel explícito
cd Frontend
npx expo start --clear --tunnel

# Esto creará un túnel ngrok automáticamente
```

## 🎯 Diferencias: Localhost vs Codespaces

### En Localhost (desarrollo normal):
```bash
# Expo se conecta por IP local
npx expo start
# → http://192.168.x.x:8081
```

### En Codespaces (remoto):
```bash
# Expo necesita túnel público
npx expo start --tunnel
# → exp://abc-def-ghi.exp.direct
```

## 📊 Flujo de Conexión Correcto

```
┌─────────────────┐
│  Tu Teléfono    │
│   (Expo Go)     │
└────────┬────────┘
         │ Escanea QR
         │
         ▼
┌─────────────────────────┐
│  Túnel de Expo          │
│  (exp://xxx.exp.direct) │
└────────┬────────────────┘
         │
         ▼
┌──────────────────────────┐
│  GitHub Codespaces       │
│  Puerto 8081 (Público)   │
│  Metro Bundler           │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Tu App React Native     │
│  + Backend API           │
└──────────────────────────┘
```

## 🛠️ Comandos Útiles

```bash
# Ver puertos de Codespaces
gh codespace ports -c $CODESPACE_NAME

# Hacer puerto público manualmente
gh codespace ports visibility 8081:public -c $CODESPACE_NAME

# Ver logs de Metro Bundler
# (los verás en la terminal donde ejecutas Expo)

# Limpiar todo y empezar de nuevo
pkill -f expo
rm -rf Frontend/.expo Frontend/node_modules/.cache
cd Frontend && ./start-expo-codespaces.sh
```

## ✅ Lista de Verificación

Antes de escanear el QR:
- [ ] Backend corriendo en puerto 5001
- [ ] Puerto 5001 es público
- [ ] Puerto 8081 es público
- [ ] Expo iniciado con `--tunnel`
- [ ] QR code visible en terminal
- [ ] Expo Go instalado en el teléfono
- [ ] Teléfono tiene conexión a internet

## 🎉 Resultado Esperado

Después de escanear el QR:
1. Expo Go mostrará "Opening project..."
2. Verás "Downloading JavaScript bundle... X%"
3. La app se cargará en 30-60 segundos
4. Deberías ver la pantalla de login o inicio

## 📝 Notas Importantes

- **Primera carga**: Puede tardar 1-2 minutos
- **Recargas posteriores**: 5-10 segundos
- **Hot Reload**: Activado por defecto
- **Modo túnel**: Puede ser más lento que localhost
- **Red móvil**: Funciona (no necesitas WiFi)

## 🆘 Si Nada Funciona

1. **Reinicia todo**:
```bash
# En Codespaces
pkill -f node
pkill -f expo
./fix-codespaces-tunnel.sh
cd Frontend
./start-expo-codespaces.sh
```

2. **Reinicia Expo Go** en tu teléfono:
   - Cierra completamente la app
   - Borra cache (Configuración de Android)
   - Vuelve a abrir Expo Go

3. **Usa modo development build** (alternativa):
```bash
cd Frontend
npx expo prebuild
npx expo run:android
```

---

**Fecha**: 26 de Enero de 2026  
**Autor**: GitHub Copilot
