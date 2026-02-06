#!/bin/bash

echo "🔧 Configurando puertos públicos para Delicrunch..."

# Puertos que necesitan ser públicos
PORTS=(5001 8081 8082 19000 19001 19002)

for PORT in "${PORTS[@]}"; do
    echo "📡 Configurando puerto $PORT como público..."
    
    # Intentar con gh CLI
    gh codespace ports visibility $PORT:public 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Puerto $PORT configurado correctamente"
    else
        echo "⚠️  No se pudo configurar puerto $PORT automáticamente"
        echo "   Por favor, hazlo manualmente en la pestaña PORTS de VS Code"
    fi
done

echo ""
echo "✅ Configuración completada"
echo ""
echo "📋 Verifica en la pestaña PORTS que los siguientes puertos estén en 'Public':"
echo "   - 5001 (Backend API)"
echo "   - 8081/8082 (Expo Metro Bundler)"
echo "   - 19000-19002 (Expo Development Server)"
echo ""
echo "🔍 Para cambiar manualmente:"
echo "   1. Abre la pestaña 'PORTS' en la parte inferior de VS Code"
echo "   2. Click derecho en cada puerto"
echo "   3. Selecciona 'Port Visibility' > 'Public'"
