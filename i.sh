#!/usr/bin/env bash
# ============================================================================
# 🥐 DELICRUNCH - Script de Desarrollo con Expo Development Build
# ============================================================================
# Este script inicia todo el entorno de desarrollo para usar con Development
# Build (NO Expo Go). Incluye: PostgreSQL, Backend, y Expo Dev Server.
#
# USO:
#   ./start-expo-dev-build.sh           # Iniciar todo
#   ./start-expo-dev-build.sh --clean   # Limpiar caché antes de iniciar
#   ./start-expo-dev-build.sh --build   # Solo mostrar comandos de build
# ============================================================================
set -e

ROOT=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT"

# ═══════════════════════════════════════════════════════════════════════════
# COLORES Y UTILIDADES
# ═══════════════════════════════════════════════════════════════════════════
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

log_info() { echo -e "${CYAN}ℹ ${NC}$1"; }
log_success() { echo -e "${GREEN}✓ ${NC}$1"; }
log_warning() { echo -e "${YELLOW}⚠ ${NC}$1"; }
log_error() { echo -e "${RED}✗ ${NC}$1"; }
log_step() { echo -e "\n${MAGENTA}━━━ $1 ━━━${NC}"; }

banner() {
  echo ""
  echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC}      🥐  ${BOLD}DELICRUNCH - Expo Development Build${NC}  🥐              ${BLUE}║${NC}"
  echo -e "${BLUE}║${NC}          ${CYAN}React Native + Stripe SDK Nativo${NC}                     ${BLUE}║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

# ═══════════════════════════════════════════════════════════════════════════
# MANEJO DE ARGUMENTOS
# ═══════════════════════════════════════════════════════════════════════════
CLEAN_CACHE=false
BUILD_ONLY=false

for arg in "$@"; do
  case $arg in
    --clean)
      CLEAN_CACHE=true
      ;;
    --build)
      BUILD_ONLY=true
      ;;
    --help|-h)
      echo "Uso: $0 [opciones]"
      echo ""
      echo "Opciones:"
      echo "  --clean    Limpiar caché antes de iniciar"
      echo "  --build    Solo mostrar comandos de build"
      echo "  --help     Mostrar esta ayuda"
      exit 0
      ;;
  esac
done

# ═══════════════════════════════════════════════════════════════════════════
# FUNCIÓN PARA LIMPIAR PROCESOS
# ═══════════════════════════════════════════════════════════════════════════
cleanup() {
  echo -e "\n${YELLOW}🧹 Limpiando procesos...${NC}"
  
  # Matar procesos por PID
  [ -f "$ROOT/Backend/server.pid" ] && kill $(cat "$ROOT/Backend/server.pid") 2>/dev/null && rm -f "$ROOT/Backend/server.pid" || true
  [ -f "$ROOT/scripts/expo.pid" ] && kill $(cat "$ROOT/scripts/expo.pid") 2>/dev/null && rm -f "$ROOT/scripts/expo.pid" || true
  [ -f "/tmp/lt.pid" ] && kill $(cat "/tmp/lt.pid") 2>/dev/null && rm -f "/tmp/lt.pid" || true
  
  # Matar procesos por nombre
  pkill -f "node server.js" 2>/dev/null || true
  pkill -f "expo start" 2>/dev/null || true
  pkill -f "localtunnel" 2>/dev/null || true
  
  log_success "Limpieza completada"
}

trap cleanup EXIT

# ═══════════════════════════════════════════════════════════════════════════
# SI SOLO SE PIDE INFO DE BUILD
# ═══════════════════════════════════════════════════════════════════════════
if [ "$BUILD_ONLY" = true ]; then
  banner
  echo -e "${BOLD}📱 COMANDOS PARA CREAR DEVELOPMENT BUILD:${NC}\n"
  
  echo -e "${CYAN}1. Configurar EAS (primera vez):${NC}"
  echo "   cd Frontend && npx eas-cli login"
  echo ""
  
  echo -e "${CYAN}2. Build para Android (APK):${NC}"
  echo "   cd Frontend && npx eas build --platform android --profile development"
  echo ""
  
  echo -e "${CYAN}3. Build para iOS (Simulator):${NC}"
  echo "   cd Frontend && npx eas build --platform ios --profile development"
  echo ""
  
  echo -e "${CYAN}4. Build para ambas plataformas:${NC}"
  echo "   cd Frontend && npx eas build --platform all --profile development"
  echo ""
  
  echo -e "${CYAN}5. Build local (sin EAS Cloud):${NC}"
  echo "   cd Frontend && npx expo prebuild --clean"
  echo "   cd Frontend/android && ./gradlew assembleDebug"
  echo ""
  
  echo -e "${YELLOW}Nota: Después del build, descarga el APK/IPA e instálalo en tu dispositivo.${NC}"
  exit 0
