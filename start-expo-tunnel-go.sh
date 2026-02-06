#!/bin/bash

# 🚀 Start Delicrunch - Expo Tunnel + Clean caches
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

cd /workspaces/Delicrunch

echo -e "${CYAN}Iniciando limpieza y arranque en modo túnel...${NC}\n"

# 1) Detener procesos anteriores
echo -e "${BLUE}[1/6]${NC} Deteniendo procesos Expo/Metro..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 1
echo -e "   ${GREEN}✓ Procesos detenidos${NC}\n"

# 2) Limpiar caches
echo -e "${BLUE}[2/6]${NC} Limpiando caches (.expo, .metro-cache, node_modules/.cache)..."
cd Frontend
rm -rf .expo .expo-shared .expo-credentials node_modules/.cache .metro-cache 2>/dev/null || true
echo -e "   ${GREEN}✓ Caches limpiados${NC}\n"

# 3) Asegurar backend y postgres
echo -e "${BLUE}[3/6]${NC} Verificando PostgreSQL y Backend..."
cd ..
if docker ps --format '{{.Names}}' | grep -q delicrunch-postgres; then
  echo -e "   ${GREEN}✓ PostgreSQL container detected${NC}"
  docker start delicrunch-postgres 2>/dev/null || true
else
  echo -e "   ${YELLOW}⚠ No se detectó contenedor delicrunch-postgres (se omitirá)${NC}"
fi
# Intentar iniciar backend si no está
if pgrep -f "node server.js" > /dev/null; then
  echo -e "   ${GREEN}✓ Backend ya corriendo${NC}\n"
else
  echo -e "   ${YELLOW}⚠ Iniciando backend...${NC}"
  cd Backend
  nohup node server.js > ../backend.log 2>&1 &
  sleep 2
  cd ..
  echo -e "   ${GREEN}✓ Backend iniciado (ver backend.log)${NC}\n"
fi

# 4) Configurar Codespaces y .env
echo -e "${BLUE}[4/6]${NC} Configurando puertos públicos (Codespaces) y EXPO_PUBLIC_API_URL..."
if [ -n "$CODESPACE_NAME" ]; then
  gh codespace ports visibility 5001:public -c $CODESPACE_NAME 2>/dev/null || true
  gh codespace ports visibility 8081:public -c $CODESPACE_NAME 2>/dev/null || true
  gh codespace ports visibility 19000:public -c $CODESPACE_NAME 2>/dev/null || true
  BACKEND_URL="https://${CODESPACE_NAME}-5001.app.github.dev"
else
  BACKEND_URL="http://localhost:5001"
fi
# Actualizar .env del Frontend
cd Frontend
if [ -f .env ]; then
  if grep -q "EXPO_PUBLIC_API_URL" .env; then
    sed -i "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=${BACKEND_URL}/api|g" .env || true
  else
    echo "EXPO_PUBLIC_API_URL=${BACKEND_URL}/api" >> .env
  fi
else
  echo "EXPO_PUBLIC_API_URL=${BACKEND_URL}/api" > .env
fi
cd ..

echo -e "   ${GREEN}✓ EXPO_PUBLIC_API_URL establecido en ${BACKEND_URL}/api${NC}\n"

# 5) Iniciar Expo en modo túnel (background) y guardar logs
echo -e "${BLUE}[5/6]${NC} Iniciando Expo (túnel) en segundo plano..."
cd Frontend
export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
# Iniciar con nohup en background para no bloquear el script
nohup npx expo start --clear --tunnel > ../expo-tunnel.log 2>&1 &
EXPO_PID=$!
sleep 2
cd ..
echo -e "   ${GREEN}✓ Expo iniciado en background (PID: ${EXPO_PID})${NC}"
echo -e "   Logs: /workspaces/Delicrunch/expo-tunnel.log\n"

# 6) Mostrar primeros logs
echo -e "${BLUE}[6/6]${NC} Mostrando últimos 60 líneas de logs (espera unos segundos si la construcción está en curso):\n"
sleep 2
tail -n 60 expo-tunnel.log || true

echo -e "\n${GREEN}Listo. Si Expo muestra 'Using development build', abre una terminal interactiva y ejecuta 'npx expo start --tunnel' para poder presionar 's' y cambiar a Expo Go.\n${NC}"
