#!/bin/bash

# 🔍 Script de Diagnóstico de Conectividad Delicrunch

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  🔍 DIAGNÓSTICO DE CONECTIVIDAD DELICRUNCH${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo ""

# 1. Verificar variables de entorno
echo -e "${BLUE}📋 1. Variables de Entorno${NC}"
echo -e "   Codespace: ${GREEN}${CODESPACE_NAME:-"No detectado (localhost)"}${NC}"

if [ -f "Backend/.env" ]; then
    BACKEND_URL=$(grep BACKEND_URL Backend/.env | cut -d '=' -f2)
    echo -e "   Backend URL: ${GREEN}${BACKEND_URL}${NC}"
else
    echo -e "   ${RED}❌ Backend/.env no encontrado${NC}"
fi

if [ -f "Frontend/.env" ]; then
    FRONTEND_API=$(grep EXPO_PUBLIC_API_URL Frontend/.env | cut -d '=' -f2)
    echo -e "   Frontend API: ${GREEN}${FRONTEND_API}${NC}"
else
    echo -e "   ${RED}❌ Frontend/.env no encontrado${NC}"
fi

echo ""

# 2. Verificar puertos
echo -e "${BLUE}📡 2. Estado de Puertos${NC}"
if [ -n "$CODESPACE_NAME" ]; then
    gh codespace ports -c $CODESPACE_NAME 2>/dev/null || echo -e "   ${YELLOW}⚠️  No se pudo obtener información de puertos${NC}"
else
    echo -e "   ${YELLOW}⚠️  No estamos en Codespace, verificando localhost...${NC}"
    lsof -iTCP:5001 -sTCP:LISTEN > /dev/null 2>&1 && \
        echo -e "   ${GREEN}✓ Puerto 5001 (Backend) - ACTIVO${NC}" || \
        echo -e "   ${RED}✗ Puerto 5001 (Backend) - INACTIVO${NC}"
    
    lsof -iTCP:8081 -sTCP:LISTEN > /dev/null 2>&1 && \
        echo -e "   ${GREEN}✓ Puerto 8081 (Expo) - ACTIVO${NC}" || \
        echo -e "   ${RED}✗ Puerto 8081 (Expo) - INACTIVO${NC}"
fi

echo ""

# 3. Probar conectividad del Backend
echo -e "${BLUE}🔌 3. Conectividad del Backend${NC}"
if [ -n "$BACKEND_URL" ]; then
    # Probar endpoint de salud
    if curl -s --max-time 5 "${BACKEND_URL}/api/health" > /dev/null 2>&1; then
        echo -e "   ${GREEN}✓ Backend responde correctamente${NC}"
        
        # Obtener versión si existe
        HEALTH_RESPONSE=$(curl -s --max-time 5 "${BACKEND_URL}/api/health")
        echo -e "   Respuesta: ${CYAN}${HEALTH_RESPONSE}${NC}"
    else
        echo -e "   ${RED}✗ Backend no responde${NC}"
        echo -e "   ${YELLOW}   Posibles causas:${NC}"
        echo -e "   ${YELLOW}   - El backend no está corriendo${NC}"
        echo -e "   ${YELLOW}   - El puerto no es público${NC}"
        echo -e "   ${YELLOW}   - La URL es incorrecta${NC}"
    fi
else
    echo -e "   ${RED}✗ No se encontró BACKEND_URL${NC}"
fi

echo ""

# 4. Verificar PostgreSQL
echo -e "${BLUE}🐘 4. Base de Datos PostgreSQL${NC}"
if command -v psql > /dev/null 2>&1; then
    DB_USER=$(grep DB_USER Backend/.env 2>/dev/null | cut -d '=' -f2)
    DB_HOST=$(grep DB_HOST Backend/.env 2>/dev/null | cut -d '=' -f2)
    DB_DATABASE=$(grep DB_DATABASE Backend/.env 2>/dev/null | cut -d '=' -f2)
    DB_PASSWORD=$(grep DB_PASSWORD Backend/.env 2>/dev/null | cut -d '=' -f2)
    
    if PGPASSWORD=$DB_PASSWORD psql -h ${DB_HOST:-localhost} -p 5432 -U ${DB_USER:-postgres} -d ${DB_DATABASE:-delicrunch} -c "SELECT 1" > /dev/null 2>&1; then
        echo -e "   ${GREEN}✓ PostgreSQL conectado${NC}"
        
        # Contar registros
        USER_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h ${DB_HOST:-localhost} -p 5432 -U ${DB_USER:-postgres} -d ${DB_DATABASE:-delicrunch} -t -c "SELECT COUNT(*) FROM usuarios" 2>/dev/null | xargs)
        STORE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h ${DB_HOST:-localhost} -p 5432 -U ${DB_USER:-postgres} -d ${DB_DATABASE:-delicrunch} -t -c "SELECT COUNT(*) FROM vendedores" 2>/dev/null | xargs)
        
        echo -e "   👥 Usuarios: ${CYAN}${USER_COUNT:-0}${NC}"
        echo -e "   🏪 Comercios: ${CYAN}${STORE_COUNT:-0}${NC}"
    else
        echo -e "   ${RED}✗ No se pudo conectar a PostgreSQL${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  psql no disponible${NC}"
fi

echo ""

# 5. Verificar procesos
echo -e "${BLUE}⚙️  5. Procesos Activos${NC}"
if pgrep -f "node.*server.js" > /dev/null; then
    BACKEND_PID=$(pgrep -f "node.*server.js")
    echo -e "   ${GREEN}✓ Backend corriendo (PID: ${BACKEND_PID})${NC}"
else
    echo -e "   ${RED}✗ Backend no está corriendo${NC}"
fi

if pgrep -f "expo start" > /dev/null; then
    FRONTEND_PID=$(pgrep -f "expo start")
    echo -e "   ${GREEN}✓ Frontend corriendo (PID: ${FRONTEND_PID})${NC}"
else
    echo -e "   ${RED}✗ Frontend no está corriendo${NC}"
fi

echo ""

# 6. Resumen y recomendaciones
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  📊 RESUMEN${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"

# Determinar estado general
ALL_OK=true

if [ -z "$BACKEND_URL" ]; then ALL_OK=false; fi
if ! curl -s --max-time 5 "${BACKEND_URL}/api/health" > /dev/null 2>&1; then ALL_OK=false; fi

if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}✅ Todo funcionando correctamente${NC}"
    echo ""
    echo -e "${CYAN}📱 Para conectar tu dispositivo:${NC}"
    echo -e "   1. Asegúrate de tener Expo Go instalado"
    echo -e "   2. Ejecuta: ${GREEN}./start-delicrunch.sh${NC}"
    echo -e "   3. Escanea el código QR con tu dispositivo"
    echo ""
else
    echo -e "${YELLOW}⚠️  Hay problemas de configuración${NC}"
    echo ""
    echo -e "${CYAN}🔧 Soluciones:${NC}"
    echo ""
    echo -e "   ${YELLOW}Si el backend no responde:${NC}"
    echo -e "   ${GREEN}./start-delicrunch.sh${NC}"
    echo ""
    echo -e "   ${YELLOW}Si los puertos no son públicos (Codespaces):${NC}"
    echo -e "   ${GREEN}./configure-public-ports.sh${NC}"
    echo ""
    echo -e "   ${YELLOW}Si hay problemas de base de datos:${NC}"
    echo -e "   ${GREEN}cd Backend && node seed-chihuahua.js${NC}"
    echo ""
fi

echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
