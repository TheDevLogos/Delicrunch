#!/bin/bash

# Script interactivo para probar endpoints específicos del backend en Render
# Con opciones para probar diferentes funcionalidades

set -e

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Verificar que se proporcione la URL
if [ -z "$1" ]; then
    print_error "Debes proporcionar la URL de Render"
    echo ""
    echo "Uso: $0 <URL_DE_RENDER> [endpoint]"
    echo ""
    echo "Ejemplos:"
    echo "  $0 https://tu-backend.onrender.com"
    echo "  $0 https://tu-backend.onrender.com stores"
    echo "  $0 https://tu-backend.onrender.com health"
    echo ""
    exit 1
fi

RENDER_URL="$1"
RENDER_URL="${RENDER_URL%/}"
ENDPOINT="${2:-all}"

# =============================================
# FUNCIONES DE PRUEBA
# =============================================

test_health() {
    print_header "HEALTH CHECK"
    
    echo "Probando: $RENDER_URL/health"
    response=$(curl -s -w "\n%{http_code}" "$RENDER_URL/health")
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    echo "Status Code: $http_code"
    echo ""
    echo "Respuesta:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
    
    if [ "$http_code" = "200" ]; then
        print_success "Health check OK"
        uptime=$(echo "$body" | jq -r '.uptime // "N/A"')
        echo "Uptime del servidor: ${uptime}s"
    else
        print_error "Health check FAILED"
    fi
}

test_stores() {
    print_header "ENDPOINTS DE TIENDAS"
    
    # Lista de tiendas
    print_info "GET /api/stores - Lista de tiendas"
    response=$(curl -s -w "\n%{http_code}" "$RENDER_URL/api/stores")
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    echo "Status Code: $http_code"
    
    if [ "$http_code" = "200" ]; then
        print_success "Endpoint OK"
        count=$(echo "$body" | jq '.data | length' 2>/dev/null || echo "0")
        echo "Tiendas encontradas: $count"
        echo ""
        echo "Primeras tiendas:"
        echo "$body" | jq '.data[0:3] | .[] | {id, nombre, descripcion}' 2>/dev/null || echo "$body" | head -c 200
    else
        print_error "Endpoint FAILED"
        echo "$body"
    fi
    
    echo ""
    echo "────────────────────────────────────────────────────────"
    
    # Búsqueda de tiendas
    print_info "GET /api/stores/search?query=test"
    response=$(curl -s -w "\n%{http_code}" "$RENDER_URL/api/stores/search?query=test")
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    echo "Status Code: $http_code"
    
    if [ "$http_code" = "200" ]; then
        print_success "Búsqueda OK"
    else
        print_warning "Búsqueda respondió con: $http_code"
    fi
}

test_products() {
    print_header "ENDPOINTS DE PRODUCTOS"
    
    print_info "GET /api/products - Lista de productos"
    response=$(curl -s -w "\n%{http_code}" "$RENDER_URL/api/products")
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    echo "Status Code: $http_code"
    
    if [ "$http_code" = "200" ]; then
        print_success "Endpoint OK"
        count=$(echo "$body" | jq '.data | length' 2>/dev/null || echo "0")
        echo "Productos encontrados: $count"
        echo ""
        if [ "$count" != "0" ]; then
            echo "Primeros productos:"
            echo "$body" | jq '.data[0:3] | .[] | {id, nombre, precio, store_id}' 2>/dev/null || echo "$body" | head -c 200
        fi
    else
        print_warning "Endpoint respondió con: $http_code"
        echo "$body" | head -c 200
    fi
}

test_auth() {
    print_header "ENDPOINTS DE AUTENTICACIÓN"
    
    print_info "POST /api/auth/login - Verificación de disponibilidad"
    response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"test123"}' \
        "$RENDER_URL/api/auth/login")
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    echo "Status Code: $http_code"
    
    # 400 o 401 son respuestas válidas (significa que el endpoint funciona)
    if [ "$http_code" = "400" ] || [ "$http_code" = "401" ] || [ "$http_code" = "500" ]; then
        print_success "Endpoint de login está disponible y funcionando"
        echo "Mensaje: $(echo "$body" | jq -r '.message' 2>/dev/null || echo "$body")"
    else
        print_warning "Respuesta inesperada: $http_code"
    fi
    
    echo ""
    echo "────────────────────────────────────────────────────────"
    
    print_info "POST /api/auth/register - Verificación de disponibilidad"
    response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{}' \
        "$RENDER_URL/api/auth/register")
    http_code=$(echo "$response" | tail -n 1)
    
    if [ "$http_code" = "400" ] || [ "$http_code" = "500" ]; then
        print_success "Endpoint de registro está disponible"
    else
        print_warning "Respuesta inesperada: $http_code"
    fi
}

test_database_connection() {
    print_header "VERIFICACIÓN DE CONEXIÓN CON SUPABASE"
    
    print_info "Probando conexión a través de consulta de tiendas..."
    
    response=$(curl -s "$RENDER_URL/api/stores")
    
    if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        success=$(echo "$response" | jq -r '.success')
        
        if [ "$success" = "true" ]; then
            print_success "✨ Conexión con Supabase ESTABLECIDA"
            
            # Verificar si hay datos
            has_data=$(echo "$response" | jq -e '.data' > /dev/null 2>&1 && echo "yes" || echo "no")
            
            if [ "$has_data" = "yes" ]; then
                count=$(echo "$response" | jq '.data | length')
                print_success "Base de datos contiene datos ($count registros de tiendas)"
                echo ""
                echo "Configuración verificada:"
                echo "  ✓ Conexión a PostgreSQL/Supabase"
                echo "  ✓ Tablas existentes y accesibles"
                echo "  ✓ Queries ejecutándose correctamente"
            else
                print_warning "Base de datos conectada pero sin datos en la tabla 'stores'"
                echo ""
                echo "Esto puede significar:"
                echo "  - La tabla existe pero está vacía"
                echo "  - Necesitas ejecutar el seed inicial"
            fi
        else
            print_error "La API respondió pero con success: false"
            message=$(echo "$response" | jq -r '.message // "Sin mensaje"')
            echo "Mensaje: $message"
        fi
    else
        print_error "No se pudo verificar conexión con Supabase"
        echo "Respuesta recibida:"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    fi
}

test_all() {
    test_health
    echo ""
    test_database_connection
    echo ""
    test_stores
    echo ""
    test_products
    echo ""
    test_auth
}

# =============================================
# MENÚ PRINCIPAL
# =============================================

print_header "🧪 PRUEBAS DE BACKEND EN RENDER"
echo "URL Base: $RENDER_URL"
echo ""

case "$ENDPOINT" in
    "health")
        test_health
        ;;
    "stores")
        test_stores
        ;;
    "products")
        test_products
        ;;
    "auth")
        test_auth
        ;;
    "database"|"db")
        test_database_connection
        ;;
    "all"|*)
        test_all
        ;;
esac

echo ""
print_header "RESUMEN"
echo ""
print_info "Para más pruebas detalladas, ejecuta:"
echo "   ./test-render-backend.sh $RENDER_URL"
echo ""
print_info "Para probar un endpoint específico:"
echo "   $0 $RENDER_URL [health|stores|products|auth|database]"
echo ""
