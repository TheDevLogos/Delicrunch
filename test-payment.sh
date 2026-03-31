#!/bin/bash
API_URL="http://localhost:5001/api"

echo "🔐 1. Iniciando sesión..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testbuyer2@delicrunch.com","password":"Test1234!"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Error en login:"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo "✅ Login exitoso"
echo "Token: ${TOKEN:0:20}..."

echo ""
echo "💳 2. Creando preferencia de pago..."
PREFERENCE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/payments/create-preference" \
  -H "Content-Type: application/json" \
  -H "x-auth-token: $TOKEN" \
  -d '{"productId":11,"cantidad":1,"coupon_discount":0}')

HTTP_CODE=$(echo "$PREFERENCE_RESPONSE" | tail -1)
RESPONSE_BODY=$(echo "$PREFERENCE_RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Preferencia creada exitosamente!"
  echo "$RESPONSE_BODY" | jq '.'
else
  echo "❌ Error al crear preferencia:"
  echo "$RESPONSE_BODY" | jq '.'
fi
