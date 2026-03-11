#!/bin/bash

# Script de prueba completo del sistema de reseñas y moderación
# Prueba todos los endpoints según los roles: comprador, comercio, admin
#
# Uso:
#   ./test-reviews-system.sh           → prueba local (localhost:5001)
#   ./test-reviews-system.sh -p        → prueba producción (Render)

# --- Modo de ejecución ---
if [[ "$1" == "-p" || "$1" == "--prod" ]]; then
    API_URL="https://delicrunch.onrender.com/api"
    echo "🌐 MODO PRODUCCIÓN: $API_URL"
else
    API_URL="http://localhost:5001/api"
    echo "💻 MODO LOCAL: $API_URL"
fi

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Usuarios de prueba
ADMIN_EMAIL="admin@delicrunch.com"
ADMIN_PASSWORD="Admin123!"
COMERCIO_EMAIL="comercio@delicrunch.com"
COMERCIO_PASSWORD="Comercio123!"
BUYER_EMAIL="testbuyer2@delicrunch.com"
BUYER_PASSWORD="Test1234!"

# Variables globales para tokens
ADMIN_TOKEN=""
COMERCIO_TOKEN=""
BUYER_TOKEN=""
REVIEW_ID=""
PRODUCT_ID=""
STORE_ID=""

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Función para login
login() {
    local email=$1
    local password=$2
    local role=$3
    
    print_info "Iniciando sesión como $role ($email)..."
    
    response=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    token=$(echo $response | grep -o '"token":"[^"]*' | sed 's/"token":"//')
    
    if [ -n "$token" ]; then
        print_success "Login exitoso para $role"
        echo $token
    else
        print_error "Login fallido para $role"
        echo $response | jq '.' 2>/dev/null || echo $response
        echo ""
    fi
}

# Obtener un producto de prueba
get_test_product() {
    print_info "Obteniendo producto de prueba..."
    
    response=$(curl -s "$API_URL/products?limit=1")
    
    PRODUCT_ID=$(echo $response | jq -r '.[0].id // empty')
    STORE_ID=$(echo $response | jq -r '.[0].store_id // empty')
    
    if [ -n "$PRODUCT_ID" ]; then
        print_success "Producto encontrado: ID=$PRODUCT_ID, Store=$STORE_ID"
    else
        print_error "No se encontró producto de prueba"
        echo $response | jq '.' 2>/dev/null || echo $response
    fi
}

