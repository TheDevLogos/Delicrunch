#!/bin/bash

# 🚀 Start Delicrunch - Backend + Frontend + PostgreSQL + Mercado Pago
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

BACKEND_PORT=5001
MAX_RETRIES=30

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║       🚀 DELICRUNCH - INICIO COMPLETO                ║"
echo "║   PostgreSQL + Mercado Pago Checkout Pro             ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

if [ ! -d "Backend" ] || [ ! -d "Frontend" ]; then
    echo -e "${RED}❌ Ejecuta desde la raíz del proyecto${NC}"
    exit 1
fi

# ============================================
# DETECTAR CODESPACE Y CONFIGURAR PUERTOS PÚBLICOS
# ============================================
if [ -n "$CODESPACE_NAME" ]; then
    echo -e "\n${BLUE}🌐 Detectado GitHub Codespace...${NC}"
    echo "   Configurando puertos como públicos..."
    
    # Hacer puerto 5001 (Backend) público
    gh codespace ports visibility 5001:public -c $CODESPACE_NAME 2>/dev/null || true
    # Hacer puerto 8081 (Expo) público
    gh codespace ports visibility 8081:public -c $CODESPACE_NAME 2>/dev/null || true
    # Hacer puerto 19000 (Expo Dev Tools) público
    gh codespace ports visibility 19000:public -c $CODESPACE_NAME 2>/dev/null || true
    
    # Construir URL pública del backend
    BACKEND_PUBLIC_URL="https://${CODESPACE_NAME}-5001.app.github.dev"
    
    echo -e "   ${GREEN}✓ Puertos configurados como públicos${NC}"
    echo "   Backend URL pública: $BACKEND_PUBLIC_URL"
else
    BACKEND_PUBLIC_URL="http://localhost:$BACKEND_PORT"
    echo -e "${YELLOW}⚠️  No estamos en Codespace, usando localhost${NC}"
fi

