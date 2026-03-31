#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
FRONTEND_DIR="$ROOT_DIR/Frontend"

cd "$FRONTEND_DIR"

# Verificar backend en Render
echo "🔍 Verificando backend en Render..."
BACKEND_URL="https://delicrunch.onrender.com/api"
if curl -s --max-time 5 "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo "✅ Backend activo en $BACKEND_URL"
else
    echo "⚠️  Backend no responde, pero continuando..."
fi

# Configurar .env con la URL de Render
echo "📝 Configurando variables de entorno..."
cat > "$FRONTEND_DIR/.env" << EOF
EXPO_PUBLIC_API_URL=https://delicrunch.onrender.com/api
EOF
echo "✅ EXPO_PUBLIC_API_URL=https://delicrunch.onrender.com/api"

# Limpiar caché
echo "🧹 Limpiando caché..."
rm -rf "$FRONTEND_DIR/.expo" "$FRONTEND_DIR/node_modules/.cache" 2>/dev/null || true

# Verificar que exista Dev Client build
echo "📱 Iniciando Expo Dev Build con túnel..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📲 INSTRUCCIONES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. Abre la app 'Expo Go' o 'Delicrunch Dev' en tu dispositivo"
echo "  2. Escanea el QR code que aparecerá abajo"
echo "  3. Si usas Expo Go, selecciona 'Development build'"
echo ""
echo "  Backend: https://delicrunch.onrender.com/api"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Iniciar Expo Dev Build con túnel
npx expo start --dev-client --tunnel --clear
