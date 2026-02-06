#!/bin/bash

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="${1:-http://localhost:5001/api}"

echo -e "${BLUE}🧪 Probando API de Delicrunch${NC}"
echo "   URL: $API_URL"
echo "════════════════════════════════════════"

# Test 1: Health check
echo -n "1. Health check........... "
HEALTH=$(curl -s -w "%{http_code}" -o /tmp/health.json "$API_URL/health" 2>/dev/null)
if [ "$HEALTH" == "200" ]; then
    echo -e "${GREEN}✓ OK${NC}"
else
    curl -s "$API_URL" > /dev/null 2>&1 && echo -e "${YELLOW}⚠ Root OK${NC}" || echo -e "${RED}✗ FAIL${NC}"
fi

# Test 2: Obtener productos
echo -n "2. GET /products.......... "
PRODUCTS=$(curl -s -w "%{http_code}" -o /tmp/products.json "$API_URL/products" 2>/dev/null)
if [ "$PRODUCTS" == "200" ]; then
    COUNT=$(cat /tmp/products.json | grep -o '"id"' | wc -l)
    echo -e "${GREEN}✓ OK${NC} ($COUNT productos)"
else
    echo -e "${RED}✗ HTTP $PRODUCTS${NC}"
fi

# Test 3: Obtener categorías
echo -n "3. GET /categories........ "
CATS=$(curl -s -w "%{http_code}" -o /tmp/cats.json "$API_URL/categories" 2>/dev/null)
if [ "$CATS" == "200" ]; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${YELLOW}⚠ HTTP $CATS${NC}"
fi

# Test 4: Login admin
echo -n "4. POST /auth/login....... "
LOGIN=$(curl -s -w "%{http_code}" -o /tmp/login.json -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@delicrunch.com","password":"admin123"}' 2>/dev/null)
if [ "$LOGIN" == "200" ]; then
    TOKEN=$(cat /tmp/login.json | grep -o '"token":"[^"]*"' | head -1)
    if [ -n "$TOKEN" ]; then
        echo -e "${GREEN}✓ OK${NC} (token recibido)"
    else
        echo -e "${YELLOW}⚠ Sin token${NC}"
    fi
else
    echo -e "${RED}✗ HTTP $LOGIN${NC}"
fi

# Test 5: Login comprador
echo -n "5. Login comprador........ "
LOGIN2=$(curl -s -w "%{http_code}" -o /tmp/login2.json -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"compradordelicias@test.com","password":"password123"}' 2>/dev/null)
if [ "$LOGIN2" == "200" ]; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ HTTP $LOGIN2${NC}"
fi

# Test 6: PostgreSQL
echo -n "6. PostgreSQL............. "
if command -v psql &> /dev/null; then
    PGCOUNT=$(PGPASSWORD=Qazwsx1234 psql -h localhost -U postgres -d delicrunch -t -c "SELECT COUNT(*) FROM users" 2>/dev/null | tr -d ' ')
    if [ -n "$PGCOUNT" ] && [ "$PGCOUNT" -gt 0 ]; then
        echo -e "${GREEN}✓ OK${NC} ($PGCOUNT usuarios)"
    else
        echo -e "${YELLOW}⚠ Sin datos${NC}"
    fi
else
    echo -e "${YELLOW}⚠ psql no disponible${NC}"
fi

echo "════════════════════════════════════════"
echo -e "${BLUE}Pruebas completadas${NC}"
