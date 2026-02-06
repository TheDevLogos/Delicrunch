#!/bin/bash

# Script interactivo para verificar backend en Render antes de EAS Build
# Guía paso a paso

set -e

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

clear

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                           ║${NC}"
echo -e "${CYAN}║       ${BOLD}🚀 VERIFICACIÓN DE BACKEND EN RENDER${NC}${CYAN}           ║${NC}"
echo -e "${CYAN}║                                                           ║${NC}"
echo -e "${CYAN}║       Antes de generar tu EAS Dev Build                  ║${NC}"
echo -e "${CYAN}║                                                           ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Función para preguntar
ask() {
    echo -e "${BLUE}❓ $1${NC}"
    read -r response
    echo "$response"
}

# Función para continuar
press_enter() {
    echo ""
    echo -e "${YELLOW}Presiona ENTER para continuar...${NC}"
    read -r
}

# Función para mostrar éxito
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Función para mostrar error
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Función para mostrar info
info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Función para mostrar warning
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# =============================================
# PASO 1: Verificar que el usuario tenga la URL
# =============================================

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  PASO 1: Obtener la URL de tu Backend en Render${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""

info "Para continuar, necesitas la URL de tu backend desplegado en Render."
echo ""
echo "¿Dónde encontrarla?"
echo "  1. Ve a https://dashboard.render.com"
echo "  2. Busca tu servicio de backend"
echo "  3. Copia la URL completa que aparece en la parte superior"
echo ""
echo "Ejemplo: ${GREEN}https://delicrunch-backend-abc123.onrender.com${NC}"
echo ""

press_enter

# Preguntar por la URL
echo ""
RENDER_URL=$(ask "Pega aquí la URL de tu backend en Render:")

# Validar que se proporcionó una URL
if [ -z "$RENDER_URL" ]; then
    error "No se proporcionó ninguna URL"
    exit 1
fi

# Limpiar la URL (remover trailing slash)
RENDER_URL="${RENDER_URL%/}"

# Validar formato básico
if [[ ! "$RENDER_URL" =~ ^https?:// ]]; then
    error "La URL debe comenzar con http:// o https://"
    exit 1
fi

success "URL recibida: $RENDER_URL"
echo ""

# =============================================
# PASO 2: Verificar conectividad básica
# =============================================

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  PASO 2: Verificando Conectividad Básica${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""

info "Probando si el backend está accesible..."
echo ""

# Probar endpoint raíz
if response=$(curl -s --max-time 10 "$RENDER_URL/" 2>&1); then
    if echo "$response" | jq empty 2>/dev/null; then
        success "¡Backend accesible! ✨"
        echo ""
        echo "Respuesta del servidor:"
        echo "$response" | jq '.'
    else
        warning "Backend responde pero no es JSON válido"
        echo "Respuesta: $response"
    fi
else
    error "¡No se pudo conectar al backend!"
    echo ""
    echo "Posibles razones:"
    echo "  - El servicio no está ejecutándose (verifica el dashboard de Render)"
    echo "  - La URL es incorrecta"
    echo "  - El servicio falló al iniciar (revisa los logs)"
    echo ""
    
    warning "¿Quieres continuar de todas formas? (s/n)"
    read -r continue_response
    if [[ ! "$continue_response" =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

press_enter

# =============================================
# PASO 3: Ejecutar pruebas completas
# =============================================

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  PASO 3: Ejecutando Pruebas Completas${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""

info "Ahora ejecutaremos todas las pruebas de endpoints..."
echo ""
echo "Esto incluye:"
echo "  ✓ Health checks"
echo "  ✓ Endpoints de autenticación"
echo "  ✓ Endpoints de tiendas y productos"
echo "  ✓ Verificación de conexión con Supabase"
echo ""

press_enter

# Ejecutar el script de pruebas
echo ""
if ./test-render-backend.sh "$RENDER_URL"; then
    TEST_RESULT="pass"
else
    TEST_RESULT="fail"
fi

echo ""
press_enter

# =============================================
# PASO 4: Análisis de Resultados
# =============================================

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  PASO 4: Análisis de Resultados${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""

if [ "$TEST_RESULT" = "pass" ]; then
    success "¡TODAS LAS PRUEBAS PASARON! 🎉"
    echo ""
    info "Tu backend está funcionando correctamente y conectado con Supabase"
    echo ""
else
    error "ALGUNAS PRUEBAS FALLARON"
    echo ""
    warning "Necesitas resolver los problemas antes de continuar con el EAS Build"
    echo ""
    echo "Pasos recomendados:"
    echo "  1. Revisa los logs de Render (Dashboard → Logs)"
    echo "  2. Verifica las variables de entorno"
    echo "  3. Ejecuta pruebas específicas:"
    echo "     ./test-render-endpoints.sh $RENDER_URL database"
    echo "     ./test-render-endpoints.sh $RENDER_URL stores"
    echo ""
    
    warning "¿Quieres continuar de todas formas? (s/n)"
    read -r continue_response
    if [[ ! "$continue_response" =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

press_enter

# =============================================
# PASO 5: Configuración para EAS Build
# =============================================

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  PASO 5: Configuración para EAS Build${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""

API_URL="${RENDER_URL}/api"

info "Para tu EAS Build, necesitas configurar:"
echo ""
echo -e "${GREEN}EXPO_PUBLIC_API_URL=${API_URL}${NC}"
echo ""
echo "¿Dónde configurarlo?"
echo ""
echo "Opción 1: En Frontend/app.json:"
echo -e "${CYAN}"
cat << EOF
{
  "expo": {
    "extra": {
      "EXPO_PUBLIC_API_URL": "${API_URL}"
    }
  }
}
EOF
echo -e "${NC}"
echo ""
echo "Opción 2: En Frontend/.env:"
echo -e "${CYAN}EXPO_PUBLIC_API_URL=${API_URL}${NC}"
echo ""

# Preguntar si quiere que actualicemos automáticamente
warning "¿Quieres que actualice automáticamente tu .env? (s/n)"
read -r update_env

if [[ "$update_env" =~ ^[Ss]$ ]]; then
    if [ -f "Frontend/.env" ]; then
        # Actualizar o agregar la variable
        if grep -q "EXPO_PUBLIC_API_URL" Frontend/.env; then
            sed -i "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=${API_URL}|" Frontend/.env
            success "Variable EXPO_PUBLIC_API_URL actualizada en Frontend/.env"
        else
            echo "EXPO_PUBLIC_API_URL=${API_URL}" >> Frontend/.env
            success "Variable EXPO_PUBLIC_API_URL agregada a Frontend/.env"
        fi
    else
        echo "EXPO_PUBLIC_API_URL=${API_URL}" > Frontend/.env
        success "Archivo Frontend/.env creado con la variable"
    fi
fi

press_enter

# =============================================
# PASO 6: Próximos Pasos
# =============================================

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  PASO 6: Próximos Pasos${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""

if [ "$TEST_RESULT" = "pass" ]; then
    success "¡Todo listo para generar tu EAS Dev Build! 🚀"
    echo ""
    echo "Comandos para ejecutar:"
    echo ""
    echo -e "${GREEN}cd Frontend${NC}"
    echo ""
    echo "Para Android:"
    echo -e "${CYAN}eas build --profile development --platform android${NC}"
    echo ""
    echo "Para iOS (si tienes cuenta de Apple Developer):"
    echo -e "${CYAN}eas build --profile development --platform ios${NC}"
    echo ""
    echo "Para ambas plataformas:"
    echo -e "${CYAN}eas build --profile development --platform all${NC}"
    echo ""
else
    warning "Antes de continuar con EAS Build:"
    echo ""
    echo "1. Resuelve los problemas identificados"
    echo "2. Vuelve a ejecutar: $0"
    echo "3. Asegúrate de que todas las pruebas pasen"
    echo ""
fi

# =============================================
# Resumen Final
# =============================================

echo ""
echo -e "${BOLD}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║                    RESUMEN FINAL                          ║${NC}"
echo -e "${BOLD}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Backend URL:        $RENDER_URL"
echo "API URL para app:   $API_URL"
echo "Estado de pruebas:  $([ "$TEST_RESULT" = "pass" ] && echo -e "${GREEN}✅ PASARON${NC}" || echo -e "${RED}❌ FALLARON${NC}")"
echo ""

if [ "$TEST_RESULT" = "pass" ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}║          🎉 ¡LISTO PARA EAS DEV BUILD! 🎉                ║${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
else
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║                                                           ║${NC}"
    echo -e "${YELLOW}║         ⚠️  REVISA LOS ERRORES PRIMERO ⚠️                ║${NC}"
    echo -e "${YELLOW}║                                                           ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════╝${NC}"
fi

echo ""
