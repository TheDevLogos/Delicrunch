#!/bin/bash

# Script para configurar puertos públicos en GitHub Codespaces

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🌐 Configurando puertos públicos en Codespace...${NC}"

if [ -z "$CODESPACE_NAME" ]; then
    echo -e "${RED}❌ Este script solo funciona en GitHub Codespaces${NC}"
    echo "   Estás ejecutando en modo local."
    exit 1
fi

echo "   Codespace detectado: $CODESPACE_NAME"

# Configurar puertos como públicos
echo -e "\n${BLUE}📡 Haciendo puertos públicos...${NC}"

# Backend
gh codespace ports visibility 5001:public -c $CODESPACE_NAME && \
    echo -e "   ${GREEN}✓ Puerto 5001 (Backend) ahora es público${NC}" || \
    echo -e "   ${RED}✗ Error configurando puerto 5001${NC}"

# Expo Metro Bundler
gh codespace ports visibility 8081:public -c $CODESPACE_NAME && \
    echo -e "   ${GREEN}✓ Puerto 8081 (Expo) ahora es público${NC}" || \
    echo -e "   ${RED}✗ Error configurando puerto 8081${NC}"

# Expo Dev Tools
gh codespace ports visibility 19000:public -c $CODESPACE_NAME && \
    echo -e "   ${GREEN}✓ Puerto 19000 (Expo Dev Tools) ahora es público${NC}" || \
    echo -e "   ${RED}✗ Error configurando puerto 19000${NC}"

# PostgreSQL (opcional, generalmente no necesita ser público)
gh codespace ports visibility 5432:private -c $CODESPACE_NAME 2>/dev/null || true

echo -e "\n${GREEN}✅ Configuración completada${NC}"
echo ""
echo -e "${CYAN}📋 URLs Públicas:${NC}"
echo "   Backend:  https://${CODESPACE_NAME}-5001.app.github.dev"
echo "   Expo:     https://${CODESPACE_NAME}-8081.app.github.dev"
echo ""
echo -e "${YELLOW}💡 Tip: Usa estas URLs en tu aplicación móvil${NC}"
echo ""

# Mostrar estado actual de puertos
echo -e "${BLUE}📊 Estado actual de puertos:${NC}"
gh codespace ports -c $CODESPACE_NAME
