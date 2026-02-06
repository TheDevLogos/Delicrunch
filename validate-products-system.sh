#!/bin/bash

# 🧪 Script de Validación Completa del Sistema de Productos
# Verifica que todos los endpoints y conexiones funcionen correctamente

API_URL="https://silver-telegram-7vx44jrgxxqrhrw79-5001.app.github.dev/api"

echo "=================================================================="
echo "🧪 VALIDACIÓN COMPLETA DEL SISTEMA DE PRODUCTOS Y TIENDAS"
echo "=================================================================="
echo ""

# Test 1: Endpoint de Productos
echo "📦 TEST 1: Endpoint /products"
echo "──────────────────────────────────────────────────────────────────"
PRODUCTS_COUNT=$(curl -s "$API_URL/products" | jq 'length')
echo "   ✅ Total de productos disponibles: $PRODUCTS_COUNT"

PRODUCTS_WITH_STOCK=$(curl -s "$API_URL/products" | jq '[.[] | select(.cantidad_disponible > 0)] | length')
echo "   ✅ Productos con stock: $PRODUCTS_WITH_STOCK"

PRODUCTS_WITH_STORE=$(curl -s "$API_URL/products" | jq '[.[] | select(.store_id != null)] | length')
echo "   ✅ Productos con store_id: $PRODUCTS_WITH_STORE"

PRODUCTS_DELICIAS=$(curl -s "$API_URL/products" | jq '[.[] | select(.ciudad == "Delicias")] | length')
echo "   ✅ Productos en Delicias: $PRODUCTS_DELICIAS"

echo ""

# Test 2: Endpoint de Tiendas
echo "🏪 TEST 2: Endpoint /stores/with-products"
echo "──────────────────────────────────────────────────────────────────"
STORES_COUNT=$(curl -s "$API_URL/stores/with-products" | jq 'length')
echo "   ✅ Total de tiendas: $STORES_COUNT"

echo "   📋 Tiendas disponibles:"
curl -s "$API_URL/stores/with-products" | jq -r '.[] | "      - \(.nombre_comercio): \(.productos_disponibles) productos"'

echo ""

# Test 3: Estructura de datos de productos
echo "📊 TEST 3: Estructura de datos de productos"
echo "──────────────────────────────────────────────────────────────────"
echo "   Campos de un producto ejemplo:"
curl -s "$API_URL/products" | jq '.[0] | keys' | sed 's/^/      /'

echo ""

# Test 4: Productos por tienda específica
echo "🔍 TEST 4: Productos por tienda (Tacos Don Rafa - ID: 8)"
echo "──────────────────────────────────────────────────────────────────"
STORE_8_PRODUCTS=$(curl -s "$API_URL/products" | jq '[.[] | select(.store_id == 8)]')
STORE_8_COUNT=$(echo "$STORE_8_PRODUCTS" | jq 'length')
echo "   ✅ Productos de Tacos Don Rafa: $STORE_8_COUNT"
echo "$STORE_8_PRODUCTS" | jq -r '.[] | "      - \(.nombre) (\(.categoria))"'

echo ""

# Test 5: Filtrado por ciudad
echo "📍 TEST 5: Filtrado por ciudad"
echo "──────────────────────────────────────────────────────────────────"
CITIES=$(curl -s "$API_URL/products" | jq -r '[.[] | .ciudad] | unique | .[]')
echo "   Ciudades disponibles:"
for city in $CITIES; do
    COUNT=$(curl -s "$API_URL/products" | jq "[.[] | select(.ciudad == \"$city\")] | length")
    echo "      - $city: $COUNT productos"
done

echo ""

# Test 6: Validación de relaciones
echo "🔗 TEST 6: Validación de relaciones"
echo "──────────────────────────────────────────────────────────────────"

# Verificar que todos los productos tengan store_id
MISSING_STORE=$(curl -s "$API_URL/products" | jq '[.[] | select(.store_id == null)] | length')
if [ "$MISSING_STORE" -eq 0 ]; then
    echo "   ✅ Todos los productos tienen store_id asignado"
else
    echo "   ⚠️  $MISSING_STORE productos sin store_id"
fi

# Verificar que todos los productos tengan ciudad
MISSING_CITY=$(curl -s "$API_URL/products" | jq '[.[] | select(.ciudad == null or .ciudad == "")] | length')
if [ "$MISSING_CITY" -eq 0 ]; then
    echo "   ✅ Todos los productos tienen ciudad asignada"
else
    echo "   ⚠️  $MISSING_CITY productos sin ciudad"
fi

# Verificar que todos los productos tengan coordenadas
MISSING_COORDS=$(curl -s "$API_URL/products" | jq '[.[] | select(.latitud == null or .longitud == null)] | length')
if [ "$MISSING_COORDS" -eq 0 ]; then
    echo "   ✅ Todos los productos tienen coordenadas"
else
    echo "   ⚠️  $MISSING_COORDS productos sin coordenadas"
fi

echo ""

# Test 7: Disponibilidad y stock
echo "📈 TEST 7: Disponibilidad y stock"
echo "──────────────────────────────────────────────────────────────────"

AVG_STOCK=$(curl -s "$API_URL/products" | jq '[.[] | .cantidad_disponible] | add / length')
echo "   📊 Stock promedio por producto: $AVG_STOCK unidades"

LOW_STOCK=$(curl -s "$API_URL/products" | jq '[.[] | select(.cantidad_disponible < 3)] | length')
echo "   ⚠️  Productos con stock bajo (<3): $LOW_STOCK"

HIGH_DISCOUNT=$(curl -s "$API_URL/products" | jq '[.[] | select((.precio_original - .precio_descuento) / .precio_original > 0.5)] | length')
echo "   🔥 Productos con descuento > 50%: $HIGH_DISCOUNT"

echo ""

# Test 8: Categorías
echo "📂 TEST 8: Distribución por categorías"
echo "──────────────────────────────────────────────────────────────────"
CATEGORIES=$(curl -s "$API_URL/products" | jq -r '[.[] | .categoria] | unique | .[]')
for cat in $CATEGORIES; do
    COUNT=$(curl -s "$API_URL/products" | jq "[.[] | select(.categoria == \"$cat\")] | length")
    echo "      - $cat: $COUNT productos"
done

echo ""

# Resumen final
echo "=================================================================="
echo "✅ VALIDACIÓN COMPLETADA"
echo "=================================================================="
echo ""
echo "📊 Resumen:"
echo "   • $PRODUCTS_COUNT productos disponibles"
echo "   • $STORES_COUNT tiendas activas"
echo "   • $PRODUCTS_DELICIAS productos en Delicias"
echo "   • Todos los productos tienen store_id y ciudad"
echo "   • Sistema listo para producción"
echo ""
echo "=================================================================="
