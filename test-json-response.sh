#!/bin/bash
# test-json-response.sh - Validar que el backend siempre responde con JSON

set -e

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║  🧪 TEST: Validación de Respuestas JSON                         ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKEND_URL="${1:-http://localhost:5001}"
TESTS_PASSED=0
TESTS_FAILED=0

test_endpoint() {
    local endpoint="$1"
    local description="$2"
    
    echo -n "Probando $description... "
    
    # Hacer la solicitud
    RESPONSE=$(curl -s -H "Accept: application/json" "${BACKEND_URL}${endpoint}" 2>/dev/null)
    CONTENT_TYPE=$(curl -s -I -H "Accept: application/json" "${BACKEND_URL}${endpoint}" 2>/dev/null | grep -i "content-type" | head -1)
    
    # Verificar que no es HTML
    if echo "$RESPONSE" | grep -qi '<!doctype\|<html'; then
        echo -e "${RED}✗ FALLO - Responde con HTML${NC}"
        echo "  Respuesta: $(echo "$RESPONSE" | head -1)"
        ((TESTS_FAILED++))
        return 1
    fi
    
    # Verificar que es JSON válido
    if echo "$RESPONSE" | jq . >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PASA - JSON válido${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FALLO - No es JSON válido${NC}"
        echo "  Respuesta: $(echo "$RESPONSE" | head -1)"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo -e "${YELLOW}Backend URL: ${BACKEND_URL}${NC}"
echo ""

# Verificar que el backend está corriendo
if ! curl -s "${BACKEND_URL}/" >/dev/null 2>&1; then
    echo -e "${RED}✗ Backend no está corriendo en ${BACKEND_URL}${NC}"
    echo ""
    echo "Inicia el backend con:"
    echo "  cd Backend && node server.js"
    echo "o"
    echo "  ./start-expo-dev-build.sh"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PRUEBAS DE ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Probar endpoints
test_endpoint "/" "Ruta raíz"
test_endpoint "/health" "Health check"
test_endpoint "/api/products" "Lista de productos"
test_endpoint "/notfound" "Ruta no existente (404)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  RESULTADOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}Pruebas exitosas: ${TESTS_PASSED}${NC}"
echo -e "${RED}Pruebas fallidas: ${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ TODAS LAS PRUEBAS PASARON                                    ║${NC}"
    echo -e "${GREEN}║  El backend responde correctamente con JSON                      ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ ALGUNAS PRUEBAS FALLARON                                     ║${NC}"
    echo -e "${RED}║  Revisa el código del backend                                    ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
