#!/bin/bash

# 🚀 Quick Start Delicrunch - Inicio rápido sin schema rebuild
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║       🚀 DELICRUNCH - INICIO RÁPIDO                  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

cd /workspaces/Delicrunch

# ============================================
# 1. VERIFICAR DOCKER/POSTGRESQL
# ============================================
echo -e "\n${BLUE}[1/5]${NC} Verificando PostgreSQL..."
if docker ps | grep -q delicrunch-postgres; then
    echo -e "   ${GREEN}✓ PostgreSQL está corriendo${NC}"
else
    echo -e "   ${YELLOW}⚠ Iniciando PostgreSQL...${NC}"
    docker start delicrunch-postgres 2>/dev/null || docker-compose up -d postgres
    sleep 3
    echo -e "   ${GREEN}✓ PostgreSQL iniciado${NC}"
fi

# ============================================
# 2. VERIFICAR BACKEND
# ============================================
echo -e "\n${BLUE}[2/5]${NC} Verificando Backend..."
if ps aux | grep "node server.js" | grep -q Backend; then
    echo -e "   ${GREEN}✓ Backend está corriendo${NC}"
    BACKEND_PID=$(ps aux | grep "node server.js" | grep Backend | awk '{print $2}' | head -1)
    echo -e "   PID: $BACKEND_PID"
else
    echo -e "   ${YELLOW}⚠ Iniciando Backend...${NC}"
    cd Backend
    nohup node server.js > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    cd ..
    sleep 3
    echo -e "   ${GREEN}✓ Backend iniciado (PID: $BACKEND_PID)${NC}"
fi

# ============================================
# 3. VERIFICAR CONEXIÓN BACKEND
# ============================================
echo -e "\n${BLUE}[3/5]${NC} Probando conexión al backend..."
if curl -s http://localhost:5001/health > /dev/null; then
    echo -e "   ${GREEN}✓ Backend respondiendo correctamente${NC}"
    curl -s http://localhost:5001/health | grep -o '"status":"[^"]*"' || true
else
    echo -e "   ${YELLOW}⚠ Backend no responde aún, esperando...${NC}"
    sleep 3
    if curl -s http://localhost:5001/health > /dev/null; then
        echo -e "   ${GREEN}✓ Backend respondiendo${NC}"
    else
        echo -e "   ${YELLOW}⚠ Backend puede estar iniciando, continúa...${NC}"
    fi
fi

# ============================================
# 4. CONFIGURAR CODESPACE (SI APLICA)
# ============================================
if [ -n "$CODESPACE_NAME" ]; then
    echo -e "\n${BLUE}[4/5]${NC} Configurando Codespace..."
    gh codespace ports visibility 5001:public -c $CODESPACE_NAME 2>/dev/null || true
    gh codespace ports visibility 8081:public -c $CODESPACE_NAME 2>/dev/null || true
    
    BACKEND_URL="https://${CODESPACE_NAME}-5001.app.github.dev"
    echo -e "   ${GREEN}✓ Puertos públicos configurados${NC}"
    echo -e "   Backend URL: $BACKEND_URL"
    
    # Actualizar .env del Frontend
    cd Frontend
    if [ -f .env ]; then
        sed -i "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=${BACKEND_URL}/api|g" .env
    else
        echo "EXPO_PUBLIC_API_URL=${BACKEND_URL}/api" > .env
    fi
    cd ..
else
    echo -e "\n${BLUE}[4/5]${NC} Modo local detectado"
    BACKEND_URL="http://localhost:5001"
fi

# ============================================
# 5. INICIAR EXPO
# ============================================
echo -e "\n${BLUE}[5/5]${NC} Iniciando Expo..."
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ BACKEND LISTO${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo -e "   Local:  http://localhost:5001"
if [ -n "$CODESPACE_NAME" ]; then
    echo -e "   Público: $BACKEND_URL"
fi
echo ""
echo -e "${CYAN}📱 Iniciando Expo Metro Bundler...${NC}"
echo ""

cd Frontend

# Limpiar cache
rm -rf .expo node_modules/.cache 2>/dev/null || true

# Iniciar Expo
if [ -n "$CODESPACE_NAME" ]; then
    export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
    export REACT_NATIVE_PACKAGER_HOSTNAME=${CODESPACE_NAME}-8081.app.github.dev
    npx expo start --clear
else
    npx expo start --clear
fi
