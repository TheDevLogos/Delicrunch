#!/bin/bash

# Script Automatizado: Preparar y Ejecutar EAS Build
# Ejecuta todos los pasos necesarios en orden

set -e  # Salir si hay error

echo "🚀 Preparación para EAS Build - Android Development"
echo "===================================================="
echo ""

# 1. Actualizar EAS CLI
echo "📦 Actualizando EAS CLI..."
npm install -g eas-cli

echo ""
echo "🧹 Limpiando instalación anterior..."
rm -rf node_modules package-lock.json

echo ""
echo "📥 Instalando dependencias..."
npm install

echo ""
echo "🔍 Verificando requisitos..."
chmod +x scripts/verify-build-requirements.sh
./scripts/verify-build-requirements.sh

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Verificación exitosa. Iniciando build..."
    echo ""
    
    # Ejecutar build con clear-cache
    eas build --platform android --profile development --clear-cache
else
    echo ""
    echo "❌ La verificación falló. No se puede continuar con el build."
    exit 1
fi
