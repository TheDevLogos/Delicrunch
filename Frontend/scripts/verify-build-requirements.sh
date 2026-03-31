#!/bin/bash

# Script de Verificación Pre-Build para EAS Development Build
# Verifica todos los requisitos antes de ejecutar el build

echo "🔍 Verificación de Requisitos para EAS Build"
echo "=============================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# 1. Verificar que estamos en el directorio correcto
echo -n "📁 Verificando directorio... "
if [ -f "package.json" ] && [ -f "app.json" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ No estás en el directorio Frontend${NC}"
    exit 1
fi

# 2. Verificar node_modules
echo -n "📦 Verificando node_modules... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Ejecuta: npm install${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 3. Verificar dependencias críticas
echo "🔧 Verificando dependencias críticas..."

# react-native-reanimated
if npm ls react-native-reanimated 2>&1 | grep -q "react-native-reanimated@"; then
    echo -e "   ${GREEN}✓${NC} react-native-reanimated instalado"
else
    echo -e "   ${RED}✗${NC} react-native-reanimated NO instalado"
    ERRORS=$((ERRORS + 1))
fi

# react-native-worklets
if npm ls react-native-worklets 2>&1 | grep -q "react-native-worklets@"; then
    echo -e "   ${GREEN}✓${NC} react-native-worklets instalado"
else
    echo -e "   ${RED}✗${NC} react-native-worklets NO instalado"
    echo -e "   ${YELLOW}→ Agregado a package.json, ejecuta: npm install${NC}"
    ERRORS=$((ERRORS + 1))
fi

# expo
if npm ls expo 2>&1 | grep -q "expo@"; then
    echo -e "   ${GREEN}✓${NC} expo instalado"
else
    echo -e "   ${RED}✗${NC} expo NO instalado"
    ERRORS=$((ERRORS + 1))
fi

# 4. Verificar archivos de configuración
echo "⚙️  Verificando configuración..."

if [ -f "app.json" ]; then
    echo -e "   ${GREEN}✓${NC} app.json existe"
    
    # Verificar plugin reanimated
    if grep -q "react-native-reanimated/plugin" app.json; then
        echo -e "   ${GREEN}✓${NC} Plugin reanimated en app.json"
    else
        echo -e "   ${RED}✗${NC} Plugin reanimated falta en app.json"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Verificar newArchEnabled
    if grep -q '"newArchEnabled": false' app.json; then
        echo -e "   ${GREEN}✓${NC} newArchEnabled: false configurado"
    else
        echo -e "   ${YELLOW}⚠${NC} newArchEnabled no está en false"
    fi
else
    echo -e "   ${RED}✗${NC} app.json NO existe"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "eas.json" ]; then
    echo -e "   ${GREEN}✓${NC} eas.json existe"
else
    echo -e "   ${RED}✗${NC} eas.json NO existe"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "babel.config.js" ]; then
    echo -e "   ${GREEN}✓${NC} babel.config.js existe"
    
    # Verificar plugins en babel
    if grep -q "react-native-worklets/plugin" babel.config.js; then
        echo -e "   ${GREEN}✓${NC} worklets plugin en babel.config.js"
    else
        echo -e "   ${YELLOW}⚠${NC} worklets plugin NO está en babel.config.js"
    fi
    
    if grep -q "react-native-reanimated/plugin" babel.config.js; then
        echo -e "   ${GREEN}✓${NC} reanimated plugin en babel.config.js"
    else
        echo -e "   ${RED}✗${NC} reanimated plugin NO está en babel.config.js"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "   ${RED}✗${NC} babel.config.js NO existe"
    ERRORS=$((ERRORS + 1))
fi

# 5. Verificar .env
echo "🔐 Verificando variables de entorno..."
if [ -f ".env" ]; then
    echo -e "   ${GREEN}✓${NC} .env existe"
    
    if grep -q "EXPO_PUBLIC_API_URL" .env; then
        api_url=$(grep "EXPO_PUBLIC_API_URL" .env | cut -d '=' -f2)
        echo -e "   ${GREEN}✓${NC} API_URL: $api_url"
    else
        echo -e "   ${YELLOW}⚠${NC} EXPO_PUBLIC_API_URL no definida en .env"
    fi
    
    if grep -q "EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY" .env; then
        echo -e "   ${GREEN}✓${NC} Mercado Pago Key configurada"
    else
        echo -e "   ${YELLOW}⚠${NC} EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY no definida"
    fi
else
    echo -e "   ${YELLOW}⚠${NC} .env NO existe (se usarán valores de eas.json)"
fi

# 6. Verificar EAS CLI
echo "🛠️  Verificando EAS CLI..."
if command -v eas &> /dev/null; then
    eas_version=$(eas --version 2>&1 | grep "eas-cli" | awk '{print $2}')
    echo -e "   ${GREEN}✓${NC} EAS CLI instalado (v$eas_version)"
    
    # Verificar si hay actualización disponible
    if eas --version 2>&1 | grep -q "is now available"; then
        echo -e "   ${YELLOW}⚠${NC} Actualización disponible: npm install -g eas-cli"
    fi
else
    echo -e "   ${RED}✗${NC} EAS CLI NO instalado"
    echo -e "   ${YELLOW}→ Ejecuta: npm install -g eas-cli${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 7. Verificar autenticación EAS
echo "🔑 Verificando autenticación EAS..."
if eas whoami &> /dev/null; then
    eas_user=$(eas whoami 2>&1)
    echo -e "   ${GREEN}✓${NC} Autenticado como: $eas_user"
else
    echo -e "   ${RED}✗${NC} No autenticado en EAS"
    echo -e "   ${YELLOW}→ Ejecuta: eas login${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "=============================================="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ TODOS LOS REQUISITOS CUMPLIDOS${NC}"
    echo ""
    echo "Puedes ejecutar el build:"
    echo "  eas build --platform android --profile development"
    echo ""
    exit 0
else
    echo -e "${RED}❌ ENCONTRADOS $ERRORS ERRORES${NC}"
    echo ""
    echo "Pasos sugeridos:"
    echo "1. npm install"
    echo "2. Corrige los errores mostrados arriba"
    echo "3. Vuelve a ejecutar este script"
    echo ""
    exit 1
fi
