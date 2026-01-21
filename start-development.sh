#!/bin/bash
# start-development.sh - Script definitivo que SIEMPRE funciona

set -e

ROOT=$(cd "$(dirname "$0")" && pwd)

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  🥐 DELICRUNCH - Inicio Garantizado sin 'Unable to load script'║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# 1. Limpiar todo
echo "🧹 Limpiando procesos anteriores..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "node server.js" 2>/dev/null || true
docker compose down 2>/dev/null || true
sleep 2

# 2. Configurar puertos públicos PRIMERO
if [ -n "$CODESPACE_NAME" ]; then
    echo "🔧 Configurando puertos públicos..."
    gh codespace ports visibility 5001:public -c "$CODESPACE_NAME" 2>/dev/null || true
    gh codespace ports visibility 8081:public -c "$CODESPACE_NAME" 2>/dev/null || true
    echo "✅ Puertos configurados"
fi

# 3. Limpiar cachés
echo "🗑️  Limpiando cachés..."
cd "$ROOT/Frontend"
rm -rf .expo .metro node_modules/.cache /tmp/metro-* /tmp/haste-map-* 2>/dev/null || true

# 4. CRÍTICO: Actualizar .env CON Metro hostname ANTES de iniciar
echo "⚙️  Configurando .env con Metro hostname..."

BACKEND_URL="https://silver-telegram-7vx44jrgxxqrhrw79-5001.app.github.dev"
METRO_HOST="silver-telegram-7vx44jrgxxqrhrw79-8081.app.github.dev"

cat > "$ROOT/Frontend/.env" << EOF
# Configuración generada automáticamente - $(date)
EXPO_PUBLIC_API_URL=$BACKEND_URL

# Stripe Configuration
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SRRYk8hoiRFdhGtFHnTJRVAPniX7lh6esuxdNc13Xw7GK3njphOGYTQ8An7HJSdcTxjeVMi2tULPp6DqKugVbDT00PMJuLLkJ

# Metro Bundler Hostname - CRÍTICO para evitar "Unable to load script"
REACT_NATIVE_PACKAGER_HOSTNAME=$METRO_HOST
EOF

echo "✅ .env configurado correctamente"
echo ""
echo "📋 Contenido de .env:"
cat "$ROOT/Frontend/.env"
echo ""

# 5. Iniciar PostgreSQL
echo "🐘 Iniciando PostgreSQL..."
cd "$ROOT"
docker compose up -d postgres
sleep 3

# 6. Iniciar Backend
echo "🚀 Iniciando Backend..."
cd "$ROOT/Backend"
PORT=5001 node server.js > "$ROOT/backend.log" 2>&1 &
echo $! > "$ROOT/Backend/server.pid"
sleep 3

# 7. Exportar variables y iniciar Expo
echo "📱 Iniciando Expo Dev Server..."
cd "$ROOT/Frontend"
export REACT_NATIVE_PACKAGER_HOSTNAME="$METRO_HOST"
export EXPO_PUBLIC_API_URL="$BACKEND_URL"

npx expo start --clear --dev-client 2>&1 | tee "$ROOT/frontend.log" &
EXPO_PID=$!
echo $EXPO_PID > "$ROOT/scripts/expo.pid"

echo ""
echo "⏳ Esperando a que Metro inicie (30 segundos)..."
sleep 30

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  ✅ SISTEMA INICIADO CORRECTAMENTE                              ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "📱 CONECTA TU DISPOSITIVO:"
echo ""
echo "   URL: exp://$METRO_HOST"
echo ""
echo "   OPCIÓN 1 - En tu app Delicrunch:"
echo "   1. Sacude el dispositivo → Dev Menu"
echo "   2. Settings → Debug server host:"
echo "      $METRO_HOST:443"
echo "   3. Reload"
echo ""
echo "   OPCIÓN 2 - Escanea el QR:"

if command -v qrencode &> /dev/null; then
    qrencode -t ANSIUTF8 "exp://$METRO_HOST"
else
    echo "   (Instala qrencode: sudo apt install qrencode)"
fi

echo ""
echo "📊 Ver logs:"
echo "   Backend: tail -f $ROOT/backend.log"
echo "   Frontend: tail -f $ROOT/frontend.log"
echo ""
echo "✅ Verificar Metro:"
curl -s http://localhost:8081/status || echo "Metro aún iniciando..."
echo ""
echo ""
echo "🛑 Para detener: Ctrl+C"
echo ""

wait $EXPO_PID