# Test 1: Crear reseña como comprador
test_create_review() {
    print_header "TEST 1: Crear Reseña (Comprador)"
    
    response=$(curl -s -X POST "$API_URL/reviews" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $BUYER_TOKEN" \
        -d "{
            \"productId\": $PRODUCT_ID,
            \"calificacion\": 5,
            \"comentario\": \"Excelente producto! Muy recomendado. Test automatizado $(date +%s)\",
            \"calidadComida\": 5,
            \"valorPrecio\": 5,
            \"experienciaRecogida\": 5
        }")
    
    REVIEW_ID=$(echo $response | jq -r '.id // empty')
    
    if [ -n "$REVIEW_ID" ] && [ "$REVIEW_ID" != "null" ]; then
        print_success "Reseña creada exitosamente (ID: $REVIEW_ID)"
        echo $response | jq '.'
    else
        print_error "Fallo al crear reseña"
        echo $response | jq '.' 2>/dev/null || echo $response
    fi
}

# Test 2: Ver reseñas de producto (público)
test_get_product_reviews() {
    print_header "TEST 2: Ver Reseñas de Producto (Público)"
    
    response=$(curl -s "$API_URL/reviews/product/$PRODUCT_ID")
    
    count=$(echo $response | jq '. | length')
    
    if [ "$count" -gt 0 ]; then
        print_success "Se obtuvieron $count reseñas del producto"
        echo $response | jq '.[:2]' # Mostrar solo las primeras 2
    else
        print_error "No se obtuvieron reseñas"
        echo $response | jq '.' 2>/dev/null || echo $response
    fi
}

# Test 3: Ver reseñas de mi tienda (Comercio)
test_get_my_store_reviews() {
    print_header "TEST 3: Ver Reseñas de Mi Tienda (Comercio)"
    
    response=$(curl -s "$API_URL/reviews/mystore" \
        -H "Authorization: Bearer $COMERCIO_TOKEN")
    
    count=$(echo $response | jq '. | length')
    
    if [ "$count" -ge 0 ]; then
        print_success "Se obtuvieron $count reseñas de mi tienda"
        echo $response | jq '.[:2]' # Mostrar solo las primeras 2
    else
        print_error "Fallo al obtener reseñas de mi tienda"
        echo $response | jq '.' 2>/dev/null || echo $response
    fi
}

# Test 4: Responder a reseña como comercio
test_comercio_respond() {
    print_header "TEST 4: Responder Reseña (Comercio)"
    
    if [ -z "$REVIEW_ID" ]; then
        print_error "No hay review_id disponible para responder"
        return
    fi
    
    response=$(curl -s -X POST "$API_URL/reviews/mystore/$REVIEW_ID/respond" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $COMERCIO_TOKEN" \
        -d "{
            \"respuesta\": \"¡Muchas gracias por tu comentario! Nos alegra que hayas disfrutado nuestro producto.\"
        }")
    
    success=$(echo $response | jq -r '.msg // .message // empty')
    
    if [[ "$success" == *"exitosa"* ]] || [[ "$response" == *"respuesta_comercio"* ]]; then
        print_success "Comercio respondió exitosamente"
        echo $response | jq '.'
    else
        print_error "Fallo al responder como comercio"
        echo $response | jq '.' 2>/dev/null || echo $response
    fi
}

# Test 5: Ver todas las reseñas (Admin)
test_admin_get_all_reviews() {
    print_header "TEST 5: Ver Todas las Reseñas (Admin)"
    
    response=$(curl -s "$API_URL/reviews/admin/all?limit=5" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    
    total=$(echo $response | jq -r '.total // empty')
    
    if [ -n "$total" ]; then
        print_success "Admin obtuvo $total reseñas en total"
        echo $response | jq '{total: .total, page: .page, totalPages: .totalPages}'
    else
        print_error "Fallo al obtener reseñas como admin"
        echo $response | jq '.' 2>/dev/null || echo $response
    fi
}

# Test 6: Responder reseña como admin
test_admin_respond() {
    print_header "TEST 6: Responder Reseña (Admin)"
    
    if [ -z "$REVIEW_ID" ]; then
        print_error "No hay review_id disponible para responder"
        return
    fi
    
    response=$(curl -s -X POST "$API_URL/reviews/admin/$REVIEW_ID/respond" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "{
            \"respuesta\": \"Desde administración: Agradecemos tu participación y tu feedback positivo.\"
        }")
    
    success=$(echo $response | jq -r '.msg // .message // empty')
    
    if [[ "$success" == *"exitosa"* ]] || [[ "$response" == *"respuesta_admin"* ]]; then
        print_success "Admin respondió exitosamente"
        echo $response | jq '.'
    else
        print_error "Fallo al responder como admin"
        echo $response | jq '.' 2>/dev/null || echo $response
    fi
}

# Test 7: Toggle visibility (Admin)
test_toggle_visibility() {
    print_header "TEST 7: Toggle Visibilidad de Reseña (Admin)"
    
    if [ -z "$REVIEW_ID" ]; then
        print_error "No hay review_id disponible para toggle"
        return
    fi
    
    # Ocultar reseña
    print_info "Ocultando reseña..."
    response=$(curl -s -X PATCH "$API_URL/reviews/admin/$REVIEW_ID/visibility" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    
    visible=$(echo $response | jq -r '.visible // empty')
    
    if [ "$visible" == "false" ]; then
        print_success "Reseña ocultada exitosamente"
    else
        print_error "Fallo al ocultar reseña"
    fi
    echo $response | jq '.'
    
    sleep 1
    
    # Volver a mostrar reseña
    print_info "Mostrando reseña nuevamente..."
    response=$(curl -s -X PATCH "$API_URL/reviews/admin/$REVIEW_ID/visibility" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    
    visible=$(echo $response | jq -r '.visible // empty')
    
    if [ "$visible" == "true" ]; then
        print_success "Reseña visible nuevamente"
    else
        print_error "Fallo al mostrar reseña"
    fi
    echo $response | jq '.'
}

# Test 8: Actualizar reseña (Owner)
test_update_review() {
    print_header "TEST 8: Actualizar Reseña (Owner)"
    
    if [ -z "$REVIEW_ID" ]; then
        print_error "No hay review_id disponible para actualizar"
        return
    fi
    
    response=$(curl -s -X PUT "$API_URL/reviews/$REVIEW_ID" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $BUYER_TOKEN" \
        -d "{
            \"calificacion\": 4,
            \"comentario\": \"Actualizado: Muy buen producto, pequeñas mejoras posibles. $(date +%s)\",
            \"calidadComida\": 4,
            \"valorPrecio\": 4,
            \"experienciaRecogida\": 5
        }")
    
    success=$(echo $response | jq -r '.msg // .message // empty')
    
    if [[ "$success" == *"actualizada"* ]] || [[ "$response" == *"calificacion"* ]]; then
        print_success "Reseña actualizada exitosamente"
        echo $response | jq '.'
    else
        print_error "Fallo al actualizar reseña"
        echo $response | jq '.' 2>/dev/null || echo $response
    fi
}

# Test 9: Ver reseñas del usuario
test_get_user_reviews() {
    print_header "TEST 9: Ver Mis Reseñas (Usuario)"
    
    response=$(curl -s "$API_URL/reviews/my" \
        -H "Authorization: Bearer $BUYER_TOKEN")
    
    count=$(echo $response | jq '. | length')
    
    if [ "$count" -ge 0 ]; then
        print_success "Usuario obtuvo $count de sus reseñas"
        echo $response | jq '.[:2]' # Mostrar solo las primeras 2
    else
        print_error "Fallo al obtener reseñas del usuario"
        echo $response | jq '.' 2>/dev/null || echo $response
    fi
}

# Test 10: Verificar permisos (intentar responder producto de otro comercio)
test_permissions() {
    print_header "TEST 10: Verificar Permisos (No debe permitir)"
    
    # Obtener una reseña de otro comercio
    response=$(curl -s "$API_URL/reviews/admin/all?limit=50" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    
    other_review_id=$(echo $response | jq -r '.reviews[0].id // empty')
    
    if [ -z "$other_review_id" ]; then
        print_info "No hay reseñas para probar permisos"
        return
    fi
    
    print_info "Intentando responder reseña $other_review_id como comercio (debe fallar si no es suya)..."
    
    response=$(curl -s -X POST "$API_URL/reviews/mystore/$other_review_id/respond" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $COMERCIO_TOKEN" \
        -d "{
            \"respuesta\": \"Esta respuesta no debería permitirse\"
        }")
    
    error=$(echo $response | jq -r '.msg // .message // empty')
    
    if [[ "$error" == *"No tienes permiso"* ]] || [[ "$error" == *"no encontrada"* ]]; then
        print_success "Sistema de permisos funciona correctamente"
        echo $response | jq '.'
    else
        print_info "Respuesta del sistema:"
        echo $response | jq '.' 2>/dev/null || echo $response
    fi
}

# Test 11: Eliminar reseña (Owner)
test_delete_review() {
    print_header "TEST 11: Eliminar Reseña (Owner) - OPCIONAL"
    
    print_info "Este test está comentado para no eliminar la reseña de prueba"
    print_info "Para activarlo, descomenta la sección en el script"
    
    # Descomentar para eliminar:
    # if [ -z "$REVIEW_ID" ]; then
    #     print_error "No hay review_id disponible para eliminar"
    #     return
    # fi
    # 
    # response=$(curl -s -X DELETE "$API_URL/reviews/$REVIEW_ID" \
    #     -H "Authorization: Bearer $BUYER_TOKEN")
    # 
    # success=$(echo $response | jq -r '.msg // .message // empty')
    # 
    # if [[ "$success" == *"eliminada"* ]]; then
    #     print_success "Reseña eliminada exitosamente"
    #     echo $response | jq '.'
    # else
    #     print_error "Fallo al eliminar reseña"
    #     echo $response | jq '.' 2>/dev/null || echo $response
    # fi
}

# Resumen final
print_summary() {
    print_header "RESUMEN DE PRUEBAS"
    
    echo -e "${BLUE}Tokens obtenidos:${NC}"
    echo -e "  Admin: ${GREEN}$([ -n "$ADMIN_TOKEN" ] && echo "✓" || echo "✗")${NC}"
    echo -e "  Comercio: ${GREEN}$([ -n "$COMERCIO_TOKEN" ] && echo "✓" || echo "✗")${NC}"
    echo -e "  Comprador: ${GREEN}$([ -n "$BUYER_TOKEN" ] && echo "✓" || echo "✗")${NC}"
    
    echo -e "\n${BLUE}IDs de prueba:${NC}"
    echo -e "  Producto: ${YELLOW}$PRODUCT_ID${NC}"
    echo -e "  Tienda: ${YELLOW}$STORE_ID${NC}"
    echo -e "  Reseña: ${YELLOW}$REVIEW_ID${NC}"
    
    echo -e "\n${GREEN}Pruebas completadas${NC}"
    echo -e "Revisa los resultados arriba para ver el estado de cada endpoint."
}

# Main execution
main() {
    print_header "INICIANDO PRUEBAS DEL SISTEMA DE RESEÑAS"
    
    # Verificar que jq está instalado
    if ! command -v jq &> /dev/null; then
        print_error "jq no está instalado. Instálalo con: sudo apt install jq"
        exit 1
    fi
    
    # Login de todos los usuarios
    print_header "AUTENTICACIÓN"
    ADMIN_TOKEN=$(login "$ADMIN_EMAIL" "$ADMIN_PASSWORD" "Admin")
    COMERCIO_TOKEN=$(login "$COMERCIO_EMAIL" "$COMERCIO_PASSWORD" "Comercio")
    BUYER_TOKEN=$(login "$BUYER_EMAIL" "$BUYER_PASSWORD" "Comprador")
    
    # Verificar que todos los logins fueron exitosos
    if [ -z "$ADMIN_TOKEN" ] || [ -z "$COMERCIO_TOKEN" ] || [ -z "$BUYER_TOKEN" ]; then
        print_error "Fallo en la autenticación. Verifica las credenciales y que el backend esté corriendo."
        exit 1
    fi
    
    # Obtener producto de prueba
    get_test_product
    
    if [ -z "$PRODUCT_ID" ]; then
        print_error "No se pudo obtener producto de prueba. Verifica que hay productos en la BD."
        exit 1
    fi
    
    # Ejecutar tests
    test_create_review
    sleep 1
    
    test_get_product_reviews
    sleep 1
    
    test_get_my_store_reviews
    sleep 1
    
    test_comercio_respond
    sleep 1
    
    test_admin_get_all_reviews
    sleep 1
    
    test_admin_respond
    sleep 1
    
    test_toggle_visibility
    sleep 1
    
    test_update_review
    sleep 1
    
    test_get_user_reviews
    sleep 1
    
    test_permissions
    sleep 1
    
    test_delete_review
    
    # Resumen
    print_summary
}

# Ejecutar
main