fi

# ═══════════════════════════════════════════════════════════════════════════
# INICIO DEL SCRIPT PRINCIPAL
# ═══════════════════════════════════════════════════════════════════════════
banner

# Limpiar procesos previos
log_step "PASO 1/6: Limpiando procesos anteriores"
cleanup
docker compose down 2>/dev/null || true
sleep 1

# ═══════════════════════════════════════════════════════════════════════════
# PASO 2: INICIAR POSTGRESQL
# ═══════════════════════════════════════════════════════════════════════════
log_step "PASO 2/6: Iniciando PostgreSQL"

docker compose up -d postgres
log_info "Esperando que PostgreSQL esté listo..."

for i in {1..30}; do
  if docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
    log_success "PostgreSQL listo"
    break
  fi
  echo -n "."
  sleep 1
  if [ $i -eq 30 ]; then
    log_error "PostgreSQL no respondió después de 30 segundos"
    exit 1
  fi
done

# ═══════════════════════════════════════════════════════════════════════════
# PASO 3: CONFIGURAR BASE DE DATOS
# ═══════════════════════════════════════════════════════════════════════════
log_step "PASO 3/6: Configurando base de datos"

cd "$ROOT/Backend"
npm install --silent 2>/dev/null || npm install

# Ejecutar migraciones y un seed seguro (NO destructivo)
# Nota: Para desarrollo local solo ejecutamos migraciones y un seed fijo
# que NO crea usuarios ni productos masivos. Esto evita duplicados.
declare -a DB_SCRIPTS=(
  "db/migrate.js"
  "db/seed-fixed-stores.js"
)

for script in "${DB_SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    # Ejecutar scripts mostrando salida mínima; se asume que son seguros
    node "$script" 2>/dev/null && log_success "$script" || log_warning "$script (ejecución con advertencia)"
  else
    log_warning "Script no encontrado: $script"
  fi
done

# ═══════════════════════════════════════════════════════════════════════════
# PASO 4: INICIAR BACKEND
# ═══════════════════════════════════════════════════════════════════════════
log_step "PASO 4/6: Iniciando Backend (puerto 5001)"

cd "$ROOT/Backend"
PORT=5001 node server.js > "$ROOT/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$ROOT/Backend/server.pid"

log_info "Esperando que el Backend responda..."
for i in {1..20}; do
  if curl -s http://localhost:5001/ >/dev/null 2>&1; then
    log_success "Backend listo (PID: $BACKEND_PID)"
    break
  fi
  echo -n "."
  sleep 1
  if [ $i -eq 20 ]; then
    log_error "Backend no respondió. Ver: tail -f $ROOT/backend.log"
    exit 1
  fi
done

# ═══════════════════════════════════════════════════════════════════════════
# PASO 5: CONFIGURAR URL PÚBLICA
# ═══════════════════════════════════════════════════════════════════════════
log_step "PASO 5/6: Configurando URL pública del Backend"

TUNNEL_URL=""

# Opción 1: GitHub Codespaces
if [ -n "$CODESPACE_NAME" ] && [ -n "$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN" ]; then
  TUNNEL_URL="https://${CODESPACE_NAME}-5001.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
  log_success "Usando Codespaces URL"
  
  # Hacer el puerto público
  gh codespace ports visibility 5001:public -c "$CODESPACE_NAME" 2>/dev/null && \
    log_success "Puerto 5001 configurado como público" || \
    log_warning "Configura manualmente: Ports → 5001 → Public"

# Opción 2: Localtunnel
else
  log_info "Creando túnel con localtunnel..."
  npx --yes localtunnel --port 5001 > /tmp/lt.log 2>&1 &
  LT_PID=$!
  echo $LT_PID > /tmp/lt.pid

  for i in {1..25}; do
    TUNNEL_URL=$(grep -oE 'https://[a-z0-9-]+\.loca\.lt' /tmp/lt.log 2>/dev/null | head -1)
    if [ -n "$TUNNEL_URL" ]; then
      log_success "Túnel creado: ${TUNNEL_URL}"
      break
    fi
    echo -n "."
    sleep 1
    if [ $i -eq 25 ]; then
      log_warning "No se pudo crear túnel, usando localhost"
      TUNNEL_URL="http://localhost:5001"
    fi
  done
fi

echo ""
log_info "URL del Backend: ${TUNNEL_URL}"

# ═══════════════════════════════════════════════════════════════════════════
# PASO 6: CONFIGURAR E INICIAR EXPO
# ═══════════════════════════════════════════════════════════════════════════
log_step "PASO 6/6: Configurando e iniciando Expo Dev Server"

cd "$ROOT/Frontend"
npm install --silent 2>/dev/null || npm install

