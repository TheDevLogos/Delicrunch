#!/bin/bash
API_URL="https://delicrunch.onrender.com/api"

echo "🎮 VERIFICACIÓN DEL SISTEMA DE GAMIFICACIÓN"
echo "==========================================="
echo ""

# Login
echo "🔐 1. Login como comprador..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testbuyer2@delicrunch.com","password":"Test1234!"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Error en login"
  exit 1
fi

echo "✅ Login exitoso"
echo ""

# Verificar estadísticas actuales
echo "📊 2. Obteniendo estadísticas actuales..."
STATS=$(curl -s -X GET "${API_URL}/profiles/gamification" \
  -H "x-auth-token: $TOKEN")

echo $STATS | jq '{
  total_xp,
  total_packs_saved,
  total_savings,
  total_co2_saved,
  total_reviews,
  badges: (.unlocked_badges | length)
}'
echo ""

# Simular otorgar XP por compra
echo "💰 3. Simulando otorgar XP por compra..."
echo "   Parámetros de ejemplo:"
echo "   - 2 packs rescatados"
echo "   - $80 ahorrados"
echo "   - 5 kg CO2 evitado"
echo ""

# Calcular XP esperado (según fórmula del frontend)
# baseXP = packsSaved * 32 = 2 * 32 = 64
# savingsXP = floor(savings * 0.65) = floor(80 * 0.65) = 52
# co2XP = floor(co2 * 6.5) = floor(5 * 6.5) = 32
# comboMultiplier = 1.1 (2 packs)
# Total = floor((64 + 52 + 32) * 1.1) = floor(162.8) = 162 XP

echo "   📐 XP esperado según fórmula:"
echo "   - Base (2 packs × 32): 64 XP"
echo "   - Ahorro ($80 × 0.65): 52 XP"
echo "   - CO2 (5 kg × 6.5): 32 XP"
echo "   - Combo (2+ packs): ×1.1"
echo "   - TOTAL: ~162 XP"
echo ""

POST_RESULT=$(curl -s -X POST "${API_URL}/profiles/gamification" \
  -H "Content-Type: application/json" \
  -H "x-auth-token: $TOKEN" \
  -d '{
    "xp_gained": 162,
    "packs_saved": 2,
    "savings": 80,
    "co2_saved": 5
  }')

echo "✅ Resultado del registro:"
echo $POST_RESULT | jq '{
  total_xp,
  total_packs_saved,
  total_savings,
  total_co2_saved
}'
echo ""

echo "==========================================="
echo "✅ Verificación completada"
echo ""
echo "📖 RESUMEN DEL SISTEMA:"
echo "  • Fórmula XP: (packs×32 + ahorro×0.65 + co2×6.5) × comboMultiplier"
echo "  • Combo: 2 packs=1.1x, 3+ packs=1.3x"
echo "  • Niveles: 15 niveles (Bronce III → Diamante I)"
echo "  • Endpoint GET: /api/profiles/gamification"
echo "  • Endpoint POST: /api/profiles/gamification"
