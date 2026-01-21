#!/usr/bin/env bash
# ============================================================================
# Diagnóstico completo para problemas de conexión Expo Development Build
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}       🔍 DIAGNÓSTICO EXPO DEVELOPMENT BUILD                    ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# 1. Verificar que estamos en Codespaces
if [ -z "$CODESPACE_NAME" ]; then
  echo -e "${RED}✗ No estás en GitHub Codespaces${NC}"
  exit 1
fi

echo -e "${GREEN}✓ GitHub Codespaces detectado${NC}"
CODESPACE_URL="${CODESPACE_NAME}-8081.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
echo -e "  URL: ${CODESPACE_URL}"
echo ""

# 2. Verificar procesos
echo -e "${CYAN}🔍 Verificando procesos...${NC}"
if pgrep -f "expo start" > /dev/null; then
  echo -e "${GREEN}✓ Expo está ejecutándose${NC}"
else
  echo -e "${RED}✗ Expo NO está ejecutándose${NC}"
  echo -e "${YELLOW}  Ejecuta: cd Frontend && npx expo start --dev-client${NC}"
fi

if pgrep -f "node server.js" > /dev/null; then
  echo -e "${GREEN}✓ Backend está ejecutándose${NC}"
else
  echo -e "${YELLOW}⚠ Backend NO está ejecutándose${NC}"
fi
echo ""

# 3. Verificar Metro local
echo -e "${CYAN}🔍 Verificando Metro Bundler (local)...${NC}"
METRO_LOCAL=$(curl -s http://localhost:8081/status 2>/dev/null || echo "ERROR")
if echo "$METRO_LOCAL" | grep -q "running"; then
  echo -e "${GREEN}✓ Metro Bundler responde localmente${NC}"
else
  echo -e "${RED}✗ Metro Bundler NO responde en localhost:8081${NC}"
fi
echo ""

# 4. Verificar acceso público
echo -e "${CYAN}🔍 Verificando acceso público a Metro...${NC}"
PUBLIC_URL="https://${CODESPACE_URL}/status"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PUBLIC_URL" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Puerto 8081 es PÚBLICO (HTTP $HTTP_CODE)${NC}"
elif [ "$HTTP_CODE" = "302" ]; then
  echo -e "${RED}✗ Puerto 8081 NO es público (HTTP $HTTP_CODE - Redirect)${NC}"
  echo -e "${YELLOW}  Solución: Ve a PORTS → 8081 → Port Visibility → Public${NC}"
else
  echo -e "${RED}✗ Puerto 8081 no responde (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# 5. Verificar Backend público
echo -e "${CYAN}🔍 Verificando Backend público...${NC}"
BACKEND_URL="https://${CODESPACE_NAME}-5001.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
BACKEND_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL" 2>/dev/null || echo "000")

if [ "$BACKEND_HTTP" = "200" ]; then
  echo -e "${GREEN}✓ Backend es público (HTTP $BACKEND_HTTP)${NC}"
  echo -e "  URL: $BACKEND_URL"
else
  echo -e "${YELLOW}⚠ Backend respondió HTTP $BACKEND_HTTP${NC}"
fi
echo ""

# 6. Verificar archivo .env
echo -e "${CYAN}🔍 Verificando configuración .env...${NC}"
if [ -f "/workspaces/Delicrunch/Frontend/.env" ]; then
  echo -e "${GREEN}✓ Archivo .env existe${NC}"
  echo -e "${CYAN}  Contenido:${NC}"
  cat /workspaces/Delicrunch/Frontend/.env | grep -v "^#" | grep -v "^$" | sed 's/^/  /'
else
  echo -e "${RED}✗ Archivo .env NO existe${NC}"
fi
echo ""

# 7. Generar URL y QR
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}       📱 CONEXIÓN PARA DEVELOPMENT BUILD                      ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

CONNECTION_URL="exp://${CODESPACE_URL}"
echo -e "${GREEN}🔗 URL de conexión:${NC}"
echo -e "   ${CONNECTION_URL}"
echo ""

if command -v qrencode &> /dev/null; then
  echo -e "${CYAN}📱 Escanea este QR desde tu app Delicrunch:${NC}"
  echo ""
  qrencode -t ANSIUTF8 "$CONNECTION_URL"
  echo ""
else
  echo -e "${YELLOW}💡 Genera un QR en: https://qr.io${NC}"
  echo -e "   Pega esta URL: ${CONNECTION_URL}"
  echo ""
fi

# 8. Instrucciones finales
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}       📋 INSTRUCCIONES                                        ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Todo listo. Sigue estos pasos:${NC}"
  echo ""
  echo -e "  1. Abre la app ${GREEN}Delicrunch${NC} en tu dispositivo (NO Expo Go)"
  echo -e "  2. Escanea el QR de arriba o ingresa manualmente la URL"
  echo -e "  3. Espera a que cargue el bundle de JavaScript"
  echo ""
else
  echo -e "${YELLOW}⚠ Hay problemas con la configuración:${NC}"
  echo ""
  echo -e "${CYAN}PASO 1: Hacer puertos públicos${NC}"
  echo -e "  1. Ve a la pestaña ${GREEN}PORTS${NC} (abajo en VS Code)"
  echo -e "  2. Encuentra el puerto ${GREEN}8081${NC}"
  echo -e "  3. Click derecho → ${GREEN}Port Visibility${NC} → ${GREEN}Public${NC}"
  echo -e "  4. Repite con los puertos ${GREEN}5001${NC} y ${GREEN}8082${NC}"
  echo ""
  echo -e "${CYAN}PASO 2: Reiniciar Expo${NC}"
  echo -e "  cd Frontend && npx expo start --dev-client --clear"
  echo ""
  echo -e "${CYAN}PASO 3: Volver a ejecutar este diagnóstico${NC}"
  echo -e "  ./diagnose-expo-connection.sh"
  echo ""
fi

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
