#!/bin/bash

# Script de validación para Stripe Connect
# Verifica que todos los endpoints y componentes estén funcionando

echo "🔍 Validando implementación de Stripe Connect..."
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de pruebas
PASSED=0
FAILED=0

# URL del backend
BACKEND_URL="http://localhost:5001"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 PARTE 1: Validación de Archivos"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar archivos del backend
echo "🔹 Backend:"

if [ -f "Backend/controllers/paymentController.js" ]; then
    if grep -q "getConnectedAccountBalance" Backend/controllers/paymentController.js; then
        echo -e "${GREEN}✓${NC} paymentController.js - getConnectedAccountBalance existe"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} paymentController.js - getConnectedAccountBalance NO encontrado"
        ((FAILED++))
    fi
    
    if grep -q "getUpcomingPayouts" Backend/controllers/paymentController.js; then
        echo -e "${GREEN}✓${NC} paymentController.js - getUpcomingPayouts existe"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} paymentController.js - getUpcomingPayouts NO encontrado"
        ((FAILED++))
    fi
    
    if grep -q "payoutsEnabled" Backend/controllers/paymentController.js; then
        echo -e "${GREEN}✓${NC} paymentController.js - payoutsEnabled en getAccountStatus"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} paymentController.js - payoutsEnabled NO encontrado"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗${NC} Backend/controllers/paymentController.js NO existe"
    ((FAILED+=3))
fi

if [ -f "Backend/routes/paymentRoutes.js" ]; then
    if grep -q "connected-account-balance" Backend/routes/paymentRoutes.js; then
        echo -e "${GREEN}✓${NC} paymentRoutes.js - Ruta connected-account-balance existe"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} paymentRoutes.js - Ruta connected-account-balance NO encontrada"
        ((FAILED++))
    fi
    
    if grep -q "upcoming-payouts" Backend/routes/paymentRoutes.js; then
        echo -e "${GREEN}✓${NC} paymentRoutes.js - Ruta upcoming-payouts existe"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} paymentRoutes.js - Ruta upcoming-payouts NO encontrada"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗${NC} Backend/routes/paymentRoutes.js NO existe"
    ((FAILED+=2))
fi

echo ""
echo "🔹 Frontend:"

if [ -f "Frontend/app/MerchantPaymentSettingsScreen.js" ]; then
    echo -e "${GREEN}✓${NC} MerchantPaymentSettingsScreen.js existe"
    ((PASSED++))
    
    if grep -q "connected-account-balance" Frontend/app/MerchantPaymentSettingsScreen.js; then
        echo -e "${GREEN}✓${NC} MerchantPaymentSettingsScreen.js - Llama endpoint balance"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} MerchantPaymentSettingsScreen.js - NO llama endpoint balance"
        ((FAILED++))
    fi
    
    if grep -q "upcoming-payouts" Frontend/app/MerchantPaymentSettingsScreen.js; then
        echo -e "${GREEN}✓${NC} MerchantPaymentSettingsScreen.js - Llama endpoint payouts"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} MerchantPaymentSettingsScreen.js - NO llama endpoint payouts"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗${NC} Frontend/app/MerchantPaymentSettingsScreen.js NO existe"
    ((FAILED+=3))
fi

if [ -f "Frontend/app/MerchantDashboardScreen.js" ]; then
    if grep -q "stripeStatus" Frontend/app/MerchantDashboardScreen.js; then
        echo -e "${GREEN}✓${NC} MerchantDashboardScreen.js - Estado de Stripe integrado"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} MerchantDashboardScreen.js - Estado de Stripe NO integrado"
        ((FAILED++))
    fi
    
    if grep -q "stripeWarning" Frontend/app/MerchantDashboardScreen.js; then
        echo -e "${GREEN}✓${NC} MerchantDashboardScreen.js - Warning de Stripe agregado"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} MerchantDashboardScreen.js - Warning de Stripe NO encontrado"
        ((FAILED++))
    fi
    
    if grep -q "PaymentSettings" Frontend/app/MerchantDashboardScreen.js; then
        echo -e "${GREEN}✓${NC} MerchantDashboardScreen.js - Navegación a PaymentSettings"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} MerchantDashboardScreen.js - NO navega a PaymentSettings"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗${NC} Frontend/app/MerchantDashboardScreen.js NO existe"
    ((FAILED+=3))
fi

if [ -f "Frontend/navigation/AppNavigator.js" ]; then
    if grep -q "MerchantPaymentSettingsScreen" Frontend/navigation/AppNavigator.js; then
        echo -e "${GREEN}✓${NC} AppNavigator.js - Importa MerchantPaymentSettingsScreen"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} AppNavigator.js - NO importa MerchantPaymentSettingsScreen"
        ((FAILED++))
    fi
    
    if grep -q "PaymentSettings" Frontend/navigation/AppNavigator.js; then
        echo -e "${GREEN}✓${NC} AppNavigator.js - Ruta PaymentSettings configurada"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} AppNavigator.js - Ruta PaymentSettings NO configurada"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗${NC} Frontend/navigation/AppNavigator.js NO existe"
    ((FAILED+=2))
