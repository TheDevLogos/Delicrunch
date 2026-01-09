#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)

API_URL=${API_URL:-http://localhost:5001}

echo "Verificando endpoints en $API_URL..."

# Check backend
if curl -sSf "$API_URL/" >/dev/null 2>&1; then
  echo "  ✅ Backend reachable"
else
  echo "  ❌ Backend no responde en $API_URL" >&2
  exit 2
fi

# Check login for test users
check_login() {
  local email=$1
  local pass=$2
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$email\",\"password\":\"$pass\"}" || echo "000")
  echo "$email -> $code"
  return 0
}

check_login "admindeli@delicrunch.com" "Admin1234"
check_login "espiga@demo.com" "Admin1234"
check_login "comprador@delicrunch.com" "Comprador123"

# Check products count
PRODUCTS_JSON=$(curl -s "$API_URL/api/products" || echo "[]")
PRODUCTS_COUNT=$(echo "$PRODUCTS_JSON" | grep -o '"id"' | wc -l | tr -d ' ')

echo "Productos públicos: $PRODUCTS_COUNT"
if [ "$PRODUCTS_COUNT" -lt 8 ]; then
  echo "  ⚠️ Pocos productos detectados ($PRODUCTS_COUNT). Revisa seeds." >&2
  exit 3
fi

echo "Checks completados correctamente"
exit 0
