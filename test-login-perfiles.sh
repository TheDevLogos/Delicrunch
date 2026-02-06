#!/bin/bash

# 🧪 Script de Prueba de Login para los 3 Perfiles
# Verifica que todos los usuarios puedan autenticarse correctamente

API_URL="https://silver-telegram-7vx44jrgxxqrhrw79-5001.app.github.dev/api"

echo "=================================================="
echo "🧪 Probando Login para los 3 Perfiles"
echo "=================================================="
echo ""

# Función para probar login
test_login() {
    local email=$1
    local password=$2
    local perfil=$3
    
    echo "📧 Probando: $perfil ($email)"
    
    response=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    if echo "$response" | grep -q "token"; then
        echo "   ✅ Login exitoso"
        token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        echo "   🔑 Token: ${token:0:50}..."
        
        # Obtener perfil
        profile=$(curl -s -X GET "$API_URL/profiles/me" \
            -H "x-auth-token: $token")
        
        if echo "$profile" | grep -q "rol"; then
            rol=$(echo "$profile" | grep -o '"rol":"[^"]*"' | cut -d'"' -f4)
            nombre=$(echo "$profile" | grep -o '"nombre":"[^"]*"' | cut -d'"' -f4)
            echo "   👤 Nombre: $nombre"
            echo "   🎭 Rol: $rol"
            echo "   ✅ Perfil obtenido correctamente"
        else
            echo "   ⚠️  No se pudo obtener perfil"
        fi
    else
        echo "   ❌ Login fallido"
        echo "   📄 Respuesta: $response"
    fi
    echo ""
}

# Probar los 3 perfiles
test_login "comprador1@test.com" "password123" "👤 COMPRADOR"
test_login "comercio.tacosdonrafa@test.com" "password123" "🏪 COMERCIO"
test_login "admin@delicrunch.com" "password123" "👑 ADMIN"

echo "=================================================="
echo "✅ Pruebas completadas"
echo "=================================================="
