#!/bin/bash

# 🚀 Start Expo con Expo Go - Solución para "Failed to open app"
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║       📱 DELICRUNCH - INICIO CON EXPO GO            ║"
echo "║   Solución para: Failed to open app                  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

cd /workspaces/Delicrunch/Frontend

# ============================================
# 1. LIMPIAR PROCESOS ANTERIORES
# ============================================
echo -e "\n${BLUE}[1/5]${NC} Limpiando procesos anteriores..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2
echo -e "   ${GREEN}✓ Procesos anteriores detenidos${NC}"

# ============================================
# 2. LIMPIAR CACHE
# ============================================
echo -e "\n${BLUE}[2/5]${NC} Limpiando cache..."
rm -rf .expo node_modules/.cache .metro-cache 2>/dev/null || true
echo -e "   ${GREEN}✓ Cache limpiado${NC}"

# ============================================
# 3. VERIFICAR BACKEND
# ============================================
echo -e "\n${BLUE}[3/5]${NC} Verificando backend..."
if curl -s http://localhost:5001/health > /dev/null; then
    echo -e "   ${GREEN}✓ Backend está corriendo${NC}"
else
    echo -e "   ${YELLOW}⚠️  Backend no responde, iniciando...${NC}"
    cd ../Backend
    nohup node server.js > ../backend.log 2>&1 &
    sleep 3
    cd ../Frontend
    echo -e "   ${GREEN}✓ Backend iniciado${NC}"
fi

# ============================================
# 4. CONFIGURAR VARIABLES DE ENTORNO
# ============================================
echo -e "\n${BLUE}[4/5]${NC} Configurando entorno..."

if [ -n "$CODESPACE_NAME" ]; then
    echo -e "   ${CYAN}🌐 GitHub Codespace detectado${NC}"
    
    # Configurar puertos públicos
    gh codespace ports visibility 5001:public -c $CODESPACE_NAME 2>/dev/null || true
    gh codespace ports visibility 8081:public -c $CODESPACE_NAME 2>/dev/null || true
    gh codespace ports visibility 19000:public -c $CODESPACE_NAME 2>/dev/null || true
    
    BACKEND_URL="https://${CODESPACE_NAME}-5001.app.github.dev"
    METRO_URL="${CODESPACE_NAME}-8081.app.github.dev"
    
    # Actualizar .env
    if [ -f .env ]; then
        sed -i "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=${BACKEND_URL}/api|g" .env
    else
        echo "EXPO_PUBLIC_API_URL=${BACKEND_URL}/api" > .env
    fi
    
    export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
    export REACT_NATIVE_PACKAGER_HOSTNAME=$METRO_URL
    
    echo -e "   ${GREEN}✓ Puertos públicos: 5001, 8081, 19000${NC}"
    echo -e "   Backend: $BACKEND_URL"
else
    echo -e "   ${CYAN}💻 Modo local detectado${NC}"
    BACKEND_URL="http://localhost:5001"
fi

# ============================================
# 5. INICIAR EXPO EN MODO EXPO GO
# ============================================
echo -e "\n${BLUE}[5/5]${NC} Iniciando Expo en modo Expo Go..."
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ CONFIGURACIÓN LISTA PARA EXPO GO                 ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "📱 ${YELLOW}IMPORTANTE:${NC} Asegúrate de tener Expo Go instalado"
echo ""
echo -e "   1. Descarga Expo Go desde:"
echo -e "      • Android: Google Play Store"
echo -e "      • iOS: App Store"
echo ""
echo -e "   2. Abre Expo Go en tu dispositivo"
echo -e "   3. Escanea el QR code que aparecerá abajo"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""

# Forzar modo Expo Go (sin --dev-client)
# El flag --go no es necesario, simplemente no usar --dev-client
npx expo start --clear

# Si Expo inicia en modo dev-client automáticamente, 
# presiona 's' en la terminal para cambiar a Expo Go
