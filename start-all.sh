#!/bin/bash
# Script para iniciar Backend y Frontend de Delicrunch

set -e

echo "🚀 Iniciando Delicrunch..."

# 1. Verificar y arrancar PostgreSQL
echo "📦 Verificando PostgreSQL..."
if ! docker ps | grep -q delicrunch-postgres; then
    echo "⚠️  PostgreSQL no está corriendo. Iniciando..."
    docker start delicrunch-postgres || docker-compose up -d postgres
    sleep 3
else
    echo "✅ PostgreSQL está corriendo"
fi

# 2. Obtener el puerto público de Codespaces para el backend
if [ -n "$CODESPACE_NAME" ]; then
    echo "🌐 Detectado GitHub Codespaces"
    BACKEND_URL="https://${CODESPACE_NAME}-5001.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/api"
    echo "📝 Actualizando Frontend/.env con URL: $BACKEND_URL"
    echo "EXPO_PUBLIC_API_URL=$BACKEND_URL" > Frontend/.env
else
    echo "💻 Entorno local detectado"
    echo "EXPO_PUBLIC_API_URL=http://localhost:5001/api" > Frontend/.env
fi

# 3. Iniciar Backend
echo "🔧 Iniciando Backend en puerto 5001..."
cd Backend
npm install --silent
nohup npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend iniciado (PID: $BACKEND_PID)"
cd ..

# Esperar a que el backend esté listo
echo "⏳ Esperando a que el backend responda..."
for i in {1..30}; do
    if curl -s http://localhost:5001/ > /dev/null 2>&1; then
        echo "✅ Backend está listo"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Timeout esperando al backend"
        exit 1
    fi
    sleep 1
done

# 4. Mostrar información
echo ""
echo "✅ Backend corriendo en: http://localhost:5001"
echo "📋 Logs del backend: tail -f backend.log"
echo ""
echo "🎨 Para iniciar el Frontend:"
echo "   cd Frontend"
echo "   npx expo start --tunnel"
echo ""
echo "📧 Credenciales de prueba:"
echo "   Email: admindeli@delicrunch.com"
echo "   Password: Admin1234"
echo ""
