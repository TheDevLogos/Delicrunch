#!/bin/bash

# Script para verificar configuración de Render y obtener información del deployment
# Este script te ayuda a verificar que todo esté configurado correctamente

set -e

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  $1${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_header "VERIFICACIÓN DE CONFIGURACIÓN PARA RENDER"

# =============================================
# 1. VERIFICAR ARCHIVOS LOCALES
# =============================================
print_header "1. VERIFICACIÓN DE ARCHIVOS LOCALES"

# Verificar que exista Backend/package.json
if [ -f "Backend/package.json" ]; then
    print_success "Backend/package.json encontrado"
    echo "   Scripts disponibles:"
    cat Backend/package.json | jq -r '.scripts | to_entries[] | "   - \(.key): \(.value)"' 2>/dev/null || echo "   (no se pudo parsear)"
else
    print_error "Backend/package.json NO encontrado"
fi

# Verificar que exista Backend/server.js
if [ -f "Backend/server.js" ]; then
    print_success "Backend/server.js encontrado"
    PORT=$(grep "PORT.*process.env.PORT" Backend/server.js | head -1)
    echo "   Puerto configurado: $PORT"
else
    print_error "Backend/server.js NO encontrado"
fi

# Verificar db/index.js
if [ -f "Backend/db/index.js" ]; then
    print_success "Backend/db/index.js encontrado (configuración de Supabase)"
else
    print_error "Backend/db/index.js NO encontrado"
fi

# =============================================
# 2. VERIFICAR VARIABLES DE ENTORNO LOCALES
# =============================================
print_header "2. VARIABLES DE ENTORNO NECESARIAS PARA RENDER"

echo "Las siguientes variables deben estar configuradas en Render:"
echo ""

cat << 'EOF'
┌─────────────────────────────────────────────────────────────┐
│ VARIABLES CRÍTICAS DEL BACKEND                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 🗄️  BASE DE DATOS (SUPABASE):                               │
│   DB_USER=postgres.pruesizqytpscldieivb                     │
│   DB_HOST=aws-0-us-west-2.pooler.supabase.com              │
│   DB_DATABASE=postgres                                       │
│   DB_PASSWORD=bfOJpzZtcoGhAJdP                              │
│   DB_PORT=5432                                               │
│                                                              │
│ 🔑 SUPABASE API:                                             │
│   SUPABASE_URL=https://pruesizqytpscldieivb.supabase.co    │
│   SUPABASE_ANON_KEY=sb_publishable_iIRMgAQGgWka6eYNPN9i6w...│
│   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...      │
│                                                              │
│ 🔐 JWT:                                                      │
│   JWT_SECRET=un_secreto_secretoso_jamas_contado1234        │
│                                                              │
│ 💳 MERCADO PAGO:                                             │
│   MERCADOPAGO_PUBLIC_KEY=APP_USR-375e7726-8315...          │
│   MERCADOPAGO_ACCESS_TOKEN=APP_USR-7758657589560258...     │
│                                                              │
│ 📧 EMAIL:                                                    │
│   EMAIL_HOST=smtp.gmail.com                                 │
│   EMAIL_PORT=465                                             │
│   EMAIL_USER=implanibot@gmail.com                           │
│   EMAIL_PASS=qfjz gfrv qswq blss                           │
│                                                              │
│ 🌐 URLs:                                                     │
│   FRONTEND_URL=delicrunch://                                │
│   APP_SCHEME=delicrunch                                      │
│   BACKEND_URL=https://tu-backend.onrender.com               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
EOF

echo ""

# =============================================
# 3. VERIFICAR CONFIGURACIÓN DE SUPABASE
# =============================================
print_header "3. CONFIGURACIÓN DE SUPABASE"

cat << 'EOF'
✅ CONFIGURACIÓN RECOMENDADA:

Puerto: 5432 (Session Pooler)
Host: aws-0-us-west-2.pooler.supabase.com
SSL: Habilitado (rejectUnauthorized: false)
Connection Mode: Session (no Transaction)

Razón: Render es un servidor persistente, no serverless.
       Session mode es mejor para conexiones de larga duración.

EOF

# =============================================
# 4. COMANDOS DE BUILD PARA RENDER
# =============================================
print_header "4. COMANDOS PARA CONFIGURAR EN RENDER"

echo ""
echo "📦 BACKEND Web Service:"
echo "────────────────────────────────────────────────────────"
echo ""
print_info "Build Command:"
echo "   cd Backend && npm ci"
echo ""
print_info "Start Command:"
echo "   cd Backend && npm start"
echo ""
print_info "Environment Variables:"
echo "   (Ver sección 2 arriba para la lista completa)"
echo ""
echo "────────────────────────────────────────────────────────"
echo ""

# =============================================
# 5. VERIFICAR CONECTIVIDAD
# =============================================
print_header "5. PRUEBA DE CONECTIVIDAD LOCAL"

if [ -f "Backend/.env" ]; then
    print_success "Archivo Backend/.env encontrado"
    
    # Verificar variables críticas (sin mostrar valores completos)
    if grep -q "SUPABASE_URL" Backend/.env; then
        print_success "SUPABASE_URL configurado"
    else
        print_warning "SUPABASE_URL NO encontrado en .env"
    fi
    
    if grep -q "DB_HOST" Backend/.env; then
        print_success "DB_HOST configurado"
    else
        print_warning "DB_HOST NO encontrado en .env"
    fi
    
    if grep -q "JWT_SECRET" Backend/.env; then
        print_success "JWT_SECRET configurado"
    else
        print_warning "JWT_SECRET NO encontrado en .env"
    fi
else
    print_warning "Backend/.env NO encontrado (solo necesario para desarrollo local)"
fi

# =============================================
# 6. CHECKLIST FINAL
# =============================================
print_header "CHECKLIST PARA DEPLOYMENT EN RENDER"

echo ""
echo "Antes de probar el backend en Render, verifica:"
echo ""
echo "  ☐ 1. Has creado el Web Service en Render"
echo "  ☐ 2. Has configurado TODAS las variables de entorno"
echo "  ☐ 3. El Build Command es: cd Backend && npm ci"
echo "  ☐ 4. El Start Command es: cd Backend && npm start"
echo "  ☐ 5. El deployment completó exitosamente"
echo "  ☐ 6. Tienes la URL del servicio (ej: https://tu-app.onrender.com)"
echo ""

# =============================================
# 7. SIGUIENTE PASO
# =============================================
print_header "SIGUIENTE PASO"

echo ""
print_info "Una vez que tu backend esté desplegado en Render, ejecuta:"
echo ""
echo "   ./test-render-backend.sh https://tu-backend.onrender.com"
echo ""
print_success "Este script verificará que todo funcione correctamente"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo ""
print_info "¿Necesitas la URL de tu backend en Render?"
echo "   1. Ve a https://dashboard.render.com"
echo "   2. Selecciona tu servicio de backend"
echo "   3. Copia la URL que aparece en la parte superior"
echo "   4. Ejecuta: ./test-render-backend.sh <URL_COPIADA>"
echo ""
