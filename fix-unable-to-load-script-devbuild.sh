#!/usr/bin/env bash
# ============================================================================
# 🔧 DELICRUNCH - Fix "Unable to load script" en Development Build
# ============================================================================
# Este script corrige el error común: "java.lang.RuntimeException: Unable to load script"
# en Expo Development Build
# ============================================================================

set -e

ROOT="/workspaces/Delicrunch"
cd "$ROOT"

# ═══════════════════════════════════════════════════════════════════════════
# COLORES
# ═══════════════════════════════════════════════════════════════════════════
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log_info() { echo -e "${CYAN}ℹ ${NC}$1"; }
log_success() { echo -e "${GREEN}✓ ${NC}$1"; }
log_warning() { echo -e "${YELLOW}⚠ ${NC}$1"; }
log_error() { echo -e "${RED}✗ ${NC}$1"; }
log_step() { echo -e "\n${MAGENTA}━━━ $1 ━━━${NC}"; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}      🔧 ${BOLD}Reparando 'Unable to load script'${NC}                   ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PASO 1: VERIFICAR ENTORNO
# ═══════════════════════════════════════════════════════════════════════════
log_step "PASO 1/7: Verificando entorno"

if [ -z "$CODESPACE_NAME" ]; then
  log_error "Este script está diseñado para GitHub Codespaces"
  exit 1
fi

log_success "GitHub Codespaces detectado"
CODESPACE_URL="${CODESPACE_NAME}-8081.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
log_info "Codespace URL: $CODESPACE_URL"

# ═══════════════════════════════════════════════════════════════════════════
# PASO 2: DETENER EXPO
# ═══════════════════════════════════════════════════════════════════════════
log_step "PASO 2/7: Deteniendo Expo actual"

pkill -f "expo start" 2>/dev/null || true
pkill -f "react-native start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
rm -f "$ROOT/scripts/expo.pid" 2>/dev/null || true

sleep 2
log_success "Procesos de Expo detenidos"

# ═══════════════════════════════════════════════════════════════════════════
# PASO 3: LIMPIAR CACHÉS
# ═══════════════════════════════════════════════════════════════════════════
log_step "PASO 3/7: Limpiando cachés"

cd "$ROOT/Frontend"

log_info "Limpiando caché de Expo..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

log_info "Limpiando caché de Metro Bundler..."
rm -rf .metro 2>/dev/null || true
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-map-* 2>/dev/null || true
rm -rf /tmp/react-native-* 2>/dev/null || true

log_info "Limpiando watchman (si existe)..."
watchman watch-del-all 2>/dev/null || true

log_success "Cachés limpiados"

# ═══════════════════════════════════════════════════════════════════════════
# PASO 4: CONFIGURAR PUERTOS PÚBLICOS
# ═══════════════════════════════════════════════════════════════════════════
log_step "PASO 4/7: Configurando puertos como públicos"

PORTS=(5001 8081 8082)

for PORT in "${PORTS[@]}"; do
  log_info "Configurando puerto $PORT como público..."
  gh codespace ports visibility $PORT:public -c "$CODESPACE_NAME" 2>&1 | grep -v "already" || true
done

log_success "Puertos configurados"

# Verificar acceso público
sleep 2
PUBLIC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${CODESPACE_URL}/status" 2>/dev/null || echo "000")
if [ "$PUBLIC_STATUS" = "200" ] || [ "$PUBLIC_STATUS" = "404" ]; then
  log_success "Puerto 8081 es accesible públicamente"
else
  log_warning "Puerto 8081 respondió HTTP $PUBLIC_STATUS (puede necesitar configuración manual)"
fi

# ═══════════════════════════════════════════════════════════════════════════
# PASO 5: CONFIGURAR VARIABLES DE ENTORNO
# ═══════════════════════════════════════════════════════════════════════════
log_step "PASO 5/7: Configurando variables de entorno"

# URL del backend
BACKEND_URL="https://${CODESPACE_NAME}-5001.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"

# Crear/actualizar .env
cat > "$ROOT/Frontend/.env" << EOF
# Configuración generada automáticamente - $(date)
# Para Development Build con GitHub Codespaces

EXPO_PUBLIC_API_URL=${BACKEND_URL}

# Stripe Configuration
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SRRYk8hoiRFdhGtFHnTJRVAPniX7lh6esuxdNc13Xw7GK3njphOGYTQ8An7HJSdcTxjeVMi2tULPp6DqKugVbDT00PMJuLLkJ

# Metro Bundler Configuration
REACT_NATIVE_PACKAGER_HOSTNAME=${CODESPACE_URL}
EOF

log_success ".env actualizado"
log_info "Backend URL: $BACKEND_URL"

# Exportar variables para el proceso actual
export EXPO_PUBLIC_API_URL="${BACKEND_URL}"
export REACT_NATIVE_PACKAGER_HOSTNAME="${CODESPACE_URL}"
export EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51SRRYk8hoiRFdhGtFHnTJRVAPniX7lh6esuxdNc13Xw7GK3njphOGYTQ8An7HJSdcTxjeVMi2tULPp6DqKugVbDT00PMJuLLkJ"

