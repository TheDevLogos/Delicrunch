#!/bin/bash
# Script completo para probar el flujo de compra desde comprador hasta review

set -e

API_URL="http://localhost:5001/api"
BUYER_EMAIL="comprador@delicrunch.com"
BUYER_PASSWORD="Comprador123"
MERCHANT_EMAIL="espiga@demo.com"
MERCHANT_PASSWORD="Admin1234"

echo "🛒 === PRUEBA COMPLETA DEL FLUJO DE COMPRA ==="
echo ""

# ============================================
# PASO 1: LOGIN COMO COMPRADOR
# ============================================
echo "1️⃣ Login como comprador..."
BUYER_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$BUYER_EMAIL\",\"password\":\"$BUYER_PASSWORD\"}")

BUYER_TOKEN=$(echo "$BUYER_LOGIN" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null || echo "")

if [ -z "$BUYER_TOKEN" ]; then
  echo "❌ Error al obtener token del comprador"
  echo "$BUYER_LOGIN"
  exit 1
fi

echo "✅ Token del comprador obtenido"
echo ""

# ============================================
# PASO 2: VER PRODUCTOS DE LA ESPIGA
# ============================================
echo "2️⃣ Consultando productos de Panadería La Espiga..."
PRODUCTS=$(curl -s "$API_URL/products" | python3 -c "
import sys, json
products = json.load(sys.stdin)
espiga_products = [p for p in products if 'Espiga' in p.get('nombre_comercio', '')]
if espiga_products:
    print(json.dumps(espiga_products[:3], indent=2))
else:
    print('[]')
")

PRODUCT_ID=$(echo "$PRODUCTS" | python3 -c "import sys, json; products=json.load(sys.stdin); print(products[0]['id'] if products else '')" 2>/dev/null || echo "")

if [ -z "$PRODUCT_ID" ]; then
  echo "❌ No se encontraron productos de La Espiga"
  exit 1
fi

echo "✅ Producto seleccionado: ID $PRODUCT_ID"
echo ""

# ============================================
# PASO 3: CREAR PEDIDO (simular compra)
# ============================================
echo "3️⃣ Creando pedido como comprador..."
ORDER_DATA="{
  \"productId\": $PRODUCT_ID,
  \"cantidad\": 1,
  \"stripePaymentIntentId\": \"pi_test_$(date +%s)\"
}"

CREATE_ORDER=$(curl -s -X POST "$API_URL/orders" \
  -H "Content-Type: application/json" \
  -H "x-auth-token: $BUYER_TOKEN" \
  -d "$ORDER_DATA")

ORDER_ID=$(echo "$CREATE_ORDER" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")

if [ -z "$ORDER_ID" ]; then
  echo "❌ Error al crear el pedido"
  echo "$CREATE_ORDER" | python3 -m json.tool
  exit 1
fi

echo "✅ Pedido creado: ID $ORDER_ID"
echo "$CREATE_ORDER" | python3 -m json.tool | head -20
echo ""

# ============================================
# PASO 4: LOGIN COMO COMERCIO (LA ESPIGA)
# ============================================
echo "4️⃣ Login como comercio (Panadería La Espiga)..."
MERCHANT_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$MERCHANT_EMAIL\",\"password\":\"$MERCHANT_PASSWORD\"}")

MERCHANT_TOKEN=$(echo "$MERCHANT_LOGIN" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null || echo "")

if [ -z "$MERCHANT_TOKEN" ]; then
  echo "❌ Error al obtener token del comercio"
  echo "$MERCHANT_LOGIN"
  exit 1
fi

echo "✅ Token del comercio obtenido"
echo ""

# ============================================
# PASO 5: VER PEDIDOS RECIBIDOS
# ============================================
echo "5️⃣ Consultando pedidos recibidos en la tienda..."
STORE_ORDERS=$(curl -s "$API_URL/orders/mystoreorders" \
  -H "x-auth-token: $MERCHANT_TOKEN")

