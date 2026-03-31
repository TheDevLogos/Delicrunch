#!/bin/bash
API_URL="https://delicrunch.onrender.com/api"

# Probar con diferentes credenciales de comercio
echo "🔐 Intentando login con diferentes usuarios comercio..."

MERCHANTS=(
  "comercio.tacosdonrafa@test.com:Test1234!"
  "comercio.tacosdonrafa@test.com:password123"
  "seller1@test.com:Test1234!"
  "seller1@test.com:password123"
)

TOKEN=""
for CREDS in "${MERCHANTS[@]}"; do
  EMAIL="${CREDS%:*}"
  PASS="${CREDS#*:}"
  
  echo "Probando: $EMAIL"
  LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
  
  TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token // empty')
  
  if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo "✅ Login exitoso con $EMAIL"
    break
  fi
done

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ No se pudo autenticar con ningún usuario comercio"
  exit 1
fi

echo ""
echo "💰 2. Obteniendo balance del comercio..."
curl -s -X GET "${API_URL}/payments/merchant-balance" \
  -H "Content-Type: application/json" \
  -H "x-auth-token: $TOKEN" | jq '.'

echo ""
echo "📊 3. Obteniendo estado del comercio..."
curl -s -X GET "${API_URL}/payments/merchant-status" \
  -H "Content-Type: application/json" \
  -H "x-auth-token: $TOKEN" | jq '.'
