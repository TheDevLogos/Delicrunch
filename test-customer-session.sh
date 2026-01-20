#!/bin/bash

# Script para probar el endpoint de Customer Session

echo "🧪 Probando Endpoint: POST /api/payments/customer-session"
echo "=========================================================="
echo ""

# Configuración
API_URL="http://localhost:5001"
COMPRADOR_EMAIL="comprador@test.com"
COMPRADOR_PASS="password123"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📍 Paso 1: Login como comprador"
echo "--------------------------------------"

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$COMPRADOR_EMAIL\",\"password\":\"$COMPRADOR_PASS\"}")

echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"

# Extraer token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Error: No se pudo obtener el token${NC}"
    echo ""
    echo "Verifica que:"
    echo "  1. El backend esté corriendo en $API_URL"
    echo "  2. Exista un usuario comprador con email: $COMPRADOR_EMAIL"
    echo ""
    echo "Para crear un usuario comprador:"
    echo "  cd /workspaces/Delicrunch/Backend"
    echo "  node db/create-buyer.js"
    exit 1
fi

echo -e "${GREEN}✅ Token obtenido${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

echo "📍 Paso 2: Llamar a customer-session"
echo "--------------------------------------"

SESSION_RESPONSE=$(curl -s -X POST "$API_URL/api/payments/customer-session" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "$SESSION_RESPONSE" | jq '.' 2>/dev/null || echo "$SESSION_RESPONSE"

# Verificar respuesta
CUSTOMER_ID=$(echo "$SESSION_RESPONSE" | jq -r '.customerId' 2>/dev/null)
EPHEMERAL_SECRET=$(echo "$SESSION_RESPONSE" | jq -r '.ephemeralKeySecret' 2>/dev/null)
SETUP_SECRET=$(echo "$SESSION_RESPONSE" | jq -r '.setupIntentClientSecret' 2>/dev/null)

echo ""
if [ "$CUSTOMER_ID" != "null" ] && [ -n "$CUSTOMER_ID" ]; then
    echo -e "${GREEN}✅ Customer Session creada exitosamente${NC}"
    echo ""
    echo "📊 Datos recibidos:"
    echo "  • Customer ID: $CUSTOMER_ID"
    echo "  • Ephemeral Key: ${EPHEMERAL_SECRET:0:30}..."
    echo "  • Setup Intent: ${SETUP_SECRET:0:30}..."
    echo ""
    echo -e "${GREEN}✅ El endpoint está funcionando correctamente${NC}"
    echo ""
    echo "🔍 Verifica en Stripe Dashboard:"
    echo "  https://dashboard.stripe.com/test/customers"
    echo ""
else
    echo -e "${RED}❌ Error en la respuesta${NC}"
    echo ""
    echo "Posibles causas:"
    echo "  1. El usuario no tiene un perfil en la tabla 'profiles'"
    echo "  2. La columna stripe_customer_id no existe"
    echo "  3. STRIPE_SECRET_KEY no está configurada en .env"
    echo ""
    echo "Soluciones:"
    echo "  # 1. Crear perfil si no existe"
    echo "  PGPASSWORD=Qazwsx1234 psql -h localhost -U postgres -d delicrunch -c \\"
    echo "    \"INSERT INTO profiles (user_id, ciudad) "
    echo "     SELECT id, 'Ciudad de México' FROM users "
    echo "     WHERE email = '$COMPRADOR_EMAIL' "
    echo "     ON CONFLICT DO NOTHING;\""
    echo ""
    echo "  # 2. Verificar columna"
    echo "  PGPASSWORD=Qazwsx1234 psql -h localhost -U postgres -d delicrunch -c \\"
    echo "    \"ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);\""
    echo ""
    echo "  # 3. Verificar .env"
    echo "  cat /workspaces/Delicrunch/Backend/.env | grep STRIPE_SECRET_KEY"
fi

echo ""
echo "=========================================================="
echo "Prueba completada"
