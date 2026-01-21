#!/bin/bash
# fix-and-start-expo.sh - Script todo-en-uno para solucionar "Unable to load script"

set -e

ROOT=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🔧 SOLUCIÓN COMPLETA: Unable to load script                   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PASO 1: CONFIGURAR PUERTOS PÚBLICOS
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${YELLOW}━━━ PASO 1/5: Configurando puertos públicos ━━━${NC}"

if [ -n "$CODESPACE_NAME" ]; then
    echo "Configurando puerto 8081 como público..."
    gh codespace ports visibility 8081:public -c "$CODESPACE_NAME" 2>/dev/null || true
    
    echo "Configurando puerto 5001 como público..."
    gh codespace ports visibility 5001:public -c "$CODESPACE_NAME" 2>/dev/null || true
    
    echo -e "${GREEN}✓ Puertos configurados${NC}"
else
    echo -e "${YELLOW}⚠ No estás en Codespaces, saltando...${NC}"
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PASO 2: LIMPIAR CACHÉS
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${YELLOW}━━━ PASO 2/5: Limpiando cachés corruptos ━━━${NC}"

cd "$ROOT/Frontend"
rm -rf .expo .metro node_modules/.cache 2>/dev/null || true
rm -rf /tmp/metro-* /tmp/haste-map-* 2>/dev/null || true

echo -e "${GREEN}✓ Cachés limpiados${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PASO 3: VERIFICAR Y ACTUALIZAR CONFIGURACIÓN
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${YELLOW}━━━ PASO 3/5: Verificando configuración ━━━${NC}"

# Verificar metro.config.js
if [ ! -f "metro.config.js" ]; then
    echo "Creando metro.config.js..."
    cat > metro.config.js << 'EOF'
// metro.config.js - Configuración de Metro Bundler para Development Builds
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuración para Development Builds con túnel público
module.exports = {
  ...config,
  server: {
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        // Agregar headers CORS para permitir conexiones desde cualquier origen
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        return middleware(req, res, next);
      };
    },
  },
  resolver: {
    ...config.resolver,
    sourceExts: [...config.resolver.sourceExts, 'cjs'],
  },
};
EOF
    echo -e "${GREEN}✓ metro.config.js creado${NC}"
else
    echo -e "${GREEN}✓ metro.config.js existe${NC}"
fi

# Actualizar .env con Metro hostname
if [ -n "$CODESPACE_NAME" ]; then
    METRO_HOSTNAME="${CODESPACE_NAME}-8081.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    
    if grep -q "REACT_NATIVE_PACKAGER_HOSTNAME" .env 2>/dev/null; then
        sed -i "s|REACT_NATIVE_PACKAGER_HOSTNAME=.*|REACT_NATIVE_PACKAGER_HOSTNAME=$METRO_HOSTNAME|" .env
        echo -e "${GREEN}✓ REACT_NATIVE_PACKAGER_HOSTNAME actualizado${NC}"
    else
        echo "" >> .env
        echo "# Metro Bundler Configuration for Codespaces" >> .env
        echo "REACT_NATIVE_PACKAGER_HOSTNAME=$METRO_HOSTNAME" >> .env
        echo -e "${GREEN}✓ REACT_NATIVE_PACKAGER_HOSTNAME agregado${NC}"
    fi
    
    echo -e "${BLUE}📡 Metro URL: https://$METRO_HOSTNAME${NC}"
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PASO 4: INICIAR SISTEMA COMPLETO
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${YELLOW}━━━ PASO 4/5: Iniciando sistema completo ━━━${NC}"
echo ""
echo "Ejecutando start-expo-dev-build.sh --clean..."
echo ""

cd "$ROOT"
exec ./start-expo-dev-build.sh --clean
