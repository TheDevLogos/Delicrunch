#!/usr/bin/env bash
set -e

# Inicia Expo en modo tunnel asegurando que EXPO_PUBLIC_API_URL esté exportada.
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

# Cargar .env si existe
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$EXPO_PUBLIC_API_URL" ]; then
  echo "[start-expo-public] EXPO_PUBLIC_API_URL no definido. Usando http://localhost:5001"
  export EXPO_PUBLIC_API_URL="http://localhost:5001"
fi

echo "[start-expo-public] EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL"

# Limpiar caché y arrancar Expo en modo túnel para acceso público
npx expo start --tunnel --clear
