#!/bin/bash

# Script de Testing de Endpoints del Backend Delicrunch
# Verifica que todos los endpoints críticos estén funcionando

BACKEND_URL="https://delicrunch.onrender.com"
API_URL="${BACKEND_URL}/api"

echo "🧪 Testing Endpoints de Delicrunch Backend"
echo "================================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para testing
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local data=$4
    
    echo -n "Testing ${name}... "
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "${url}" \
            -H "Content-Type: application/json" \
            -d "${data}")
    else
        response=$(curl -s -w "\n%{http_code}" "${url}")
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✅ OK${NC} (HTTP $http_code)"
        echo "   Response: $(echo $body | head -c 100)..."
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $http_code)"
        echo "   Response: $body"
    fi
    echo ""
}

# Test 1: Root endpoint
test_endpoint "Root (/)" "${BACKEND_URL}/"

# Test 2: Health Check
test_endpoint "Health Check" "${BACKEND_URL}/health"

# Test 3: API Health
test_endpoint "API Health" "${API_URL}/health"

# Test 4: Stores (Nuevo endpoint)
test_endpoint "GET /api/stores" "${API_URL}/stores"

# Test 5: Stores with products
test_endpoint "GET /api/stores/with-products" "${API_URL}/stores/with-products"

# Test 6: Specific Store (obtener ID dinámicamente)
echo -n "Obteniendo ID de primer store... "
stores_response=$(curl -s "${API_URL}/stores")
first_store_id=$(echo "$stores_response" | grep -o '"id":"[0-9]*"' | head -1 | grep -o '[0-9]*')

if [ -n "$first_store_id" ]; then
    echo -e "${GREEN}ID: $first_store_id${NC}"
    test_endpoint "GET /api/stores/${first_store_id}" "${API_URL}/stores/${first_store_id}"
else
    echo -e "${RED}No se pudo obtener ID${NC}"
    echo ""
fi

# Test 7: Products
test_endpoint "GET /api/products" "${API_URL}/products"

# Test 8: Login (POST)
echo "Testing POST /api/auth/login..."
login_data='{"email":"comercio@delicrunch.com","password":"Password123"}'
test_endpoint "Login (Taquería)" "${API_URL}/auth/login" "POST" "$login_data"

# Test 9: Customer Login
echo "Testing POST /api/auth/login (Comprador)..."
customer_data='{"email":"cliente@delicrunch.com","password":"Password123"}'
test_endpoint "Login (Cliente)" "${API_URL}/auth/login" "POST" "$customer_data"

echo "================================================"
echo "🏁 Testing completado"
echo ""
echo "📊 Resumen:"
echo "   - Si todos los tests muestran ✅, el backend está listo para EAS Build"
echo "   - Si alguno falla ❌, revisa los logs del backend en Render"
echo ""
echo "📱 Siguiente paso: Ejecutar EAS Build"
echo "   cd Frontend && eas build --profile development --platform android"
