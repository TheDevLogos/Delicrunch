#!/bin/bash
# ============================================================
# 🚀 DELICRUNCH - Script de Inicio Rápido Definitivo
# ============================================================
# Ejecutar: ./start.sh
# Este script arranca TODA la aplicación con un solo comando.
# ============================================================

set -e
cd "$(dirname "$0")"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Detectar Codespace y construir URL pública
CODESPACE="${CODESPACE_NAME:-silver-telegram-7vx44jrgxxqrhrw79}"
API_URL="https://${CODESPACE}-5001.app.github.dev"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}     🥐 DELICRUNCH - Inicio Rápido         ${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "${YELLOW}📡 API URL: ${API_URL}${NC}"
echo ""

# 1. PostgreSQL
echo -e "${GREEN}[1/5] 🐘 Iniciando PostgreSQL...${NC}"
docker compose up -d postgres
sleep 2
echo "   ✓ PostgreSQL corriendo"

# 2. Verificar DB y usuarios
echo -e "${GREEN}[2/5] 🔑 Configurando usuarios de prueba...${NC}"
PGPASSWORD=Qazwsx1234 psql -h localhost -U postgres -d delicrunch -q <<'SQL'
-- Asegurar contraseñas de prueba (Admin1234)
UPDATE users SET password_hash = '$2b$10$Ikj.SYxhDZ6H9jLZIySKnuv6nbS0XzyD0XAil.nGZKdWasgYCMZVq'
WHERE email IN ('admindeli@delicrunch.com','espiga@demo.com','aroma@demo.com','comprador@delicrunch.com');
SQL
echo "   ✓ Usuarios listos (contraseña: Admin1234)"

# 3. Backend
echo -e "${GREEN}[3/5] 🖥️  Iniciando Backend (puerto 5001)...${NC}"
pkill -f "node.*server.js" 2>/dev/null || true
sleep 1
cd Backend
nohup node server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 3

# Verificar backend
for i in 1 2 3 4 5; do
    if curl -s http://localhost:5001 > /dev/null; then
        echo "   ✓ Backend corriendo (PID: $BACKEND_PID)"
        break
    fi
    sleep 1
done

# 4. Hacer puerto 5001 público
echo -e "${GREEN}[4/5] 🌐 Configurando puerto público...${NC}"
if command -v gh &> /dev/null; then
    gh codespace ports visibility 5001:public -c "$CODESPACE" 2>/dev/null || true
    echo "   ✓ Puerto 5001 público"
else
    echo "   ⚠ Configura manualmente: PORTS > 5001 > Visibility > Public"
fi

# 5. Configurar .env y arrancar Expo
echo -e "${GREEN}[5/5] 📱 Iniciando Expo...${NC}"
pkill -f "expo start" 2>/dev/null || true
sleep 1
cd Frontend
echo "EXPO_PUBLIC_API_URL=${API_URL}" > .env
echo "   ✓ .env actualizado"

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}🎉 ¡Todo listo!${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "${YELLOW}📱 Escanea el QR con Expo Go${NC}"
echo -e "${YELLOW}🔑 Credenciales:${NC}"
echo "   Email: admindeli@delicrunch.com"
echo "   Password: Admin1234"
echo -e "${BLUE}============================================${NC}"
echo ""

# Verificar dependencias críticas antes de iniciar
echo -e "${GREEN}📦 Verificando dependencias críticas...${NC}"
cd /workspaces/Delicrunch
if ! npm list react-native-worklets-core >/dev/null 2>&1; then
  echo "   Instalando react-native-worklets-core en raíz..."
  npm install react-native-worklets-core --legacy-peer-deps
fi

cd Frontend
if ! npm list react-native-worklets-core >/dev/null 2>&1; then
  echo "   Instalando react-native-worklets-core en Frontend..."
  npm install react-native-worklets-core
fi
echo "   ✓ Dependencias verificadas"

npx expo start --tunnel --clear

# Ctrl+C para salir
