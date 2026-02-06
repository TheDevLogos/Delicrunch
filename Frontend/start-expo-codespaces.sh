#!/bin/bash

###############################################################################
# INICIO DE EXPO EN GITHUB CODESPACES
# Configura túnel y puertos públicos para acceso remoto
###############################################################################

echo "🚀 Iniciando Expo en GitHub Codespaces..."
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar que estamos en Codespaces
if [ -z "$CODESPACE_NAME" ]; then
    echo -e "${YELLOW}⚠️  No estamos en GitHub Codespaces${NC}"
    echo "Iniciando Expo en modo normal..."
    npx expo start --clear
    exit 0
fi

echo -e "${GREEN}📍 GitHub Codespace detectado: $CODESPACE_NAME${NC}"
echo ""

# 1. Detener procesos anteriores
echo -e "${BLUE}[1/5]${NC} Limpiando procesos de Expo anteriores..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "node.*metro" 2>/dev/null || true
sleep 2
echo -e "${GREEN}✓${NC} Limpieza completada"
echo ""

# 2. Configurar puertos como públicos
echo -e "${BLUE}[2/5]${NC} Configurando puertos como públicos..."
gh codespace ports visibility 8081:public -c "$CODESPACE_NAME" 2>&1 | grep -v "error" || true
echo -e "${GREEN}✓${NC} Puerto 8081 (Metro) configurado"
echo ""

# 3. Limpiar cache de Expo
echo -e "${BLUE}[3/5]${NC} Limpiando cache de Expo..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
echo -e "${GREEN}✓${NC} Cache limpiado"
echo ""

# 4. Verificar configuración del Backend
echo -e "${BLUE}[4/5]${NC} Verificando configuración..."
BACKEND_URL="https://${CODESPACE_NAME}-5001.app.github.dev"
echo "   Backend URL: $BACKEND_URL/api"

if [ -f .env ]; then
    if grep -q "EXPO_PUBLIC_API_URL" .env; then
        echo -e "${GREEN}✓${NC} Variable EXPO_PUBLIC_API_URL configurada"
    else
        echo "EXPO_PUBLIC_API_URL=${BACKEND_URL}/api" >> .env
        echo -e "${GREEN}✓${NC} Variable EXPO_PUBLIC_API_URL añadida"
    fi
fi
echo ""

# 5. Iniciar Expo con túnel
echo -e "${BLUE}[5/5]${NC} Iniciando Expo Metro Bundler..."
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   INSTRUCCIONES IMPORTANTES:${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "📱 Para conectar tu dispositivo:"
echo ""
echo "   OPCIÓN 1: Usar Expo Go (Recomendado)"
echo "   ────────────────────────────────────────"
echo "   1. Abre Expo Go en tu teléfono"
echo "   2. Escanea el QR code que aparecerá abajo"
echo "   3. Espera a que se cargue la app"
echo ""
echo "   OPCIÓN 2: Usar túnel directo"
echo "   ────────────────────────────────────────"
echo "   1. Copia la URL que empieza con 'exp://'"
echo "   2. Pégala en Expo Go manualmente"
echo ""
echo "   OPCIÓN 3: Si tienes problemas de conexión"
echo "   ────────────────────────────────────────"
echo "   • Asegúrate de estar en la misma red WiFi"
echo "   • O usa el modo 'tunnel' si aparece"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""

# Iniciar Expo con opciones para Codespaces
export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
export REACT_NATIVE_PACKAGER_HOSTNAME=$CODESPACE_NAME-8081.app.github.dev

# Iniciar sin túnel primero (el túnel puede causar errores en Codespaces)
echo -e "${YELLOW}⚠️  Iniciando sin túnel (usa el QR directo de Codespaces)${NC}"
npx expo start --clear