# Actualizar .env con la URL del túnel
cat > "$ROOT/Frontend/.env" << EOF
# Configuración generada automáticamente - $(date)
EXPO_PUBLIC_API_URL=${TUNNEL_URL}

# Stripe Configuration
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SRRYk8hoiRFdhGtFHnTJRVAPniX7lh6esuxdNc13Xw7GK3njphOGYTQ8An7HJSdcTxjeVMi2tULPp6DqKugVbDT00PMJuLLkJ
EOF

log_success ".env actualizado con API URL: ${TUNNEL_URL}"

# Exportar variable de entorno
export EXPO_PUBLIC_API_URL="${TUNNEL_URL}"
export EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51SRRYk8hoiRFdhGtFHnTJRVAPniX7lh6esuxdNc13Xw7GK3njphOGYTQ8An7HJSdcTxjeVMi2tULPp6DqKugVbDT00PMJuLLkJ"

# Limpiar caché si se solicita
if [ "$CLEAN_CACHE" = true ]; then
  log_info "Limpiando caché de Expo..."
  rm -rf .expo node_modules/.cache 2>/dev/null || true
  npx expo start --clear --dev-client --tunnel &
else
  npx expo start --dev-client --tunnel &
fi

EXPO_PID=$!
echo $EXPO_PID > "$ROOT/scripts/expo.pid"

sleep 8

# ═══════════════════════════════════════════════════════════════════════════
# VERIFICACIONES
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}              🔍 VERIFICACIÓN DE SERVICIOS                      ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Verificar Backend local
if curl -s http://localhost:5001/ | grep -q "Delicrunch"; then
  log_success "Backend local: http://localhost:5001"
else
  log_error "Backend local no responde"
fi

# Verificar túnel
TUNNEL_RESP=$(curl -s -o /dev/null -w "%{http_code}" "${TUNNEL_URL}/" 2>/dev/null || echo "000")
if [ "$TUNNEL_RESP" = "200" ]; then
  log_success "Backend túnel: ${TUNNEL_URL}"
else
  log_warning "Túnel respondió HTTP ${TUNNEL_RESP}"
fi

# Verificar login
LOGIN_RESP=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"comprador@delicrunch.com","password":"Comprador123"}' 2>/dev/null)

if echo "$LOGIN_RESP" | grep -q '"token"'; then
  log_success "Sistema de autenticación funcionando"
else
  log_warning "Login de prueba falló"
fi

# ═══════════════════════════════════════════════════════════════════════════
# RESUMEN FINAL
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}              🎉 ENTORNO LISTO PARA DESARROLLO                  ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

cat << EOF
${BOLD}🌐 URLs del Sistema:${NC}
   Backend Local:     http://localhost:5001
   Backend Público:   ${TUNNEL_URL}
   Base de Datos:     localhost:5432 (postgres/Qazwsx1234)

${BOLD}👤 Cuentas de Prueba:${NC}
   Admin:     admindeli@delicrunch.com / Admin1234
   Comercio:  espiga@demo.com / Admin1234
   Comprador: comprador@delicrunch.com / Comprador123

${BOLD}📱 IMPORTANTE - Development Build (NO Expo Go):${NC}
   
   ${YELLOW}Tu app usa @stripe/stripe-react-native que requiere código nativo.
   NO funcionará con Expo Go. Necesitas crear un Development Build:${NC}

   ${CYAN}PASO 1: Crear el build para Android/iOS${NC}
   cd Frontend
   npx eas login                                              # Login en EAS
   npx eas build --platform android --profile development    # Android APK
   npx eas build --platform ios --profile development        # iOS (requiere Mac/cuenta Apple)

   ${CYAN}PASO 2: Instalar el APK/IPA en tu dispositivo${NC}
   - Descarga el APK desde el link que te da EAS
   - Instálalo en tu teléfono Android
   - Para iOS: usa TestFlight o instala el .ipa directamente

   ${CYAN}PASO 3: Conectar al Dev Server${NC}
   - Abre la app "Delicrunch" instalada (NO Expo Go)
   - La app se conectará automáticamente al servidor Expo
   - Escanea el QR si es necesario

${BOLD}📋 Logs en tiempo real:${NC}
   tail -f $ROOT/backend.log      # Backend
   tail -f $ROOT/frontend.log     # Frontend/Expo

${BOLD}🛑 Para detener todo:${NC}
   Ctrl+C o ejecutar: kill \$(cat $ROOT/Backend/server.pid) \$(cat $ROOT/scripts/expo.pid)

EOF

echo -e "${CYAN}📺 Mostrando logs de Expo (Ctrl+C para salir)...${NC}\n"
tail -f "$ROOT/Frontend/.expo/logs/expo.log" 2>/dev/null || tail -f /dev/null &

# Mantener el script corriendo
wait $EXPO_PID
