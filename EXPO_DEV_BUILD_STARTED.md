# 🚀 Expo Dev Build Iniciado

## ✅ Estado del Sistema

### Backend
- **URL**: https://delicrunch.onrender.com/api
- **Estado**: ✅ Activo y funcionando
- **Health Check**: Respondiendo correctamente

### Frontend
- **Metro Bundler**: ✅ Puerto 8081 activo
- **Túnel ngrok**: 🔄 Configurando (puede tardar 1-2 minutos)
- **Modo**: Development Build (--dev-client)

## 📱 Cómo Conectar tu Dispositivo

### Opción 1: Usar Expo Go (Recomendado para desarrollo rápido)

1. **Instala Expo Go** en tu dispositivo móvil:
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. **Abre el terminal donde está corriendo** para ver el QR code

3. **Escanea el QR**:
   - iOS: Usa la cámara nativa
   - Android: Abre Expo Go y usa el scanner integrado

### Opción 2: Usar Development Build

Si ya tienes una build de desarrollo instalada:

1. Abre la app **Delicrunch** en tu dispositivo
2. La app debería conectarse automáticamente al túnel
3. O ingresa la URL manualmente cuando esté disponible

## 🔍 Ver el QR Code y URL del Túnel

El QR code debería aparecer en el terminal donde ejecutaste el comando. Si no lo ves:

```bash
# Ver logs en tiempo real
tail -f /tmp/expo-*.log 2>/dev/null || echo "Esperando logs..."
```

O revisa la terminal en VS Code donde está corriendo Expo.

## 📋 Verificar Configuración

### Variables de Entorno:
```bash
cat /workspaces/Delicrunch/Frontend/.env
```

**Configuración actual:**
```
EXPO_PUBLIC_API_URL=https://delicrunch.onrender.com/api
```

### Probar Backend:
```bash
curl https://delicrunch.onrender.com/api/health
```

## 🐛 Troubleshooting

### Si el túnel no se inicia:
1. **Verifica tu conexión**: ngrok requiere internet estable
2. **Reinicia Expo**:
   ```bash
   # Matar proceso actual
   pkill -f "expo start"
   
   # Reiniciar
   /workspaces/Delicrunch/start-expo-dev-build.sh
   ```

### Si no ves el QR code:
1. El terminal puede estar oculto, búscalo en los tabs de VS Code
2. La URL del túnel se mostrará cuando esté lista (formato: `exp://xxx.ngrok.io`)

### Si la app no conecta:
1. Asegúrate de estar en la misma red (si usas LAN)
2. O usa el túnel (puede tardar más pero funciona siempre)
3. Verifica que el backend en Render esté respondiendo

## 📞 URLs Importantes

- **Backend API**: https://delicrunch.onrender.com/api
- **Render Dashboard**: https://dashboard.render.com
- **Metro Bundler**: Corriendo en puerto 8081

## ✅ Siguiente Paso

**Espera 1-2 minutos** a que ngrok establezca el túnel, luego:

1. Busca el QR code en la terminal de VS Code
2. Escanéalo con Expo Go
3. ¡La app debería cargar!

Si pasaron más de 2 minutos y no ves el QR, ejecuta:
```bash
pkill -f "expo start" && /workspaces/Delicrunch/start-expo-dev-build.sh
```

---

**Estado de procesos activos:**
- ✅ Backend en Render: Activo
- ✅ Metro Bundler: Puerto 8081
- 🔄 Túnel ngrok: Configurando...
- ⏳ Esperando conexión desde dispositivo
