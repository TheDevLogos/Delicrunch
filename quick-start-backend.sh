#!/bin/bash

###############################################################################
# INICIO RÁPIDO - DELICRUNCH
# Script simplificado para iniciar el sistema completo
###############################################################################

echo "🚀 Iniciando Delicrunch (modo rápido)..."
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Detener procesos anteriores
echo -e "${BLUE}[1/3]${NC} Deteniendo procesos anteriores..."
pkill -f "node server.js" 2>/dev/null || true
sleep 1

# 2. Iniciar Backend
echo -e "${BLUE}[2/3]${NC} Iniciando Backend..."
cd /workspaces/Delicrunch/Backend
nohup node server.js > /workspaces/Delicrunch/backend.log 2>&1 &
echo $! > /workspaces/Delicrunch/backend.pid
sleep 3
echo -e "${GREEN}✓${NC} Backend iniciado (PID: $(cat /workspaces/Delicrunch/backend.pid))"

# 3. Configurar túnel (solo en Codespaces)
if [ -n "$CODESPACE_NAME" ]; then
    echo -e "${BLUE}[3/3]${NC} Configurando túnel público..."
    gh codespace ports visibility 5001:public -c "$CODESPACE_NAME" 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Puerto 5001 configurado como público"
    echo ""
    echo "📍 URL del Backend: https://${CODESPACE_NAME}-5001.app.github.dev/api"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ BACKEND INICIADO CORRECTAMENTE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "📝 Comandos útiles:"
echo "  • Ver logs: tail -f /workspaces/Delicrunch/backend.log"
echo "  • Iniciar Expo: cd Frontend && npx expo start --clear"
echo "  • Detener backend: pkill -f 'node server.js'"
echo ""