fi

echo ""
echo "🔹 Documentación:"

if [ -f "STRIPE_CONNECT_ANALYSIS.md" ]; then
    echo -e "${GREEN}✓${NC} STRIPE_CONNECT_ANALYSIS.md existe"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} STRIPE_CONNECT_ANALYSIS.md NO existe"
    ((FAILED++))
fi

if [ -f "STRIPE_CONNECT_IMPLEMENTATION.md" ]; then
    echo -e "${GREEN}✓${NC} STRIPE_CONNECT_IMPLEMENTATION.md existe"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} STRIPE_CONNECT_IMPLEMENTATION.md NO existe"
    ((FAILED++))
fi

if [ -f "STRIPE_CONNECT_SUMMARY.md" ]; then
    echo -e "${GREEN}✓${NC} STRIPE_CONNECT_SUMMARY.md existe"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} STRIPE_CONNECT_SUMMARY.md NO existe"
    ((FAILED++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 PARTE 2: Validación de Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar si el servidor está corriendo
if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend está corriendo en $BACKEND_URL"
    ((PASSED++))
    
    echo ""
    echo -e "${YELLOW}⚠${NC}  Para probar los endpoints, necesitas un token de comercio."
    echo "   Puedes obtenerlo iniciando sesión como comercio en la app."
    echo ""
    echo "   Ejemplo de pruebas manuales:"
    echo ""
    echo "   1. Status de cuenta:"
    echo "   curl -X GET $BACKEND_URL/api/payments/stripe-account-status \\"
    echo "     -H \"Authorization: Bearer TU_TOKEN\""
    echo ""
    echo "   2. Balance:"
    echo "   curl -X GET $BACKEND_URL/api/payments/connected-account-balance \\"
    echo "     -H \"Authorization: Bearer TU_TOKEN\""
    echo ""
    echo "   3. Próximos pagos:"
    echo "   curl -X GET $BACKEND_URL/api/payments/upcoming-payouts \\"
    echo "     -H \"Authorization: Bearer TU_TOKEN\""
    echo ""
else
    echo -e "${RED}✗${NC} Backend NO está corriendo en $BACKEND_URL"
    echo "   Inicia el backend con: cd Backend && npm start"
    ((FAILED++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 PARTE 3: Checklist de Pruebas Manuales"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Realiza las siguientes pruebas en la app:"
echo ""
echo "  [ ] 1. Login como comercio"
echo "  [ ] 2. Ver Dashboard - debe mostrar warning si no configurado"
echo "  [ ] 3. Presionar 'Pagos' en acciones rápidas"
echo "  [ ] 4. Ver pantalla MerchantPaymentSettingsScreen"
echo "  [ ] 5. Ver estado de cuenta (✅/⚠️/❌)"
echo "  [ ] 6. Ver balance disponible y pendiente (si activo)"
echo "  [ ] 7. Ver lista de próximos pagos (si activo)"
echo "  [ ] 8. Presionar 'Conectar con Stripe' o 'Gestionar Cuenta'"
echo "  [ ] 9. Abrir WebBrowser con URL de Stripe"
echo "  [ ] 10. Completar onboarding en Stripe (usar datos de prueba)"
echo "  [ ] 11. Volver a la app"
echo "  [ ] 12. Pull-to-refresh en PaymentSettings"
echo "  [ ] 13. Verificar que estado cambió a activo"
echo "  [ ] 14. Volver al Dashboard"
echo "  [ ] 15. Verificar que warning desapareció"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESULTADOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

echo "Total de pruebas: $TOTAL"
echo -e "${GREEN}Pasadas: $PASSED${NC}"
echo -e "${RED}Fallidas: $FAILED${NC}"
echo ""

if [ $PERCENTAGE -ge 90 ]; then
    echo -e "${GREEN}✅ Validación exitosa ($PERCENTAGE%)${NC}"
    echo ""
    echo "🎉 ¡El sistema de Stripe Connect está correctamente implementado!"
    echo ""
    echo "Próximos pasos:"
    echo "  1. Iniciar el backend: cd Backend && npm start"
    echo "  2. Iniciar el frontend: cd Frontend && npx expo start"
    echo "  3. Login como comercio"
    echo "  4. Probar el flujo completo siguiendo el checklist"
    exit 0
elif [ $PERCENTAGE -ge 70 ]; then
    echo -e "${YELLOW}⚠️  Validación parcial ($PERCENTAGE%)${NC}"
    echo ""
    echo "Revisa los errores arriba y completa la implementación."
    exit 1
else
    echo -e "${RED}❌ Validación fallida ($PERCENTAGE%)${NC}"
    echo ""
    echo "La implementación está incompleta. Revisa los errores."
    exit 1
fi