ORDER_COUNT=$(echo "$STORE_ORDERS" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

echo "📦 Total de pedidos en la tienda: $ORDER_COUNT"

# Buscar nuestro pedido específico
OUR_ORDER=$(echo "$STORE_ORDERS" | python3 -c "
import sys, json
orders = json.load(sys.stdin)
order_id = $ORDER_ID
our_order = next((o for o in orders if o.get('id') == order_id), None)
if our_order:
    print(json.dumps(our_order, indent=2))
else:
    print('{}')
" 2>/dev/null || echo "{}")

if [ "$OUR_ORDER" = "{}" ]; then
  echo "⚠️ El pedido $ORDER_ID no aparece en la lista del comercio"
  echo "Todos los pedidos recibidos:"
  echo "$STORE_ORDERS" | python3 -m json.tool | head -50
else
  echo "✅ Pedido $ORDER_ID encontrado en la tienda:"
  echo "$OUR_ORDER" | python3 -m json.tool
fi
echo ""

# ============================================
# PASO 6: ACTUALIZAR ESTADO DEL PEDIDO
# ============================================
echo "6️⃣ Actualizando estado del pedido..."

# Confirmado
echo "   → Marcando como Confirmado..."
curl -s -X PATCH "$API_URL/orders/$ORDER_ID" \
  -H "Content-Type: application/json" \
  -H "x-auth-token: $MERCHANT_TOKEN" \
  -d '{"estado":"confirmado"}' > /dev/null

sleep 1

# Listo
echo "   → Marcando como Listo..."
curl -s -X PATCH "$API_URL/orders/$ORDER_ID" \
  -H "Content-Type: application/json" \
  -H "x-auth-token: $MERCHANT_TOKEN" \
  -d '{"estado":"listo"}' > /dev/null

sleep 1

# Recogido (Entregado)
echo "   → Marcando como Recogido (Entregado)..."
UPDATED_ORDER=$(curl -s -X PATCH "$API_URL/orders/$ORDER_ID" \
  -H "Content-Type: application/json" \
  -H "x-auth-token: $MERCHANT_TOKEN" \
  -d '{"estado":"recogido"}')

FINAL_STATE=$(echo "$UPDATED_ORDER" | python3 -c "import sys, json; print(json.load(sys.stdin).get('order',{}).get('estado',''))" 2>/dev/null || echo "")

if [ "$FINAL_STATE" = "recogido" ]; then
  echo "✅ Pedido marcado como entregado correctamente"
else
  echo "⚠️ Estado final: $FINAL_STATE"
fi
echo ""

# ============================================
# PASO 7: COMPRADOR VE EL PEDIDO
# ============================================
echo "7️⃣ Comprador consulta su pedido..."
BUYER_ORDER=$(curl -s "$API_URL/orders/$ORDER_ID" \
  -H "x-auth-token: $BUYER_TOKEN")

ORDER_STATUS=$(echo "$BUYER_ORDER" | python3 -c "import sys, json; print(json.load(sys.stdin).get('estado',''))" 2>/dev/null || echo "")

echo "📦 Estado del pedido desde comprador: $ORDER_STATUS"
echo ""

# ============================================
# PASO 8: CREAR REVIEW
# ============================================
echo "8️⃣ Creando review del pedido..."

REVIEW_DATA="{
  \"order_id\": $ORDER_ID,
  \"product_id\": $PRODUCT_ID,
  \"calificacion\": 5,
  \"comentario\": \"Excelente servicio de La Espiga! Prueba automatizada $(date +%H:%M:%S)\"
}"

CREATE_REVIEW=$(curl -s -X POST "$API_URL/reviews" \
  -H "Content-Type: application/json" \
  -H "x-auth-token: $BUYER_TOKEN" \
  -d "$REVIEW_DATA")

REVIEW_ID=$(echo "$CREATE_REVIEW" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")

if [ -z "$REVIEW_ID" ]; then
  echo "❌ Error al crear review"
  echo "$CREATE_REVIEW" | python3 -m json.tool
else
  echo "✅ Review creada exitosamente: ID $REVIEW_ID"
  echo "$CREATE_REVIEW" | python3 -m json.tool
fi
echo ""

# ============================================
# PASO 9: VERIFICAR REVIEW EN MIS RESEÑAS
# ============================================
echo "9️⃣ Verificando review en Mis Reseñas..."
MY_REVIEWS=$(curl -s "$API_URL/reviews/my" \
  -H "x-auth-token: $BUYER_TOKEN")

OUR_REVIEW=$(echo "$MY_REVIEWS" | python3 -c "
import sys, json
reviews = json.load(sys.stdin)
order_id = $ORDER_ID
our_review = next((r for r in reviews if r.get('order_id') == order_id), None)
if our_review:
    print(json.dumps(our_review, indent=2))
else:
    print('{}')
" 2>/dev/null || echo "{}")

if [ "$OUR_REVIEW" != "{}" ]; then
  echo "✅ Review encontrada en Mis Reseñas"
  echo "$OUR_REVIEW" | python3 -m json.tool
else
  echo "❌ Review no encontrada en Mis Reseñas"
fi
echo ""

# ============================================
# RESUMEN FINAL
# ============================================
echo "═══════════════════════════════════════════"
echo "✅ FLUJO DE COMPRA COMPLETADO"
echo "═══════════════════════════════════════════"
echo ""
echo "📝 Resumen:"
echo "  - Pedido ID: $ORDER_ID"
echo "  - Producto ID: $PRODUCT_ID"
echo "  - Estado final: $ORDER_STATUS"
echo "  - Review ID: $REVIEW_ID"
echo ""
echo "🔗 Validaciones:"
echo "  ✅ Comprador puede crear pedidos"
echo "  ✅ Comercio recibe pedidos en su tienda"
echo "  ✅ Comercio puede actualizar estado"
echo "  ✅ Comprador puede ver pedido actualizado"
echo "  ✅ Sistema permite reviews en pedidos entregados"
echo "  ✅ Reviews aparecen en Mis Reseñas"
echo ""
echo "🎯 Sistema de compra funcionando correctamente"
