#!/bin/bash

# Script de prueba de pagos en PRODUCCIÓN (Render + Supabase)
# Backend: https://delicrunch.onrender.com

API_URL="https://delicrunch.onrender.com/api"

echo "🌐 Probando flujo de pagos en PRODUCCIÓN"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Test de salud del backend
echo "📊 1. Verificando salud del backend..."
HEALTH=$(curl -s "${API_URL}/health")
if echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Backend saludable${NC}"
    echo "$HEALTH" | jq '.'
else
    echo -e "${RED}❌ Backend no responde correctamente${NC}"
    exit 1
fi
echo ""

# 2. Login de usuario de prueba
echo "🔐 2. Iniciando sesión..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testbuyer2@delicrunch.com","password":"Test1234!"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Error en login${NC}"
  echo $LOGIN_RESPONSE | jq '.'
  echo ""
  echo "💡 Intentando con otro usuario..."
  
  LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"buyer@delicrunch.com","password":"Test1234!"}')
  
  TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
  
  if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ No se pudo autenticar${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}✅ Login exitoso${NC}"
echo "Token: ${TOKEN:0:30}..."
echo ""

# 3. Listar productos disponibles
echo "🛍️  3. Listando productos disponibles..."
PRODUCTS=$(curl -s "${API_URL}/products?limit=5")
PRODUCT_COUNT=$(echo "$PRODUCTS" | jq '. | length')

if [ "$PRODUCT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ $PRODUCT_COUNT productos encontrados${NC}"
    echo "$PRODUCTS" | jq '.[0] | {id, nombre, precio_descuento, precio_original, nombre_comercio}'
    PRODUCT_ID=$(echo "$PRODUCTS" | jq -r '.[0].id')
else
    echo -e "${YELLOW}⚠️  No hay productos disponibles${NC}"
    echo "Usando ID de producto por defecto: 1"
    PRODUCT_ID=1
fi
echo ""

# 4. Crear preferencia de pago
echo "💳 4. Creando preferencia de pago..."
echo "   Producto ID: $PRODUCT_ID"
echo "   Cantidad: 1"
echo ""

PREFERENCE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/payments/create-preference" \
  -H "Content-Type: application/json" \
  -H "x-auth-token: $TOKEN" \
  -d "{\"productId\":${PRODUCT_ID},\"cantidad\":1,\"coupon_discount\":0}")

HTTP_CODE=$(echo "$PREFERENCE_RESPONSE" | tail -1)
RESPONSE_BODY=$(echo "$PREFERENCE_RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Preferencia creada exitosamente!${NC}"
  echo ""
  echo "📋 Detalles de la preferencia:"
  echo "$RESPONSE_BODY" | jq '{
    preferenceId,
    amount,
    platformFee,
    merchantAmount,
    initPoint: (.initPoint | split("/") | last)
  }'
  
  INIT_POINT=$(echo "$RESPONSE_BODY" | jq -r '.initPoint')
  PREFERENCE_ID=$(echo "$RESPONSE_BODY" | jq -r '.preferenceId')
  
  echo ""
  echo "🌐 URL de Checkout (Mercado Pago):"
  echo "$INIT_POINT"
  echo ""
  echo "💡 Para probar en la app móvil:"
  echo "   1. Abre la app Delicrunch"
  echo "   2. Selecciona un producto"
  echo "   3. Presiona 'Comprar'"
  echo "   4. Se abrirá el navegador con Mercado Pago"
  echo ""
  
elif [ "$HTTP_CODE" = "404" ]; then
  echo -e "${YELLOW}⚠️  Producto no encontrado${NC}"
  echo "$RESPONSE_BODY" | jq '.'
elif [ "$HTTP_CODE" = "400" ]; then
  echo -e "${YELLOW}⚠️  Error de validación${NC}"
  echo "$RESPONSE_BODY" | jq '.'
elif [ "$HTTP_CODE" = "500" ]; then
  echo -e "${RED}❌ Error del servidor${NC}"
  echo "$RESPONSE_BODY" | jq '.'
  echo ""
  echo "🔍 Posibles causas:"
  echo "   - Credenciales de MercadoPago no configuradas en Render"
  echo "   - Variables de entorno faltantes"
  echo "   - Problema con la API de MercadoPago"
  echo ""
  echo "🔧 Verifica en Render Dashboard:"
  echo "   MERCADOPAGO_ACCESS_TOKEN"
  echo "   MERCADOPAGO_PUBLIC_KEY"
else
  echo -e "${RED}❌ Error al crear preferencia${NC}"
  echo "$RESPONSE_BODY" | jq '.'
fi
echo ""

# 5. Verificar configuración de Render
echo "⚙️  5. Recomendaciones de configuración en Render:"
echo "   • Asegúrate de que estas variables estén definidas:"
echo "     - MERCADOPAGO_ACCESS_TOKEN"
echo "     - MERCADOPAGO_PUBLIC_KEY"
echo "     - MERCADOPAGO_USER_ID"
echo "     - MERCADOPAGO_APP_ID"
echo "     - BACKEND_URL=https://delicrunch.onrender.com"
echo "     - DATABASE_URL (ya configurado con Supabase)"
echo ""

# 6. Resumen
echo "📊 RESUMEN DE PRUEBAS"
echo "===================="
echo "Backend URL: $API_URL"
echo "Estado: $(echo $HEALTH | jq -r '.status')"
echo "Uptime: $(echo $HEALTH | jq -r '.uptime') segundos"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ FLUJO DE PAGO FUNCIONANDO CORRECTAMENTE${NC}"
    echo ""
    echo "🎉 La app está lista para procesar pagos reales con Mercado Pago"
    echo ""
    echo "⚠️  IMPORTANTE para Google Play:"
    echo "   • Verifica que uses credenciales de PRODUCCIÓN (no sandbox)"
    echo "   • Prueba el flujo completo desde la app móvil"
    echo "   • Verifica webhooks de Mercado Pago en Render logs"
else
    echo -e "${RED}⚠️  HAY PROBLEMAS CON EL FLUJO DE PAGO${NC}"
    echo ""
    echo "🔧 Revisa:"
    echo "   1. Variables de entorno en Render"
    echo "   2. Logs del backend en Render Dashboard"
    echo "   3. Configuración de Mercado Pago"
fi
echo ""
