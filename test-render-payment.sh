#!/bin/bash
API_URL="https://delicrunch.onrender.com/api"

echo "🔐 1. Login en Render..."
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

echo ""
echo "💳 2. Creando preferencia en Render..."
curl -s -X POST "${API_URL}/payments/create-preference" \
  -H "Content-Type: application/json" \
  -H "x-auth-token: $TOKEN" \
  -d '{"productId":11,"cantidad":1,"coupon_discount":0}' | jq '.'
