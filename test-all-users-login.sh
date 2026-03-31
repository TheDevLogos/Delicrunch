#!/bin/bash

API_URL="https://delicrunch.onrender.com/api"

echo "🔐 PRUEBA DE ACCESOS - TODOS LOS USUARIOS"
echo "========================================================================"
echo ""

# Array de usuarios
declare -a USUARIOS=(
  "admin@delicrunch.com:Admin123!:admin"
  "comercio@delicrunch.com:Comercio123!:comercio"
  "pizza@delicrunch.com:Comercio123!:comercio"
  "cafe@delicrunch.com:Comercio123!:comercio"
  "testbuyer2@delicrunch.com:Test1234!:comprador"
)

SUCCESS=0
FAILED=0

for USUARIO in "${USUARIOS[@]}"; do
  IFS=':' read -r EMAIL PASSWORD TIPO <<< "$USUARIO"
  
  echo "🔍 Probando: $EMAIL ($TIPO)"
  
  RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
  
  # Verificar si contiene token
  if echo "$RESPONSE" | jq -e '.token' > /dev/null 2>&1; then
    TOKEN=$(echo "$RESPONSE" | jq -r '.token')
    if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
      echo "   ✅ Login exitoso"
      echo "   🎫 Token: ${TOKEN:0:30}..."
      ((SUCCESS++))
    else
      echo "   ❌ Login fallido - No se recibió token"
      echo "   📄 Response: $RESPONSE"
      ((FAILED++))
    fi
  else
    echo "   ❌ Login fallido"
    echo "   📄 Response: $RESPONSE"
    ((FAILED++))
  fi
  
  echo ""
done

echo "========================================================================"
echo "📊 RESUMEN:"
echo "   ✅ Exitosos: $SUCCESS"
echo "   ❌ Fallidos: $FAILED"
echo "========================================================================"

if [ $FAILED -eq 0 ]; then
  echo "🎉 ¡Todos los accesos funcionan correctamente!"
else
  echo "⚠️  Algunos accesos no funcionaron. Revisa los errores arriba."
fi
