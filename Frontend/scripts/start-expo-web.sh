#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")"/../.. && pwd)
FRONTEND_DIR="$ROOT_DIR/Frontend"

cd "$FRONTEND_DIR"

echo "EXPO_PUBLIC_API_URL=http://localhost:5001/api" > "$FRONTEND_DIR/.env"
echo "Configurada EXPO_PUBLIC_API_URL=http://localhost:5001/api"

rm -rf "$FRONTEND_DIR/.expo" "$FRONTEND_DIR/node_modules/.cache" || true
npm install
EXPO_NO_DEBUG=1 npx expo start --web --clear
