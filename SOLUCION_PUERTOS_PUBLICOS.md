# 🌐 Solución de Conectividad - Puertos Públicos en Codespaces

## ✅ Problema Resuelto

El error `java.net.SocketTimeoutException: Failed to connect` ocurría porque los puertos del backend no estaban configurados como públicos en GitHub Codespaces, impidiendo que tu dispositivo móvil se conectara al servidor.

## 🔧 Soluciones Implementadas

### 1. **Script Automático Mejorado** (`start-delicrunch.sh`)

El script ahora detecta automáticamente si estás en GitHub Codespaces y:

- ✅ Configura los puertos 5001, 8081, 19000 como públicos automáticamente
- ✅ Genera la URL pública del backend: `https://silver-telegram-7vx44jrgxxqrhrw79-5001.app.github.dev`
- ✅ Configura automáticamente el Frontend para usar la URL pública
- ✅ Muestra información clara sobre las URLs públicas disponibles

### 2. **Script Manual** (`configure-public-ports.sh`)

Si necesitas configurar los puertos manualmente:

```bash
./configure-public-ports.sh
```

Este script:
- Hace públicos los puertos necesarios
- Muestra las URLs públicas generadas
- Verifica el estado de todos los puertos

## 🚀 Cómo Usar

### Inicio Normal (Recomendado)

```bash
./start-delicrunch.sh
```

El script detectará automáticamente que estás en Codespaces y configurará todo.

### Si Necesitas Configurar Puertos Manualmente

```bash
# 1. Configurar puertos
./configure-public-ports.sh

# 2. Iniciar servicios
./start-delicrunch.sh
```

## 📱 URLs Importantes

### En GitHub Codespaces:

- **Backend API:** `https://silver-telegram-7vx44jrgxxqrhrw79-5001.app.github.dev/api`
- **Expo Tunnel:** Se genera automáticamente (escanea el QR)

### En Desarrollo Local:

- **Backend API:** `http://localhost:5001/api`
- **Expo:** `http://localhost:8081`

## 🔍 Verificar Configuración

### Ver puertos actuales:

```bash
gh codespace ports -c $CODESPACE_NAME
```

### Hacer un puerto público manualmente:

```bash
gh codespace ports visibility 5001:public -c $CODESPACE_NAME
```

### Hacer un puerto privado:

```bash
gh codespace ports visibility 5001:private -c $CODESPACE_NAME
```

## 📋 Archivo de Configuración

El Frontend usa el archivo `.env` que se genera automáticamente:

```env
EXPO_PUBLIC_API_URL=https://silver-telegram-7vx44jrgxxqrhrw79-5001.app.github.dev/api
EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-375e7726-8315-48ad-9a60-e31973e44ffa
EXPO_PUBLIC_APP_SCHEME=delicrunch
```

## 🎯 Resumen de Cambios

### 1. `start-delicrunch.sh`
- Agregada detección de Codespace
- Configuración automática de puertos públicos
- Generación automática de URL pública
- Actualización del Frontend/.env con URL correcta

### 2. `configure-public-ports.sh` (nuevo)
- Script dedicado para configurar puertos
- Verificación de estado
- Información detallada de URLs

### 3. `Backend/.env`
- Actualizado con URL pública del Codespace

## 🐛 Troubleshooting

### Error: "Port not found"
El puerto solo se puede hacer público cuando el servicio está corriendo. Inicia primero el servicio y luego configura el puerto.

### Error de conexión persiste
1. Verifica que el backend esté corriendo: `curl https://silver-telegram-7vx44jrgxxqrhrw79-5001.app.github.dev/api/health`
2. Verifica que el puerto sea público: `gh codespace ports -c $CODESPACE_NAME`
3. Revisa los logs: `tail -f backend.log`

### La app móvil no se conecta
1. Asegúrate de estar usando Expo Go o un Development Build
2. Escanea el código QR que muestra Expo
3. Verifica que la URL en Frontend/.env sea la correcta

## 📞 Comando Rápido de Diagnóstico

```bash
echo "=== Estado del Sistema ==="
echo "Codespace: $CODESPACE_NAME"
echo "Backend URL: $(grep BACKEND_URL Backend/.env | cut -d '=' -f2)"
echo "Frontend API: $(grep EXPO_PUBLIC_API_URL Frontend/.env | cut -d '=' -f2)"
echo ""
echo "=== Puertos ==="
gh codespace ports -c $CODESPACE_NAME
echo ""
echo "=== Prueba de Conectividad ==="
curl -s https://silver-telegram-7vx44jrgxxqrhrw79-5001.app.github.dev/api/health || echo "❌ Backend no responde"
```

## ✅ Todo Funcionando

Si ves esto, estás listo:
- ✅ Backend corriendo en puerto 5001 (público)
- ✅ Frontend corriendo en modo tunnel
- ✅ URLs públicas configuradas
- ✅ PostgreSQL conectado

**¡Escanea el QR y disfruta! 📱**
