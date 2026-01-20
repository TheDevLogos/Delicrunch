#!/bin/bash

# Script de prueba para registro de comercio
# Uso: ./test-comercio-register.sh

echo "🧪 Prueba de Registro de Comercio"
echo "================================="
echo ""

# Configuración
API_URL="${API_URL:-http://localhost:5001/api}"
ENDPOINT="$API_URL/auth/register"

echo "📍 Endpoint: $ENDPOINT"
echo ""

# Datos de prueba
read -r -d '' PAYLOAD << 'EOF'
{
  "nombre": "Test Comercio Demo",
  "email": "test.comercio.demo@delicrunch.com",
  "password": "test123456",
  "rol": "comercio",
  "storeData": {
    "nombre_comercio": "Tacos El Demo",
    "direccion": "Av. Principal 123, Centro, 33130 Meoqui, Chih.",
    "telefono": "+52 639 999 9999",
    "horario": "Lun-Dom 8:00 AM - 10:00 PM",
    "descripcion": "Tacos de prueba para testing del sistema",
    "categoria": "tacos",
    "latitud": 28.2722,
    "longitud": -105.4817
  }
}
EOF

echo "📦 Payload:"
echo "$PAYLOAD" | jq . 2>/dev/null || echo "$PAYLOAD"
echo ""
echo "🚀 Enviando petición..."
echo ""

# Enviar petición
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Separar código de respuesta y body
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📥 Respuesta HTTP: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Registro exitoso!"
  echo ""
  echo "🔑 Token recibido:"
  echo "$BODY" | jq -r '.token' 2>/dev/null || echo "$BODY"
  echo ""
  echo "✨ El comercio se ha registrado correctamente"
  echo "✨ El usuario puede ahora iniciar sesión"
  echo "✨ La tienda se ha creado en la base de datos"
elif [ "$HTTP_CODE" = "400" ]; then
  echo "❌ Error de validación"
  echo ""
  echo "Mensaje:"
  echo "$BODY" | jq -r '.msg' 2>/dev/null || echo "$BODY"
else
  echo "⚠️  Error inesperado"
  echo ""
  echo "Respuesta completa:"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
fi

echo ""
echo "================================="
echo "Fin de la prueba"
