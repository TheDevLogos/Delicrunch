╔══════════════════════════════════════════════════════════════════════╗
║  ✅ SOLUCIÓN INTEGRADA: Unable to load script                      ║
╚══════════════════════════════════════════════════════════════════════╝

El error "java.lang.RuntimeException: Unable to load script" ha sido 
COMPLETAMENTE SOLUCIONADO e integrado en el sistema.

═══════════════════════════════════════════════════════════════════════

🎯 EJECUTA ESTE ÚNICO COMANDO:

./fix-and-start-expo.sh

O alternativamente:

./start-expo-dev-build.sh --clean

═══════════════════════════════════════════════════════════════════════

📱 CONECTAR TU DISPOSITIVO:

Cuando el sistema inicie, verás un QR code en la terminal.

OPCIÓN 1 - Escanear QR (MÁS FÁCIL):
   1. Abre "Delicrunch" en tu teléfono (NO Expo Go)
   2. Escanea el QR
   3. ¡Listo!

OPCIÓN 2 - Configuración Manual:
   1. Abre "Delicrunch" en tu teléfono
   2. Sacude para abrir Dev Menu
   3. Toca "Settings"
   4. En "Debug server host" escribe:
      silver-telegram-7vx44jrgxxqrhrw79-8081.app.github.dev:443
   5. Regresa y toca "Reload"

═══════════════════════════════════════════════════════════════════════

🔧 CAMBIOS APLICADOS (PERMANENTES):

✅ Backend/server.js
   - Siempre responde JSON (no HTML)

✅ Backend/middleware/ensureJson.js (NUEVO)
   - Fuerza todas las respuestas a JSON

✅ Frontend/metro.config.js
   - CORS configurado para conexiones remotas

✅ Frontend/.env
   - REACT_NATIVE_PACKAGER_HOSTNAME configurado

✅ Frontend/services/api.js
   - Interceptor detecta respuestas HTML

✅ start-expo-dev-build.sh
   - Configura Metro hostname automáticamente
   - Valida respuestas JSON
   - Detecta problemas antes de conectar

✅ fix-and-start-expo.sh (NUEVO)
   - Script todo-en-uno automático

═══════════════════════════════════════════════════════════════════════

📚 DOCUMENTACIÓN DISPONIBLE:

1. CONEXION_DISPOSITIVO_PASO_A_PASO.txt (ESTE ARCHIVO)
   Guía simple paso a paso

2. UNABLE_TO_LOAD_SCRIPT_SOLUTION.md
   Documentación técnica completa

3. JSON_PARSE_ERROR_SOLUTION.md
   Solución para errores de JSON

4. CONEXION_RAPIDA.txt
   Instrucciones rápidas de referencia

═══════════════════════════════════════════════════════════════════════

🛠️ SCRIPTS DISPONIBLES:

fix-and-start-expo.sh ⭐ (RECOMENDADO)
   Todo-en-uno: configura + limpia + inicia

start-expo-dev-build.sh --clean
   Script principal (ya tiene todas las correcciones)

fix-unable-to-load-script.sh
   Solo diagnóstico (no inicia el sistema)

test-json-response.sh
   Prueba que backend responde JSON

═══════════════════════════════════════════════════════════════════════

🚨 SI AÚN TIENES PROBLEMAS:

1. Verifica que el puerto 8081 es PÚBLICO:
   Ve a pestaña "PORTS" en VS Code
   Click derecho en 8081 → "Port Visibility" → "Public"

2. Verifica que Metro está corriendo:
   curl http://localhost:8081/status
   Debe responder: {"packager":"running"}

3. Verifica conectividad desde tu dispositivo:
   Abre en el navegador de tu teléfono:
   https://silver-telegram-7vx44jrgxxqrhrw79-8081.app.github.dev/status

4. Verifica que tienes Development Build instalado:
   NO debe ser "Expo Go"
   Debe ser el APK de: npx eas build --profile development

5. Ver logs:
   tail -f frontend.log
   tail -f backend.log

6. Reinicio completo:
   pkill node
   ./fix-and-start-expo.sh

═══════════════════════════════════════════════════════════════════════

✨ RESUMEN EJECUTIVO:

ANTES:
❌ "Unable to load script" → App crasheaba
❌ Backend devolvía HTML → Errores de JSON
❌ Puerto 8081 no público → Dispositivo no conectaba
❌ Metro hostname localhost → URLs incorrectas

AHORA:
✅ Metro accesible públicamente
✅ Backend siempre responde JSON
✅ Configuración automática de puertos
✅ Scripts detectan y solucionan problemas
✅ Todo integrado permanentemente

═══════════════════════════════════════════════════════════════════════

🎯 ACCIÓN INMEDIATA:

Ejecuta en la terminal:

./fix-and-start-expo.sh

Espera a ver el QR code, escanéalo con tu app, ¡y listo!

═══════════════════════════════════════════════════════════════════════
