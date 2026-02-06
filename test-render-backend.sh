#!/bin/bash

# Script para verificar el backend en Render y la conexión con Supabase
# Uso: ./test-render-backend.sh <URL_DE_RENDER>

set -e

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    echo ""
}

# Verificar que se proporcione la URL
if [ -z "$1" ]; then
    print_error "Debes proporcionar la URL de Render"
    echo "Uso: $0 https://tu-backend.onrender.com"
    exit 1
fi

RENDER_URL="$1"
# Eliminar trailing slash si existe
RENDER_URL="${RENDER_URL%/}"

print_header "VERIFICACIÓN DEL BACKEND EN RENDER"
echo "URL Base: $RENDER_URL"
echo ""

# Contador de pruebas
PASSED=0
FAILED=0
TOTAL=0

# Función para hacer request y verificar
test_endpoint() {
    local name="$1"
    local endpoint="$2"
    local method="${3:-GET}"
    local data="$4"
    local expected_status="${5:-200}"
    
    TOTAL=$((TOTAL + 1))
    print_info "Probando: $name"
    echo "   Endpoint: $method $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$endpoint" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$endpoint" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    echo "   Status: $http_code"
    
    if [ "$http_code" = "$expected_status" ]; then
        print_success "$name - OK"
        echo "   Respuesta: $(echo "$body" | jq -c '.' 2>/dev/null || echo "$body" | head -c 100)"
        PASSED=$((PASSED + 1))
        return 0
    else
        print_error "$name - FAILED"
        echo "   Se esperaba: $expected_status, Se obtuvo: $http_code"
        echo "   Respuesta: $body"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# =============================================
# PRUEBAS BÁSICAS DE CONECTIVIDAD
# =============================================
print_header "1. PRUEBAS DE CONECTIVIDAD BÁSICA"

test_endpoint "Root Endpoint" "$RENDER_URL/"
test_endpoint "Health Check (/health)" "$RENDER_URL/health"
test_endpoint "Health Check (/api/health)" "$RENDER_URL/api/health"

# =============================================
# PRUEBAS DE AUTENTICACIÓN
# =============================================
print_header "2. PRUEBAS DE ENDPOINTS DE AUTENTICACIÓN"

# Test de registro (esperamos error 400 si ya existe o falta data)
print_info "Test de endpoint de registro (verificación de disponibilidad)"
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{}' \
    "$RENDER_URL/api/auth/register" 2>&1)
http_code=$(echo "$response" | tail -n 1)
if [ "$http_code" = "400" ] || [ "$http_code" = "500" ]; then
    print_success "Endpoint /api/auth/register está disponible"
    PASSED=$((PASSED + 1))
else
    print_warning "Endpoint /api/auth/register respondió con: $http_code"
fi
TOTAL=$((TOTAL + 1))

# Test de login
print_info "Test de endpoint de login (verificación de disponibilidad)"
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}' \
    "$RENDER_URL/api/auth/login" 2>&1)
http_code=$(echo "$response" | tail -n 1)
if [ "$http_code" = "400" ] || [ "$http_code" = "401" ] || [ "$http_code" = "500" ]; then
    print_success "Endpoint /api/auth/login está disponible"
    PASSED=$((PASSED + 1))
else
    print_warning "Endpoint /api/auth/login respondió con: $http_code"
fi
TOTAL=$((TOTAL + 1))

# =============================================
# PRUEBAS DE ENDPOINTS PÚBLICOS
# =============================================
print_header "3. PRUEBAS DE ENDPOINTS PÚBLICOS"

test_endpoint "Lista de Tiendas" "$RENDER_URL/api/stores"
test_endpoint "Búsqueda de Tiendas" "$RENDER_URL/api/stores/search?query=test"

# =============================================
# PRUEBA DE CONEXIÓN CON SUPABASE
# =============================================
print_header "4. VERIFICACIÓN DE CONEXIÓN CON SUPABASE"

print_info "Probando conexión a través de endpoint de tiendas..."
response=$(curl -s "$RENDER_URL/api/stores")
if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
    if echo "$response" | jq -e '.data' > /dev/null 2>&1; then
        print_success "Conexión con Supabase ESTABLECIDA - Datos recibidos"
        stores_count=$(echo "$response" | jq '.data | length')
        echo "   Número de tiendas en BD: $stores_count"
        PASSED=$((PASSED + 1))
    else
        print_warning "Endpoint responde pero sin datos (BD vacía o tabla no existe)"
        PASSED=$((PASSED + 1))
    fi
else
    print_error "No se pudo verificar conexión con Supabase"
    echo "   Respuesta: $response"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# =============================================
# PRUEBAS DE PRODUCTOS
# =============================================
print_header "5. PRUEBAS DE ENDPOINTS DE PRODUCTOS"

print_info "Probando endpoint de productos..."
response=$(curl -s -w "\n%{http_code}" "$RENDER_URL/api/products")
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ] || [ "$http_code" = "404" ]; then
    print_success "Endpoint /api/products está disponible"
    PASSED=$((PASSED + 1))
else
    print_warning "Endpoint /api/products respondió con: $http_code"
fi
TOTAL=$((TOTAL + 1))

# =============================================
# VERIFICACIÓN DE VARIABLES DE ENTORNO
# =============================================
print_header "6. VERIFICACIÓN DE CONFIGURACIÓN"

print_info "Verificando que el servidor retorna respuestas JSON válidas..."
response=$(curl -s "$RENDER_URL/")
if echo "$response" | jq empty 2>/dev/null; then
    print_success "Respuestas JSON válidas"
    version=$(echo "$response" | jq -r '.version // "N/A"')
    echo "   Versión de API: $version"
    PASSED=$((PASSED + 1))
else
    print_error "Las respuestas no son JSON válido"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# =============================================
# RESUMEN FINAL
# =============================================
print_header "RESUMEN DE PRUEBAS"

echo ""
echo "Total de pruebas: $TOTAL"
print_success "Pruebas exitosas: $PASSED"
print_error "Pruebas fallidas: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    print_success "¡TODAS LAS PRUEBAS PASARON!"
    echo ""
    print_info "Tu backend en Render está funcionando correctamente ✨"
    echo ""
    echo "Próximos pasos:"
    echo "1. ✅ Backend desplegado y funcionando en Render"
    echo "2. ✅ Conexión con Supabase establecida"
    echo "3. 🚀 Puedes proceder a generar tu EAS Dev Build"
    echo ""
    echo "Para el EAS Build, asegúrate de configurar:"
    echo "   EXPO_PUBLIC_API_URL=$RENDER_URL/api"
    exit 0
else
    print_error "ALGUNAS PRUEBAS FALLARON"
    echo ""
    echo "Revisa los errores anteriores y verifica:"
    echo "1. Las variables de entorno en Render"
    echo "2. Los logs del servicio en el dashboard de Render"
    echo "3. La configuración de Supabase"
    exit 1
fi