# ═══════════════════════════════════════════════════════════════════════════
# PASO 6: INICIAR EXPO CON CONFIGURACIÓN CORRECTA
# ═══════════════════════════════════════════════════════════════════════════
log_step "PASO 6/7: Iniciando Expo con configuración correcta"

cd "$ROOT/Frontend"

log_info "Instalando dependencias..."
npm install --silent 2>/dev/null || npm install

log_info "Iniciando Expo Dev Server..."
log_info "Esto tomará 15-20 segundos..."

# Iniciar Expo con las opciones correctas para Development Build
nohup npx expo start \
  --dev-client \
  --clear \
  --host tunnel \
  > "$ROOT/frontend.log" 2>&1 &

EXPO_PID=$!
echo $EXPO_PID > "$ROOT/scripts/expo.pid"

log_info "Expo iniciado (PID: $EXPO_PID)"

# Esperar a que Metro esté listo
log_info "Esperando a que Metro Bundler esté listo..."
for i in {1..30}; do
  if curl -s http://localhost:8081/status 2>/dev/null | grep -q "running"; then
    log_success "Metro Bundler está listo"
    break
  fi
  echo -n "."
  sleep 1
  if [ $i -eq 30 ]; then
    log_error "Metro Bundler no respondió después de 30 segundos"
    log_info "Ver logs: tail -f $ROOT/frontend.log"
    exit 1
  fi
done

sleep 5

# ═══════════════════════════════════════════════════════════════════════════
# PASO 7: GENERAR URL Y QR
# ═══════════════════════════════════════════════════════════════════════════
log_step "PASO 7/7: Generando información de conexión"

# Intentar obtener la URL del tunnel de Expo
TUNNEL_URL=$(grep -oP 'exp://[\w\-\.]+' "$ROOT/frontend.log" 2>/dev/null | head -1 || echo "")

if [ -z "$TUNNEL_URL" ]; then
  # Fallback a la URL de Codespaces
  TUNNEL_URL="exp://${CODESPACE_URL}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}              ✅ REPARACIÓN COMPLETADA                          ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${BOLD}📱 URL de Conexión:${NC}"
echo -e "   ${CYAN}${TUNNEL_URL}${NC}"
echo ""

# Generar QR si está disponible
if command -v qrencode &> /dev/null; then
  echo -e "${BOLD}📱 Escanea este QR desde tu Development Build:${NC}"
  echo ""
  qrencode -t ANSIUTF8 "$TUNNEL_URL"
  echo ""
else
  log_info "Para generar QR, visita: https://qr.io"
  log_info "Y pega esta URL: $TUNNEL_URL"
  echo ""
fi

echo -e "${BOLD}🔧 SOLUCIONES AL ERROR 'Unable to load script':${NC}"
echo ""
echo -e "${CYAN}1. CONEXIÓN MANUAL:${NC}"
echo -e "   - Abre tu app Delicrunch (Development Build)"
echo -e "   - Agita el dispositivo para abrir el menú de desarrollo"
echo -e "   - Selecciona ${GREEN}'Configure Bundler'${NC} o ${GREEN}'Enter URL manually'${NC}"
echo -e "   - Ingresa: ${CYAN}${CODESPACE_URL}${NC}"
echo -e "   - Presiona ${GREEN}'Reload'${NC}"
echo ""

echo -e "${CYAN}2. SI SIGUE FALLANDO - Reconectar:${NC}"
echo -e "   - Cierra completamente la app Delicrunch"
echo -e "   - Vuelve a abrirla"
echo -e "   - Escanea el QR de arriba o ingresa la URL manualmente"
echo ""

echo -e "${CYAN}3. VERIFICAR CONECTIVIDAD:${NC}"
echo -e "   - Asegúrate de tener conexión a internet estable"
echo -e "   - Verifica que los puertos sean públicos en la pestaña PORTS"
echo ""

echo -e "${CYAN}4. SI EL PROBLEMA PERSISTE - Rebuild:${NC}"
echo -e "   Es posible que necesites crear un nuevo Development Build:"
echo -e "   ${YELLOW}cd Frontend && npx eas build --platform android --profile development${NC}"
echo ""

echo -e "${BOLD}📋 Información del Sistema:${NC}"
echo -e "   Metro Bundler:  http://localhost:8081"
echo -e "   Backend Local:  http://localhost:5001"
echo -e "   Backend Público: $BACKEND_URL"
echo -e "   Expo URL:       $TUNNEL_URL"
echo ""

echo -e "${BOLD}📺 Ver logs en tiempo real:${NC}"
echo -e "   ${CYAN}tail -f $ROOT/frontend.log${NC}"
echo ""

echo -e "${BOLD}🛑 Para detener:${NC}"
echo -e "   ${CYAN}kill $EXPO_PID${NC}"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

log_success "Script completado. Intenta conectar tu Development Build ahora."
echo ""
