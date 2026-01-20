#!/bin/bash
# Helper script para conectar dispositivo móvil a Expo Dev Server

echo "📱 Guía de Conexión - Expo Development Build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Detectar si estamos en Codespaces
if [ -n "$CODESPACE_NAME" ]; then
  EXPO_URL="https://${CODESPACE_NAME}-8081.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
  
  echo "✅ Estás en GitHub Codespaces"
  echo ""
  echo "📍 URL del Expo Dev Server:"
  echo "   $EXPO_URL"
  echo ""
  echo "🔧 PASOS PARA CONECTAR TU DISPOSITIVO:"
  echo ""
  echo "1️⃣  Configurar Puerto Público:"
  echo "   - Ve a la pestaña 'PORTS' en VS Code (abajo)"
  echo "   - Busca el puerto 8081"
  echo "   - Click derecho → Port Visibility → Public"
  echo ""
  echo "2️⃣  Conectar desde tu Development Build:"
  echo "   - Abre la app Delicrunch (instalada con EAS)"
  echo "   - Ingresa manualmente la URL:"
  echo "     exp://${CODESPACE_NAME}-8081.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
  echo ""
  echo "   O escanea este QR (genera uno en: https://qr.io)"
  echo "   con el texto: exp://${CODESPACE_NAME}-8081.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
  echo ""
  
  # Intentar generar QR en terminal
  if command -v qrencode &> /dev/null; then
    echo "📱 QR Code:"
    qrencode -t ANSIUTF8 "exp://${CODESPACE_NAME}-8081.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
  else
    echo "💡 Para generar QR en terminal, instala: sudo apt install qrencode"
  fi
  
else
  # Modo local
  IP=$(hostname -I | awk '{print $1}')
  echo "✅ Modo Local"
  echo ""
  echo "📍 URL del Expo Dev Server:"
  echo "   exp://$IP:8081"
  echo ""
  echo "🔧 PASOS PARA CONECTAR TU DISPOSITIVO:"
  echo ""
  echo "1️⃣  Asegúrate de estar en la misma red WiFi"
  echo "2️⃣  Abre la app Delicrunch (Development Build)"
  echo "3️⃣  Ingresa manualmente: exp://$IP:8081"
  echo ""
  
  if command -v qrencode &> /dev/null; then
    echo "📱 QR Code:"
    qrencode -t ANSIUTF8 "exp://$IP:8081"
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔍 Verificar estado del servidor:"
echo "   curl http://localhost:8081/status"
echo ""
echo "📋 Ver logs de Expo:"
echo "   tail -f frontend.log"
echo ""
echo "🛑 Detener Expo:"
echo "   pkill -f 'expo start'"
echo ""
