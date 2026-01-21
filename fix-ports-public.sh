#!/usr/bin/env bash
# ============================================================================
# Script para configurar puertos como públicos en GitHub Codespaces
# ============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🔧 Configurando puertos como públicos en Codespaces...${NC}\n"

if [ -z "$CODESPACE_NAME" ]; then
  echo -e "${YELLOW}⚠ No estás en GitHub Codespaces${NC}"
  exit 1
fi

# Puertos a hacer públicos
PORTS=(5001 8081 8082)

for PORT in "${PORTS[@]}"; do
  echo -e "${CYAN}Configurando puerto $PORT...${NC}"
  gh codespace ports visibility $PORT:public -c "$CODESPACE_NAME" 2>&1 && \
    echo -e "${GREEN}✓ Puerto $PORT configurado como público${NC}" || \
    echo -e "${YELLOW}⚠ No se pudo configurar puerto $PORT (puede que ya esté público)${NC}"
done

echo ""
echo -e "${GREEN}✅ Configuración completada${NC}\n"

# Verificar acceso público
echo -e "${CYAN}🔍 Verificando acceso público a Metro Bundler...${NC}"
EXPO_URL="https://${CODESPACE_NAME}-8081.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/status"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$EXPO_URL")

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Puerto 8081 es accesible públicamente${NC}\n"
  
  # Mostrar URL de conexión
  CONNECTION_URL="exp://${CODESPACE_NAME}-8081.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
  echo -e "${CYAN}📱 URL de conexión para tu Development Build:${NC}"
  echo -e "   ${GREEN}${CONNECTION_URL}${NC}\n"
  
  # Generar QR si qrencode está disponible
  if command -v qrencode &> /dev/null; then
    echo -e "${CYAN}📱 Escanea este QR desde tu app:${NC}\n"
    qrencode -t ANSIUTF8 "$CONNECTION_URL"
    echo ""
  else
    echo -e "${YELLOW}💡 Genera un QR en: https://qr.io${NC}"
    echo -e "   Con esta URL: ${CONNECTION_URL}\n"
  fi
  
else
  echo -e "${YELLOW}⚠ Puerto 8081 respondió con código HTTP: $HTTP_CODE${NC}"
  echo -e "${YELLOW}   Esto puede significar que aún no es público.${NC}"
  echo -e "${YELLOW}   Por favor, configúralo manualmente:${NC}"
  echo -e "   1. Ve a la pestaña PORTS"
  echo -e "   2. Puerto 8081 → Click derecho → Port Visibility → Public\n"
fi
