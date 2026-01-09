#!/bin/bash

# Script de Validación - Delicrunch System Check
# Verifica que todos los componentes están funcionando correctamente

echo "╔════════════════════════════════════════════╗"
echo "║  DELICRUNCH - SYSTEM VALIDATION CHECK     ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test
test_check() {
    local test_name=$1
    local command=$2
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $test_name"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $test_name"
        ((FAILED++))
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 BACKEND CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_check "Backend running on port 5001" "curl -s http://localhost:5001/api/products > /dev/null"
test_check "PostgreSQL connected" "curl -s http://localhost:5001/api/products | grep -q 'Pack'"
test_check "Products endpoint" "curl -s http://localhost:5001/api/products | jq '.length' | grep -q '[0-9]'"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 AUTHENTICATION CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Detectar API Base URL desde Frontend/.env o fallback
API_ENV_FILE="/workspaces/Delicrunch/Frontend/.env"
if [ -f "$API_ENV_FILE" ]; then
    API_BASE_URL=$(grep -E '^EXPO_PUBLIC_API_URL=' "$API_ENV_FILE" | sed 's/EXPO_PUBLIC_API_URL=//')
else
    API_BASE_URL="http://localhost:5001/api"
fi

echo "Usando API_BASE_URL: $API_BASE_URL"

# Si estamos en Codespaces, intentar hacer público el puerto 5001
if [ -n "$CODESPACE_NAME" ]; then
    echo "Detectado Codespaces: $CODESPACE_NAME"
    if command -v gh >/dev/null 2>&1; then
        echo "Intentando hacer público el puerto 5001..."
        gh codespace ports visibility -c "$CODESPACE_NAME" 5001:public >/dev/null 2>&1 || true
    else
        echo -e "${YELLOW}⚠ gh CLI no disponible; omitiendo cambio de visibilidad${NC}"
    fi
fi

test_check "Login endpoint ($API_BASE_URL)" "curl -s -X POST $API_BASE_URL/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admindeli@delicrunch.com\",\"password\":\"Admin1234\"}' | grep -q 'token'"
# Validar por código de estado 200 (pasa si API pública o local responden)
test_check "Forgot-password endpoint ($API_BASE_URL)" "STATUS_REMOTE=$(curl -s -o /dev/null -w '%{http_code}' -X POST $API_BASE_URL/forgot-password -H 'Content-Type: application/json' -d '{\"email\":\"admindeli@delicrunch.com\"}'); STATUS_LOCAL=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:5001/api/forgot-password -H 'Content-Type: application/json' -d '{\"email\":\"admindeli@delicrunch.com\"}'); [ \"$STATUS_REMOTE\" = \"200\" ] || [ \"$STATUS_LOCAL\" = \"200\" ]"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 FILE STRUCTURE CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_check "DrawerNavigator.js exists" "test -f /workspaces/Delicrunch/Frontend/navigation/DrawerNavigator.js"
test_check "MyOrdersScreen.js exists" "test -f /workspaces/Delicrunch/Frontend/app/MyOrdersScreen.js"
test_check "MyReviewsScreen.js exists" "test -f /workspaces/Delicrunch/Frontend/app/MyReviewsScreen.js"
test_check "FavoritesScreen.js exists" "test -f /workspaces/Delicrunch/Frontend/app/FavoritesScreen.js"
test_check "AuthContext.js exists" "test -f /workspaces/Delicrunch/Frontend/contexts/AuthContext.js"
test_check "API service exists" "test -f /workspaces/Delicrunch/Frontend/services/api.js"
test_check ".env configured" "test -f /workspaces/Delicrunch/Frontend/.env"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 DESIGN SYSTEM CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_check "Theme constants" "grep -q 'COLORS.primary' /workspaces/Delicrunch/Frontend/src/constants/theme.js"
test_check "Neobrutalism colors" "grep -q 'FF5400' /workspaces/Delicrunch/Frontend/src/constants/theme.js"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 DATA CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PRODUCT_COUNT=$(curl -s http://localhost:5001/api/products | jq '.length' 2>/dev/null || echo 0)
if [ "$PRODUCT_COUNT" -ge 16 ]; then
    echo -e "${GREEN}✓${NC} Products in database ($PRODUCT_COUNT)"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Products in database ($PRODUCT_COUNT, expected 16)"
    ((FAILED++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 EXPO FRONTEND CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_check "package.json exists" "test -f /workspaces/Delicrunch/Frontend/package.json"
test_check "node_modules installed" "test -d /workspaces/Delicrunch/Frontend/node_modules"

echo ""
echo "═════════════════════════════════════════════"
echo "RESULTADO FINAL"
echo "═════════════════════════════════════════════"
echo -e "Pasados: ${GREEN}$PASSED${NC}"
echo -e "Fallidos: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ SISTEMA LISTO PARA PRODUCCIÓN${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Revisa los errores anteriores${NC}"
    exit 1
fi
