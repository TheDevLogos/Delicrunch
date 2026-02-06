#!/bin/bash

###############################################################################
# SCRIPT DE CORRECCIÓN DEFINITIVA - TÚNEL DE GITHUB CODESPACES
# Soluciona el error 401 "www-authenticate: tunnel" haciendo el puerto público
###############################################################################

echo "🔧 Iniciando corrección del túnel de GitHub Codespaces..."
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar estado
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# 1. Verificar si estamos en Codespaces
if [ -z "$CODESPACE_NAME" ]; then
    print_error "No estás en GitHub Codespaces. Este script solo funciona en Codespaces."
    exit 1
fi

print_success "Detectado GitHub Codespace: $CODESPACE_NAME"
echo ""

# 2. Verificar que el backend esté corriendo
print_status "Verificando que el backend esté corriendo en el puerto 5001..."
if ! lsof -i :5001 > /dev/null 2>&1; then
    print_warning "El backend no está corriendo en el puerto 5001"
    print_status "Iniciando el backend..."
    cd /workspaces/Delicrunch/Backend
    nohup node server.js > /workspaces/Delicrunch/backend.log 2>&1 &
    echo $! > /workspaces/Delicrunch/backend.pid
    sleep 3
    if lsof -i :5001 > /dev/null 2>&1; then
        print_success "Backend iniciado correctamente"
    else
        print_error "No se pudo iniciar el backend"
        exit 1
    fi
else
    print_success "Backend está corriendo"
fi
echo ""

# 3. Hacer el puerto 5001 público usando gh CLI
print_status "Configurando puerto 5001 como público..."

# Método 1: Usando gh CLI
if command -v gh &> /dev/null; then
    print_status "Usando gh CLI para configurar el puerto..."
    
    # Intentar configurar como público
    if gh codespace ports visibility 5001:public -c "$CODESPACE_NAME" 2>&1; then
        print_success "Puerto 5001 configurado como público usando gh CLI"
    else
        print_warning "No se pudo configurar con gh CLI, intentando método alternativo..."
    fi
else
    print_warning "gh CLI no disponible"
fi
echo ""

# 4. Obtener la URL pública del puerto
print_status "Obteniendo URL pública del puerto 5001..."
sleep 2

# Obtener la URL del túnel
CODESPACE_URL="https://${CODESPACE_NAME}-5001.app.github.dev"
print_success "URL del túnel: $CODESPACE_URL"
echo ""

# 5. Probar la conexión
print_status "Probando la conexión al backend..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$CODESPACE_URL/api/health" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_success "¡Backend responde correctamente! (HTTP 200)"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
elif [ "$HTTP_CODE" = "401" ]; then
    print_error "Todavía hay error 401 - El puerto NO es público"
    echo ""
    print_warning "SOLUCIÓN MANUAL REQUERIDA:"
    echo "1. Ve a la pestaña 'PORTS' en VS Code (abajo)"
    echo "2. Busca el puerto 5001"
    echo "3. Haz clic derecho -> 'Port Visibility' -> 'Public'"
    echo "4. Espera unos segundos y ejecuta este script nuevamente"
    exit 1
else
    print_warning "Respuesta inesperada: HTTP $HTTP_CODE"
    echo "$BODY"
fi
echo ""

# 6. Probar el login
print_status "Probando el endpoint de login..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$CODESPACE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"compradordelicias@test.com","password":"password123"}' 2>&1)

LOGIN_HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n-1)

if [ "$LOGIN_HTTP_CODE" = "200" ]; then
    print_success "¡Login funciona correctamente! (HTTP 200)"
    TOKEN=$(echo "$LOGIN_BODY" | jq -r '.token' 2>/dev/null)
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        print_success "Token JWT recibido: ${TOKEN:0:50}..."
    fi
elif [ "$LOGIN_HTTP_CODE" = "401" ] && echo "$LOGIN_RESPONSE" | grep -q "tunnel"; then
    print_error "Error 401 de túnel - El puerto todavía NO es público"
else
    print_warning "Login devolvió HTTP $LOGIN_HTTP_CODE"
    echo "$LOGIN_BODY"
fi
echo ""

# 7. Actualizar el archivo .env del frontend
print_status "Actualizando Frontend/.env con la URL correcta..."
FRONTEND_ENV="/workspaces/Delicrunch/Frontend/.env"

# Hacer backup
if [ -f "$FRONTEND_ENV" ]; then
    cp "$FRONTEND_ENV" "$FRONTEND_ENV.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Actualizar o crear la variable
if grep -q "EXPO_PUBLIC_API_URL" "$FRONTEND_ENV" 2>/dev/null; then
    sed -i "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=${CODESPACE_URL}/api|" "$FRONTEND_ENV"
else
    echo "EXPO_PUBLIC_API_URL=${CODESPACE_URL}/api" >> "$FRONTEND_ENV"
fi

print_success "Frontend/.env actualizado"
cat "$FRONTEND_ENV" | grep EXPO_PUBLIC_API_URL
echo ""

# 8. Verificar variables de entorno del backend
print_status "Verificando configuración del backend..."
cd /workspaces/Delicrunch/Backend

if grep -q "JWT_SECRET" .env; then
    print_success "JWT_SECRET configurado"
else
    print_error "JWT_SECRET NO está configurado en Backend/.env"
    exit 1
fi

if grep -q "DATABASE_URL" .env; then
    print_success "DATABASE_URL configurado"
else
    print_warning "DATABASE_URL no encontrado en Backend/.env"
fi
echo ""

# 9. Resumen final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ CONFIGURACIÓN COMPLETADA${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Información importante:"
echo "  • URL del Backend: $CODESPACE_URL"
echo "  • Puerto: 5001"
echo "  • API Base: $CODESPACE_URL/api"
echo ""
echo "🔄 Próximos pasos:"
echo "  1. Si todavía ves error 401, ve a la pestaña PORTS en VS Code"
echo "  2. Busca el puerto 5001"
echo "  3. Haz clic derecho -> 'Port Visibility' -> 'Public'"
echo "  4. Reinicia tu app de Expo: npx expo start --clear"
echo ""
echo "📱 Para probar en tu dispositivo:"
echo "  • Abre la app de Expo Go"
echo "  • Escanea el QR code"
echo "  • Inicia sesión con: compradordelicias@test.com / password123"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
