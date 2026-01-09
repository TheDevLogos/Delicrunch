#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")"/../.. && pwd)
FRONTEND_DIR="$ROOT_DIR/Frontend"

cd "$FRONTEND_DIR"

# Publicar puerto 5001 en Codespaces si aplica
if [[ -n "${CODESPACE_NAME:-}" ]]; then
  echo "Publicando puerto 5001 en Codespaces para acceso público..."
  gh codespace ports visibility -c "$CODESPACE_NAME" 5001:public || true
  API_URL="https://$CODESPACE_NAME-5001.app.github.dev/api"
else
  echo "CODESPACE_NAME no definido; usando localhost"
  API_URL="http://localhost:5001/api"
fi

# Configurar .env con la URL
echo "EXPO_PUBLIC_API_URL=$API_URL" > "$FRONTEND_DIR/.env"
echo "Configurada EXPO_PUBLIC_API_URL=$API_URL"

# Limpiar caché de Expo/Metro
rm -rf "$FRONTEND_DIR/.expo" "$FRONTEND_DIR/node_modules/.cache" || true

# Instalar dependencias
npm install

# Iniciar Expo en modo tunnel con limpieza
EXPO_NO_DEBUG=1 npx expo start --tunnel --clear
