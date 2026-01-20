#!/bin/bash
# fix-unable-to-load-script.sh
# Solución para el error "java.lang.RuntimeException: Unable to load script"

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  🔧 SOLUCIONANDO: Unable to load script                       ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Causas comunes del error:${NC}"
echo "1. Metro Bundler no accesible desde el dispositivo"
echo "2. Puerto 8081 no configurado como público"
echo "3. URL de conexión incorrecta"
echo "4. Caché de Metro corrupto"
echo ""

# Paso 1: Limpiar cachés
echo -e "${BLUE}━━━ PASO 1: Limpiando cachés ━━━${NC}"
cd /workspaces/Delicrunch/Frontend
rm -rf .expo .metro node_modules/.cache /tmp/metro-* /tmp/haste-map-* 2>/dev/null || true
echo -e "${GREEN}✓ Cachés limpiados${NC}"
echo ""

# Paso 2: Verificar puerto 8081
echo -e "${BLUE}━━━ PASO 2: Configurando puerto público ━━━${NC}"
if [ -n "$CODESPACE_NAME" ]; then
  gh codespace ports visibility 8081:public -c "$CODESPACE_NAME" 2>&1 || true
  echo -e "${GREEN}✓ Puerto 8081 configurado como público${NC}"
  
  METRO_URL="https://${CODESPACE_NAME}-8081.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
  echo -e "${BLUE}📡 Metro URL: $METRO_URL${NC}"
else
  echo -e "${YELLOW}⚠ No estás en Codespaces${NC}"
fi
echo ""

# Paso 3: Verificar configuración Metro
echo -e "${BLUE}━━━ PASO 3: Verificando configuración Metro ━━━${NC}"
if [ -f "metro.config.js" ]; then
  echo -e "${GREEN}✓ metro.config.js existe${NC}"
else
  echo -e "${RED}✗ metro.config.js no encontrado${NC}"
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
fi
echo ""

# Paso 4: Actualizar .env
echo -e "${BLUE}━━━ PASO 4: Configurando variables de entorno ━━━${NC}"
if [ -n "$CODESPACE_NAME" ]; then
  METRO_HOSTNAME="${CODESPACE_NAME}-8081.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
  
  if grep -q "REACT_NATIVE_PACKAGER_HOSTNAME" .env; then
    sed -i "s|REACT_NATIVE_PACKAGER_HOSTNAME=.*|REACT_NATIVE_PACKAGER_HOSTNAME=$METRO_HOSTNAME|" .env
  else
    echo "" >> .env
    echo "# Metro Bundler Configuration for Codespaces" >> .env
    echo "REACT_NATIVE_PACKAGER_HOSTNAME=$METRO_HOSTNAME" >> .env
  fi
  
  echo -e "${GREEN}✓ REACT_NATIVE_PACKAGER_HOSTNAME configurado: $METRO_HOSTNAME${NC}"
fi
echo ""

# Paso 5: Reiniciar Metro
echo -e "${BLUE}━━━ PASO 5: Instrucciones de conexión ━━━${NC}"
echo ""
echo -e "${YELLOW}📱 Para conectar tu Development Build:${NC}"
echo ""
echo "1. Presiona 'm' en la terminal de Expo para abrir el menú"
echo "2. Selecciona 'Open Dev Menu on device'"
echo "3. En tu dispositivo, presiona el ícono de configuración"
echo "4. Selecciona 'Enter URL manually'"
echo "5. Ingresa la URL exacta:"
echo ""
if [ -n "$CODESPACE_NAME" ]; then
  BUNDLE_URL="https://${CODESPACE_NAME}-8081.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/index.bundle?platform=android&dev=true&hot=false"
  echo -e "${GREEN}$BUNDLE_URL${NC}"
else
  echo "http://<TU_IP>:8081/index.bundle?platform=android&dev=true&hot=false"
fi
echo ""

echo -e "${YELLOW}📋 Alternativa - Conexión directa:${NC}"
echo "1. En tu dispositivo, abre la app Delicrunch"
echo "2. Sacude el dispositivo para abrir el Dev Menu"
echo "3. Toca 'Settings'"
echo "4. En 'Debug server host' ingresa:"
echo ""
if [ -n "$CODESPACE_NAME" ]; then
  echo -e "${GREEN}${CODESPACE_NAME}-8081.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}:443${NC}"
else
  echo "<TU_IP>:8081"
fi
echo ""

echo "5. Regresa y toca 'Reload'"
echo ""

echo -e "${YELLOW}🔍 Verificar que Metro esté corriendo:${NC}"
echo "curl http://localhost:8081/status"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Configuración completada${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Para iniciar todo el sistema con la nueva configuración:"
echo -e "${BLUE}./start-expo-dev-build.sh --clean${NC}"
echo ""
