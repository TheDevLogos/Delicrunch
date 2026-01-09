#!/usr/bin/env bash
# Script rápido para iniciar solo el frontend con Expo SDK 54
# Uso: bash scripts/start-expo-sdk54.sh

set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT/Frontend"

echo "🚀 Iniciando Delicrunch con Expo SDK 54..."
echo ""
echo "Versión de Expo: $(npx expo --version)"
echo "Versión de Node: $(node --version)"
echo "Versión de npm: $(npm --version)"
echo ""

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
  echo "⚠️  node_modules no encontrado. Instalando dependencias..."
  npm install
fi

echo ""
echo "📱 Abriendo Expo Dev Server..."
echo "   - Escanea el código QR con Expo Go en tu dispositivo Android"
echo "   - Asegúrate de tener Expo Go actualizado desde Google Play"
echo ""
echo "Comandos disponibles:"
echo "  • Presiona 'a' para abrir en Android"
echo "  • Presiona 'r' para recargar la app"
echo "  • Presiona 'Ctrl+C' para salir"
echo ""

npx expo start --clear
