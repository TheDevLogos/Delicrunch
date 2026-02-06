#!/bin/bash

echo "🧪 PRUEBA DE ENDPOINTS - DELICRUNCH"
echo "════════════════════════════════════════════════════════"
echo ""

BASE_URL="http://localhost:5001/api"

echo "1️⃣  Testing /products endpoint..."
PRODUCTS=$(curl -s $BASE_URL/products | jq '. | length')
echo "   ✅ Productos disponibles: $PRODUCTS"
echo ""

echo "2️⃣  Testing /stores/with-products endpoint..."
STORES=$(curl -s $BASE_URL/stores/with-products | jq '. | length')
echo "   ✅ Tiendas con productos: $STORES"
echo ""

echo "3️⃣  Verificando estructura de productos..."
curl -s $BASE_URL/products | jq '.[0] | {
  id,
  nombre,
  nombre_comercio, 
  precio_descuento,
  cantidad_disponible,
  categoria,
  latitud,
  longitud,
  imagen_url
}' | head -20
echo ""

echo "4️⃣  Verificando estructura de tiendas..."
curl -s $BASE_URL/stores/with-products | jq '.[0] | {
  id,
  nombre_comercio,
  direccion,
  latitud,
  longitud,
  productos_disponibles
}' | head -15
echo ""

echo "════════════════════════════════════════════════════════"
echo "✅ Pruebas completadas"
echo ""
echo "📍 URLs para el Frontend:"
echo "   • Productos: $BASE_URL/products"
echo "   • Tiendas: $BASE_URL/stores/with-products"
echo ""
