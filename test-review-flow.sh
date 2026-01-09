#!/bin/bash
# Script para probar el flujo completo de reviews

set -e

API_URL="http://localhost:5001/api"
BUYER_EMAIL="comprador@delicrunch.com"
BUYER_PASSWORD="Comprador123"

echo "🧪 Iniciando prueba del flujo de reviews..."
echo ""

# 1. Login como comprador
echo "1️⃣ Login como comprador..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$BUYER_EMAIL\",\"password\":\"$BUYER_PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "❌ Error al obtener token"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token obtenido"
echo ""

# 2. Obtener pedidos del usuario
echo "2️⃣ Obteniendo pedidos del comprador..."
ORDERS=$(curl -s "$API_URL/orders/myorders" \
  -H "x-auth-token: $TOKEN")

echo "$ORDERS" | python3 -m json.tool | head -100
echo ""

# Obtener el primer pedido con estado 'listo', 'recogido' o 'Entregado'
ELIGIBLE_ORDER=$(echo "$ORDERS" | python3 -c "
import sys, json
orders = json.load(sys.stdin)
for order in orders:
    estado = order.get('estado', '').lower()
    if estado in ['listo', 'recogido', 'entregado']:
        print(json.dumps(order))
        break
" 2>/dev/null || echo "{}")

ORDER_ID=$(echo "$ELIGIBLE_ORDER" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")

if [ -z "$ORDER_ID" ]; then
  echo "⚠️ No se encontró un pedido elegible para reseñar"
  echo "   Creando un pedido de prueba..."
  
  # Obtener un producto disponible
  PRODUCTS=$(curl -s "$API_URL/products" | python3 -c "import sys, json; products=json.load(sys.stdin); print(products[0]['id'] if products else '')")
  
  if [ -z "$PRODUCTS" ]; then
    echo "❌ No hay productos disponibles"
    exit 1
  fi
  
  # Simular creación de pedido (esto normalmente requeriría pago)
  # Por ahora, usar un pedido existente o actualizar uno manualmente en la BD
  echo "   Se requiere crear un pedido manualmente o usar uno existente"
  exit 0
fi

echo "3️⃣ Pedido seleccionado: $ORDER_ID"
PRODUCT_ID=$(echo "$ELIGIBLE_ORDER" | python3 -c "import sys, json; print(json.load(sys.stdin).get('producto_id',''))" 2>/dev/null || echo "")
echo "   Product ID: $PRODUCT_ID"
echo "   Estado: $(echo "$ELIGIBLE_ORDER" | python3 -c "import sys, json; print(json.load(sys.stdin).get('estado',''))" 2>/dev/null)"
echo ""

# 3. Obtener detalles del pedido
echo "4️⃣ Obteniendo detalles del pedido..."
ORDER_DETAIL=$(curl -s "$API_URL/orders/$ORDER_ID" \
  -H "x-auth-token: $TOKEN")

echo "$ORDER_DETAIL" | python3 -m json.tool
echo ""

# 4. Verificar reviews existentes
echo "5️⃣ Verificando reviews existentes..."
MY_REVIEWS=$(curl -s "$API_URL/reviews/my" \
  -H "x-auth-token: $TOKEN")

echo "Total de reviews: $(echo "$MY_REVIEWS" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")"
echo ""

# Verificar si ya existe review para este pedido
HAS_REVIEW=$(echo "$MY_REVIEWS" | python3 -c "
import sys, json
reviews = json.load(sys.stdin)
order_id = $ORDER_ID
for review in reviews:
    if review.get('order_id') == order_id:
        print('true')
        break
else:
    print('false')
" 2>/dev/null || echo "false")

if [ "$HAS_REVIEW" = "true" ]; then
  echo "⚠️ Ya existe una review para este pedido"
  echo ""
  echo "Reviews actuales:"
  echo "$MY_REVIEWS" | python3 -m json.tool
  exit 0
fi

# 5. Crear una review
echo "6️⃣ Creando nueva review..."
REVIEW_DATA="{
  \"order_id\": $ORDER_ID,
  \"product_id\": $PRODUCT_ID,
  \"calificacion\": 5,
  \"comentario\": \"Excelente producto, prueba automática del sistema $(date +%H:%M:%S)\"
}"

echo "Datos de la review:"
echo "$REVIEW_DATA" | python3 -m json.tool
echo ""

CREATE_RESPONSE=$(curl -s -X POST "$API_URL/reviews" \
  -H "Content-Type: application/json" \
  -H "x-auth-token: $TOKEN" \
  -d "$REVIEW_DATA")

echo "Respuesta:"
echo "$CREATE_RESPONSE" | python3 -m json.tool
echo ""

# 6. Verificar que la review se creó
echo "7️⃣ Verificando que la review se creó..."
MY_REVIEWS_AFTER=$(curl -s "$API_URL/reviews/my" \
  -H "x-auth-token: $TOKEN")

NEW_REVIEW_COUNT=$(echo "$MY_REVIEWS_AFTER" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
echo "Total de reviews después: $NEW_REVIEW_COUNT"
echo ""

# Verificar si la nueva review está en la lista
NEW_REVIEW=$(echo "$MY_REVIEWS_AFTER" | python3 -c "
import sys, json
reviews = json.load(sys.stdin)
order_id = $ORDER_ID
for review in reviews:
    if review.get('order_id') == order_id:
        print(json.dumps(review, indent=2))
        break
" 2>/dev/null || echo "{}")

if [ "$NEW_REVIEW" != "{}" ]; then
  echo "✅ Review creada exitosamente:"
  echo "$NEW_REVIEW"
else
  echo "❌ No se pudo verificar la creación de la review"
fi

echo ""
echo "✅ Prueba completada"
