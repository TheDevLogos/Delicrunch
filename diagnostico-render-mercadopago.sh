#!/bin/bash

# Script para diagnosticar errores de MercadoPago en Render
# Verifica configuración y sugiere soluciones

echo "🔍 Diagnóstico de MercadoPago en Render"
echo "========================================="
echo ""

# 1. Verificar salud del backend
echo "1️⃣ Verificando backend de Render..."
HEALTH_CHECK=$(curl -s https://delicrunch.onrender.com/api/health)
if echo "$HEALTH_CHECK" | grep -q '"success":true'; then
    echo "   ✅ Backend de Render está online"
    UPTIME=$(echo "$HEALTH_CHECK" | grep -o '"uptime":[0-9.]*' | cut -d: -f2)
    echo "   ⏱️  Uptime: ${UPTIME}s"
else
    echo "   ❌ Backend de Render no responde correctamente"
    exit 1
fi
echo ""

# 2. Verificar endpoint de create-preference
echo "2️⃣ Probando endpoint de crear preferencia (debe dar 401)..."
PREFERENCE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://delicrunch.onrender.com/api/payments/create-preference)
if [ "$PREFERENCE_RESPONSE" = "401" ] || [ "$PREFERENCE_RESPONSE" = "400" ]; then
    echo "   ✅ Endpoint /api/payments/create-preference existe"
else
    echo "   ❌ Endpoint no encontrado (código: $PREFERENCE_RESPONSE)"
    echo "   ⚠️  Render puede no tener el código actualizado"
fi
echo ""

# 3. Verificar último commit en GitHub
echo "3️⃣ Verificando último commit en GitHub..."
LATEST_COMMIT=$(curl -s "https://api.github.com/repos/Alonsovl88074/Delicrunch/commits?per_page=1" | grep -o '"sha": "[^"]*"' | head -1 | cut -d'"' -f4 | cut -c1-7)
if [ -n "$LATEST_COMMIT" ]; then
    echo "   ✅ Último commit: $LATEST_COMMIT"
    LOCAL_COMMIT=$(git rev-parse --short HEAD)
    if [ "$LOCAL_COMMIT" = "$LATEST_COMMIT" ]; then
        echo "   ✅ Tu código local está sincronizado con GitHub"
    else
        echo "   ⚠️  Tu código local ($LOCAL_COMMIT) difiere de GitHub ($LATEST_COMMIT)"
    fi
else
    echo "   ⚠️  No se pudo verificar commit de GitHub"
fi
echo ""

# 4. Variables de entorno críticas
echo "4️⃣ Variables de entorno que DEBES verificar en Render:"
echo ""
echo "   🔧 Ve a: https://dashboard.render.com → delicrunch → Environment"
echo ""
echo "   Variables CRÍTICAS para MercadoPago:"
echo "   ✓ MERCADOPAGO_ACCESS_TOKEN"
echo "     Valor: APP_USR-7758657589560258-012213-ab05386993b304ffec8f442dd78d7b68-3151906188"
echo ""
echo "   ✓ MERCADOPAGO_PUBLIC_KEY"
echo "     Valor: APP_USR-375e7726-8315-48ad-9a60-e31973e44ffa"
echo ""
echo "   ✓ BACKEND_URL"
echo "     Valor: https://delicrunch.onrender.com"
echo ""
echo "   ✓ Database (Supabase):"
echo "     - DB_USER=postgres.pruesizqytpscldieivb"
echo "     - DB_HOST=aws-0-us-west-2.pooler.supabase.com"
echo "     - DB_DATABASE=postgres"
echo "     - DB_PASSWORD=bfOJpzZtcoGhAJdP"
echo "     - DB_PORT=5432"
echo ""

# 5. Instrucciones para forzar redeploy
echo "5️⃣ Si Render no ha actualizado después de 5 minutos:"
echo ""
echo "   Opción A - Forzar redeploy desde Dashboard:"
echo "   1. Ve a https://dashboard.render.com"
echo "   2. Selecciona 'delicrunch'"
echo "   3. Click en 'Manual Deploy' → 'Deploy latest commit'"
echo ""
echo "   Opción B - Forzar desde terminal:"
echo "   curl -X POST https://api.render.com/v1/services/YOUR_SERVICE_ID/deploys \\"
echo "     -H \"Authorization: Bearer YOUR_API_KEY\""
echo ""

# 6. Verificar logs de Render
echo "6️⃣ Revisar logs en tiempo real:"
echo ""
echo "   Ve a: https://dashboard.render.com → delicrunch → Logs"
echo ""
echo "   Buscar errores relacionados con:"
echo "   - 'MERCADOPAGO_ACCESS_TOKEN'"
echo "   - 'Creating Mercado Pago Preference'"
echo "   - 'Error creating'"
echo ""

# 7. Probar creación de preferencia desde curl
echo "7️⃣ Prueba manual (requiere token de autenticación):"
echo ""
echo "   # 1. Obtén tu token de JWT haciendo login"
echo "   # 2. Ejecuta:"
echo "   curl -X POST https://delicrunch.onrender.com/api/payments/create-preference \\"
echo "     -H 'Authorization: Bearer TU_TOKEN_JWT' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"productId\": 1, \"cantidad\": 1, \"coupon_discount\": 0}'"
echo ""

echo "========================================="
echo "✅ Diagnóstico completado"
echo ""
echo "📋 CHECKLIST DE SOLUCIÓN:"
echo ""
echo "[ ] 1. Verificar que MERCADOPAGO_ACCESS_TOKEN esté en Render"
echo "[ ] 2. Esperar 5 minutos desde el último push (para autodeploy)"
echo "[ ] 3. O hacer 'Manual Deploy' en Dashboard de Render"
echo "[ ] 4. Verificar logs de Render para errores específicos"
echo "[ ] 5. Probar nuevamente el pago desde la app"
echo ""
echo "🔗 Enlaces útiles:"
echo "   - Dashboard Render: https://dashboard.render.com"
echo "   - Supabase DB: https://supabase.com/dashboard/project/pruesizqytpscldieivb"
echo "   - GitHub Repo: https://github.com/Alonsovl88074/Delicrunch"
echo ""
