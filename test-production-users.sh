#!/bin/bash
API_URL="https://delicrunch.onrender.com/api"

echo "🔍 VERIFICANDO USUARIOS EN PRODUCCIÓN (RENDER)"
echo "=============================================="
echo ""

# Array de usuarios a probar
declare -A USERS=(
  ["admin"]="admin@delicrunch.com:Test1234!"
  ["buyer"]="testbuyer2@delicrunch.com:Test1234!"
  ["comercio1"]="comercio.tacosdonrafa@test.com:Test1234!"
  ["comercio2"]="seller1@test.com:Test1234!"
  ["buyer2"]="comprador1@test.com:Test1234!"
)

echo "📋 Probando login de usuarios..."
echo ""

for USER_TYPE in "${!USERS[@]}"; do
  CREDS="${USERS[$USER_TYPE]}"
  EMAIL="${CREDS%:*}"
  PASS="${CREDS#*:}"
  
  echo "🔐 Probando: $USER_TYPE ($EMAIL)"
  
  LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
  
  TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token // empty')
  
  if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo "   ✅ Login exitoso"
    
    # Obtener perfil
    PROFILE=$(curl -s -X GET "${API_URL}/profiles/me" \
      -H "x-auth-token: $TOKEN")
    
    ROL=$(echo $PROFILE | jq -r '.rol // empty')
    NOMBRE=$(echo $PROFILE | jq -r '.nombre // empty')
    
    if [ -n "$ROL" ]; then
      echo "   📝 Nombre: $NOMBRE"
      echo "   👤 Rol: $ROL"
    else
      echo "   ⚠️  No se pudo obtener perfil"
    fi
  else
    echo "   ❌ Login falló"
    ERROR=$(echo $LOGIN_RESPONSE | jq -r '.msg // .error // "Error desconocido"')
    echo "   Error: $ERROR"
  fi
  echo ""
done

echo "=============================================="
echo "✅ Verificación de usuarios completada"
