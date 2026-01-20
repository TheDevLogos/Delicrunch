#!/bin/bash

# 🚀 Quick Start - Testing Payment Integration
# Este script te guía paso a paso para probar el flujo de pagos

echo "🎯 Quick Start - Payment Integration Testing"
echo "=============================================="
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Paso 1: Validar Integración${NC}"
echo "-----------------------------------"
echo "Ejecutando validación automática..."
./validate-payment-integration.sh
VALIDATION_RESULT=$?

if [ $VALIDATION_RESULT -ne 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  La validación encontró problemas.${NC}"
    echo "Por favor, revisa los errores antes de continuar."
    exit 1
fi

echo ""
echo -e "${BLUE}Paso 2: Verificar Variables de Entorno${NC}"
echo "----------------------------------------"

if [ ! -f "Backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Archivo Backend/.env no encontrado${NC}"
    echo ""
    echo "Crea Backend/.env con:"
    echo "STRIPE_SECRET_KEY=sk_test_..."
    echo "STRIPE_PUBLISHABLE_KEY=pk_test_..."
    exit 1
fi

echo -e "${GREEN}✅${NC} Backend/.env existe"

if grep -q "STRIPE_SECRET_KEY" Backend/.env; then
    echo -e "${GREEN}✅${NC} STRIPE_SECRET_KEY configurada"
else
    echo -e "${YELLOW}⚠️${NC} STRIPE_SECRET_KEY no encontrada en .env"
fi

echo ""
echo -e "${BLUE}Paso 3: Iniciar Servicios${NC}"
echo "--------------------------"
echo ""
echo "Para probar el flujo completo, necesitas:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd Backend && npm start"
echo ""
echo "Terminal 2 (Frontend - Development Build):"
echo "  cd Frontend && npm start"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: No uses Expo Go${NC}"
echo "   Stripe requiere Development Build"
echo ""

echo -e "${BLUE}Paso 4: Flujo de Testing${NC}"
echo "------------------------"
echo ""
echo "1. Iniciar sesión como comprador"
echo "2. Navegar a un producto"
echo "3. Presionar 'Comprar'"
echo "4. En PaymentScreen verificar:"
echo "   - Lista de tarjetas guardadas (si existen)"
echo "   - Botón 'Agregar nueva tarjeta'"
echo "   - Pull-to-refresh funciona"
echo "5. Seleccionar tarjeta (si hay varias)"
echo "6. Presionar 'Pagar ahora'"
echo "7. Verificar Payment Sheet:"
echo "   - Se abre correctamente"
echo "   - Muestra tarjetas guardadas"
echo "   - Permite agregar nueva tarjeta"
echo "8. Completar pago"
echo "9. Verificar navegación a confirmación"
echo ""

echo -e "${BLUE}Paso 5: Tarjetas de Prueba${NC}"
echo "---------------------------"
echo ""
echo "Usa estas tarjetas en Stripe Test Mode:"
echo ""
echo -e "${GREEN}✅ Pago exitoso:${NC}"
echo "   4242 4242 4242 4242"
echo ""
echo -e "${YELLOW}⚠️  3D Secure (requiere autenticación):${NC}"
echo "   4000 0025 0000 3155"
echo ""
echo -e "${YELLOW}❌ Pago declinado:${NC}"
echo "   4000 0000 0000 0002"
echo ""
echo "Todos con:"
echo "  - Expiración: Cualquier fecha futura"
echo "  - CVC: Cualquier 3 dígitos"
echo "  - ZIP: Cualquier código postal"
echo ""

echo -e "${BLUE}Paso 6: Debugging${NC}"
echo "------------------"
echo ""
echo "Si algo falla, revisa:"
echo ""
echo "Frontend (React Native Debugger o consola):"
echo "  🔍 Verificando tarjetas guardadas..."
echo "  ✅ Usuario tiene X tarjetas guardadas"
echo "  🔐 Obteniendo Customer Session..."
echo "  💳 Creando Payment Intent..."
echo "  ✅ Payment Sheet inicializado"
echo ""
echo "Backend (Terminal):"
echo "  ✅ Customer Session creada: cus_xxx"
echo "  ✅ Payment Intent creado: pi_xxx"
echo "  ✅ Obtenidas X tarjetas para customer"
echo ""
echo "Stripe Dashboard:"
echo "  https://dashboard.stripe.com/test/payments"
echo ""

echo -e "${BLUE}Documentación Completa${NC}"
echo "----------------------"
echo ""
echo "📖 PAYMENT_INTEGRATION_GUIDE.md"
echo "   - Guía técnica detallada"
echo "   - API endpoints"
echo "   - Debugging avanzado"
echo ""
echo "📖 PAYMENT_INTEGRATION_COMPLETE.md"
echo "   - Testing paso a paso"
echo "   - Troubleshooting"
echo "   - Checklist completo"
echo ""
echo "📖 PAYMENT_SUMMARY.md"
echo "   - Resumen ejecutivo"
echo "   - Métricas de implementación"
echo "   - Comparativa antes/después"
echo ""

echo "=============================================="
echo -e "${GREEN}✅ Todo listo para testing!${NC}"
echo ""
echo "💡 Tip: Mantén abiertos los logs del backend"
echo "    para ver el flujo completo en tiempo real"
echo ""
echo "🚀 ¡Comienza a probar el sistema de pagos!"
echo "=============================================="