# ============================================
# CLEANUP
# ============================================
cleanup() {
    echo -e "\n${YELLOW}🛑 Deteniendo servicios...${NC}"
    [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null
    lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✅ Servicios detenidos${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

wait_for_backend() {
    local retries=0
    echo -n "   ⏳ Esperando backend"
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -s "http://localhost:$BACKEND_PORT/api/health" > /dev/null 2>&1 || \
           curl -s "http://localhost:$BACKEND_PORT" > /dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        retries=$((retries + 1))
    done
    echo -e " ${RED}✗${NC}"
    return 1
}

# ============================================
# LIMPIAR PUERTOS
# ============================================
echo -e "${BLUE}🔌 Liberando puertos...${NC}"
lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
lsof -ti:19000 | xargs kill -9 2>/dev/null || true
lsof -ti:19001 | xargs kill -9 2>/dev/null || true
echo "   ✓ Puertos liberados"

# ============================================
# LIMPIAR CACHE
# ============================================
echo -e "\n${BLUE}🧹 Limpiando cache...${NC}"

# Backend
rm -rf Backend/node_modules/.cache 2>/dev/null || true
echo "   ✓ Cache del backend limpiado"

# Frontend - Expo cache
rm -rf Frontend/.expo 2>/dev/null || true
rm -rf Frontend/node_modules/.cache 2>/dev/null || true
rm -rf ~/.expo 2>/dev/null || true
echo "   ✓ Cache de Expo limpiado"

# NPM cache (opcional pero ayuda)
npm cache clean --force 2>/dev/null || true
echo "   ✓ Cache de npm limpiado"

# ============================================
# VERIFICAR POSTGRESQL
# ============================================
echo -e "\n${BLUE}🐘 Verificando PostgreSQL...${NC}"

# Leer config
source Backend/.env 2>/dev/null || true

# Intentar conectar
if PGPASSWORD=$DB_PASSWORD psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -d ${DB_DATABASE:-delicrunch} -c "SELECT 1" > /dev/null 2>&1; then
    echo "   ✓ PostgreSQL conectado"
else
    echo -e "${YELLOW}   ⚠️  Intentando con Docker...${NC}"
    
    docker stop delicrunch-postgres 2>/dev/null || true
    docker rm delicrunch-postgres 2>/dev/null || true
    
    docker run -d --name delicrunch-postgres \
        -e POSTGRES_USER=${DB_USER:-postgres} \
        -e POSTGRES_PASSWORD=${DB_PASSWORD:-Qazwsx1234} \
        -e POSTGRES_DB=${DB_DATABASE:-delicrunch} \
        -p ${DB_PORT:-5432}:5432 \
        -v delicrunch-pgdata:/var/lib/postgresql/data \
        postgres:15 > /dev/null 2>&1
    
    echo "   ⏳ Esperando PostgreSQL..."
    sleep 8
    
    if docker ps | grep -q delicrunch-postgres; then
        echo -e "   ${GREEN}✓ PostgreSQL iniciado en Docker${NC}"
    else
        echo -e "${RED}   ❌ No se pudo iniciar PostgreSQL${NC}"
        exit 1
    fi
fi

# ============================================
# CREAR ESQUEMA DE BASE DE DATOS
# ============================================
echo -e "\n${BLUE}📋 Configurando esquema de base de datos...${NC}"

# Crear directorio si no existe
mkdir -p Backend/database

# Ejecutar schema
if [ -f "Backend/database/schema.sql" ]; then
    echo "   Ejecutando schema.sql..."
    PGPASSWORD=$DB_PASSWORD psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -d ${DB_DATABASE:-delicrunch} -f Backend/database/schema.sql > /dev/null 2>&1 || true
    echo "   ✓ Esquema aplicado"
else
    echo "   ⚠️  schema.sql no encontrado, el seed lo creará"
fi

# ============================================
# BACKEND
# ============================================
echo -e "\n${BLUE}📦 Configurando Backend...${NC}"

if [ ! -d "Backend/node_modules" ]; then
    echo "   📥 Instalando dependencias..."
    cd Backend && npm install --legacy-peer-deps && cd ..
fi
echo "   ✓ Dependencias listas"

# Iniciar backend
echo -e "\n${BLUE}🚀 Iniciando Backend...${NC}"
cd Backend
PORT=$BACKEND_PORT npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

if wait_for_backend; then
    echo "   ✓ Backend corriendo en puerto $BACKEND_PORT"
else
    echo -e "${RED}   ❌ Backend no inició. Ver: tail -f backend.log${NC}"
    tail -10 backend.log
    exit 1
fi

# ============================================
# SEED DATA
# ============================================
echo -e "\n${BLUE}🌱 Poblando base de datos...${NC}"
cd Backend
node seed-chihuahua.js 2>&1 | tee ../seed.log
cd ..

# ============================================
# FRONTEND
# ============================================
echo -e "\n${BLUE}📱 Configurando Frontend...${NC}"

# Usar la URL pública si estamos en Codespace, sino usar la del .env o localhost
if [ -n "$BACKEND_PUBLIC_URL" ]; then
    BACKEND_URL="$BACKEND_PUBLIC_URL"
else
    BACKEND_URL=$(grep BACKEND_URL Backend/.env | cut -d '=' -f2)
    if [ -z "$BACKEND_URL" ]; then
        BACKEND_URL="http://localhost:$BACKEND_PORT"
    fi
fi

cat > Frontend/.env << ENVEOF
EXPO_PUBLIC_API_URL=${BACKEND_URL}/api
EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY=$(grep MERCADOPAGO_PUBLIC_KEY Backend/.env | cut -d '=' -f2)
EXPO_PUBLIC_APP_SCHEME=delicrunch
ENVEOF

echo "   ✓ API URL: ${BACKEND_URL}/api"

if [ ! -d "Frontend/node_modules" ]; then
    echo "   📥 Instalando dependencias..."
    cd Frontend && npm install --legacy-peer_deps && cd ..
fi
echo "   ✓ Dependencias listas"

# ============================================
# INICIAR FRONTEND EN MODO TUNNEL
# ============================================
echo -e "\n${BLUE}🌐 Iniciando Frontend en modo TUNNEL...${NC}"
echo -e "${YELLOW}   (Esto permite acceder desde cualquier dispositivo)${NC}"
echo ""

cd Frontend

# Limpiar cache de Expo antes de iniciar
npx expo start --tunnel --clear &
FRONTEND_PID=$!

cd ..

# ============================================
# INFORMACIÓN FINAL
# ============================================
sleep 5
echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          ✅ DELICRUNCH LISTO PARA MERCADO PAGO                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${CYAN}📍 SERVICIOS:${NC}"
echo "   ┌──────────────────────────────────────────────────────────────┐"
if [ -n "$CODESPACE_NAME" ]; then
echo "   │ 🔹 Backend API:  $BACKEND_PUBLIC_URL/api                     │"
echo "   │ 🔹 Modo:         GitHub Codespaces (Puertos Públicos)        │"
echo "   │ 🔹 Frontend:     Escanea el QR con Expo Go                   │"
else
echo "   │ 🔹 Backend API:  http://localhost:$BACKEND_PORT/api              │"
echo "   │ 🔹 Backend URL:  $BACKEND_URL               │"
echo "   │ 🔹 Frontend:     Escanea el QR con Expo Go                   │"
fi
echo "   │ 🔹 PostgreSQL:   localhost:5432                              │"
echo "   └──────────────────────────────────────────────────────────────┘"
echo ""
echo -e "${CYAN}🔐 CREDENCIALES DE PRUEBA:${NC}"
echo "   ┌──────────────────────────────────────────────────────────────┐"
echo "   │ 👨‍💼 ADMIN                                                     │"
echo "   │    Email: admin@delicrunch.com                               │"
echo "   │    Pass:  admin123                                           │"
echo "   ├──────────────────────────────────────────────────────────────┤"
echo "   │ 🏪 COMERCIOS (password: password123)                         │"
echo "   │    comerciotacoselNorteno@test.com                           │"
echo "   │    comerciopizzerialaitailana@test.com                       │"
echo "   │    comerciohamburguesaspremium@test.com                      │"
echo "   │    comerciosushiexpress@test.com                             │"
echo "   │    comerciocafegourmet@test.com                              │"
echo "   │    comerciopostresdelicias@test.com                          │"
echo "   ├──────────────────────────────────────────────────────────────┤"
echo "   │ 👥 COMPRADORES (password: password123)                       │"
echo "   │    compradordelicias@test.com                                │"
echo "   │    compradormeoqui@test.com                                  │"
echo "   │    compradorsaucillo@test.com                                │"
echo "   └──────────────────────────────────────────────────────────────┘"
echo ""
echo -e "${CYAN}💳 MERCADO PAGO - TARJETAS DE PRUEBA:${NC}"
echo "   ┌──────────────────────────────────────────────────────────────┐"
echo "   │ ✅ APROBADA:     5474 9254 3267 0366                         │"
echo "   │ ❌ RECHAZADA:    5474 9254 3267 0374                         │"
echo "   │ ⏳ PENDIENTE:    5474 9254 3267 0382                         │"
echo "   │                                                              │"
echo "   │ CVV: 123  |  Vencimiento: 11/25  |  Nombre: APRO/OTHE        │"
echo "   │ DNI: 12345678                                                │"
echo "   └──────────────────────────────────────────────────────────────┘"
echo ""
echo -e "${CYAN}📋 LOGS:${NC}"
echo "   tail -f backend.log    # Ver logs del backend"
echo "   tail -f seed.log       # Ver logs del seed"
echo ""
echo -e "${YELLOW}🛑 Presiona Ctrl+C para detener todos los servicios${NC}"
echo ""

wait $FRONTEND_PID
