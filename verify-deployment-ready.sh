#!/bin/bash

# =========================================================================
# SCRIPT DE VERIFICACIÓN PRE-DEPLOYMENT - DELICRUNCH
# =========================================================================
# Este script verifica que todo esté listo para el deployment en Supabase y Render
# Fecha: 9 de Febrero 2026
# =========================================================================

echo "🔍 Verificando configuración de Delicrunch..."
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
ERRORS=0
WARNINGS=0
SUCCESS=0

# =========================================================================
# 1. VERIFICAR ESTRUCTURA DE ARCHIVOS
# =========================================================================
echo "📁 Verificando estructura de archivos..."

if [ -f "Backend/.env" ]; then
    echo -e "${GREEN}✅ Backend/.env existe${NC}"
    ((SUCCESS++))
else
    echo -e "${RED}❌ Backend/.env NO EXISTE${NC}"
    echo "   Crea el archivo copiando Backend/.env.example"
    ((ERRORS++))
fi

if [ -f "Frontend/.env" ]; then
    echo -e "${GREEN}✅ Frontend/.env existe${NC}"
    ((SUCCESS++))
else
    echo -e "${YELLOW}⚠️  Frontend/.env NO EXISTE (opcional)${NC}"
    ((WARNINGS++))
fi

if [ -f "Backend/package.json" ]; then
    echo -e "${GREEN}✅ Backend/package.json existe${NC}"
    ((SUCCESS++))
else
    echo -e "${RED}❌ Backend/package.json NO EXISTE${NC}"
    ((ERRORS++))
fi

if [ -f "Frontend/package.json" ]; then
    echo -e "${GREEN}✅ Frontend/package.json existe${NC}"
    ((SUCCESS++))
else
    echo -e "${RED}❌ Frontend/package.json NO EXISTE${NC}"
    ((ERRORS++))
fi

if [ -f "supabase_migration_complete.sql" ]; then
    echo -e "${GREEN}✅ Script de migración SQL existe${NC}"
    ((SUCCESS++))
else
    echo -e "${RED}❌ supabase_migration_complete.sql NO EXISTE${NC}"
    ((ERRORS++))
fi

if [ -d "Backend/uploads" ]; then
    echo -e "${GREEN}✅ Carpeta Backend/uploads existe${NC}"
    ((SUCCESS++))
else
    echo -e "${YELLOW}⚠️  Carpeta Backend/uploads NO EXISTE${NC}"
    echo "   Ejecuta: mkdir -p Backend/uploads"
    ((WARNINGS++))
fi

echo ""

# =========================================================================
# 2. VERIFICAR VARIABLES DE ENTORNO DEL BACKEND
# =========================================================================
echo "🔧 Verificando variables de entorno del Backend..."

if [ -f "Backend/.env" ]; then
    # Cargar variables
    source Backend/.env 2>/dev/null || true
    
    # DATABASE_URL
    if [ -n "$DATABASE_URL" ]; then
        echo -e "${GREEN}✅ DATABASE_URL configurada${NC}"
        # Verificar que sea de Supabase
        if [[ "$DATABASE_URL" == *"supabase"* ]]; then
            echo -e "${GREEN}   → Apunta a Supabase${NC}"
            ((SUCCESS++))
        else
            echo -e "${YELLOW}   ⚠️  No parece ser URL de Supabase${NC}"
            ((WARNINGS++))
        fi
    else
        echo -e "${RED}❌ DATABASE_URL NO configurada${NC}"
        ((ERRORS++))
    fi
    
    # JWT_SECRET
    if [ -n "$JWT_SECRET" ]; then
        echo -e "${GREEN}✅ JWT_SECRET configurada${NC}"
        ((SUCCESS++))
    else
        echo -e "${RED}❌ JWT_SECRET NO configurada${NC}"
        ((ERRORS++))
    fi
    
    # MERCADOPAGO_ACCESS_TOKEN
    if [ -n "$MERCADOPAGO_ACCESS_TOKEN" ]; then
        echo -e "${GREEN}✅ MERCADOPAGO_ACCESS_TOKEN configurada${NC}"
        ((SUCCESS++))
    else
        echo -e "${YELLOW}⚠️  MERCADOPAGO_ACCESS_TOKEN NO configurada${NC}"
        ((WARNINGS++))
    fi
    
    # SUPABASE_URL
    if [ -n "$SUPABASE_URL" ]; then
        echo -e "${GREEN}✅ SUPABASE_URL configurada${NC}"
        ((SUCCESS++))
    else
        echo -e "${YELLOW}⚠️  SUPABASE_URL NO configurada${NC}"
        ((WARNINGS++))
    fi
    
    # EMAIL CONFIG
    if [ -n "$EMAIL_USER" ] && [ -n "$EMAIL_PASS" ]; then
        echo -e "${GREEN}✅ Configuración de Email completa${NC}"
        ((SUCCESS++))
    else
        echo -e "${YELLOW}⚠️  Configuración de Email incompleta${NC}"
        ((WARNINGS++))
    fi
fi

echo ""

# =========================================================================
# 3. VERIFICAR DEPENDENCIAS DEL BACKEND
# =========================================================================
echo "📦 Verificando dependencias del Backend..."

if [ -d "Backend/node_modules" ]; then
    echo -e "${GREEN}✅ node_modules instalados${NC}"
    ((SUCCESS++))
else
    echo -e "${YELLOW}⚠️  node_modules NO instalados${NC}"
    echo "   Ejecuta: cd Backend && npm install"
    ((WARNINGS++))
fi

if [ -f "Backend/package-lock.json" ]; then
    echo -e "${GREEN}✅ package-lock.json existe${NC}"
    ((SUCCESS++))
else
    echo -e "${YELLOW}⚠️  package-lock.json NO EXISTE${NC}"
    ((WARNINGS++))
fi

# Verificar dependencias clave
if [ -d "Backend/node_modules" ]; then
    if [ -d "Backend/node_modules/express" ]; then
        echo -e "${GREEN}✅ Express instalado${NC}"
        ((SUCCESS++))
    else
        echo -e "${RED}❌ Express NO instalado${NC}"
        ((ERRORS++))
    fi
    
    if [ -d "Backend/node_modules/pg" ]; then
        echo -e "${GREEN}✅ PostgreSQL (pg) instalado${NC}"
        ((SUCCESS++))
    else
        echo -e "${RED}❌ PostgreSQL (pg) NO instalado${NC}"
        ((ERRORS++))
    fi
    
    if [ -d "Backend/node_modules/multer" ]; then
        echo -e "${GREEN}✅ Multer instalado (para subir imágenes)${NC}"
        ((SUCCESS++))
    else
        echo -e "${RED}❌ Multer NO instalado${NC}"
        echo "   Ejecuta: cd Backend && npm install multer@2.0.2"
        ((ERRORS++))
    fi
    
    if [ -d "Backend/node_modules/mercadopago" ]; then
        echo -e "${GREEN}✅ MercadoPago SDK instalado${NC}"
        ((SUCCESS++))
    else
        echo -e "${YELLOW}⚠️  MercadoPago SDK NO instalado${NC}"
        ((WARNINGS++))
    fi
fi

echo ""

# =========================================================================
# 4. VERIFICAR DEPENDENCIAS DEL FRONTEND
# =========================================================================
echo "📱 Verificando dependencias del Frontend..."

if [ -d "Frontend/node_modules" ]; then
    echo -e "${GREEN}✅ node_modules instalados${NC}"
    ((SUCCESS++))
else
    echo -e "${YELLOW}⚠️  node_modules NO instalados${NC}"
    echo "   Ejecuta: cd Frontend && npm install"
    ((WARNINGS++))
fi

if [ -f "Frontend/.npmrc" ]; then
    echo -e "${GREEN}✅ .npmrc existe (para legacy-peer-deps)${NC}"
    ((SUCCESS++))
else
    echo -e "${YELLOW}⚠️  .npmrc NO EXISTE${NC}"
    echo "   Crea Frontend/.npmrc con: legacy-peer-deps=true"
    ((WARNINGS++))
fi

# Verificar expo-image-picker
if [ -d "Frontend/node_modules" ]; then
    if [ -d "Frontend/node_modules/expo-image-picker" ]; then
        echo -e "${GREEN}✅ expo-image-picker instalado (para fotos en reviews)${NC}"
        ((SUCCESS++))
    else
        echo -e "${YELLOW}⚠️  expo-image-picker NO instalado${NC}"
        echo "   Ejecuta: cd Frontend && npx expo install expo-image-picker"
        ((WARNINGS++))
    fi
fi

echo ""

# =========================================================================
# 5. VERIFICAR ARCHIVOS CRÍTICOS
# =========================================================================
echo "🔑 Verificando archivos críticos..."

# Backend
BACKEND_FILES=(
    "Backend/server.js"
    "Backend/db/index.js"
    "Backend/routes/reviewRoutes.js"
    "Backend/controllers/reviewController.js"
    "Backend/middleware/upload.js"
    "Backend/controllers/paymentController.js"
)

for file in "${BACKEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file existe${NC}"
        ((SUCCESS++))
    else
        echo -e "${RED}❌ $file NO EXISTE${NC}"
        ((ERRORS++))
    fi
done

# Frontend
FRONTEND_FILES=(
    "Frontend/app/LeaveReviewScreen.js"
    "Frontend/services/api.js"
    "Frontend/services/mercadoPagoService.js"
    "Frontend/app/PaymentScreen.js"
)

for file in "${FRONTEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file existe${NC}"
        ((SUCCESS++))
    else
        echo -e "${RED}❌ $file NO EXISTE${NC}"
        ((ERRORS++))
    fi
done

echo ""

# =========================================================================
# 6. VERIFICAR CORRECCIONES RECIENTES
# =========================================================================
echo "🔧 Verificando correcciones recientes..."

# Verificar que mercadoPagoService.js tenga la corrección de /api/api
if [ -f "Frontend/services/mercadoPagoService.js" ]; then
    if grep -q "ensureApiSuffix" "Frontend/services/mercadoPagoService.js"; then
        echo -e "${GREEN}✅ Corrección de rutas /api/api aplicada${NC}"
        ((SUCCESS++))
    else
        echo -e "${YELLOW}⚠️  Corrección de rutas /api/api NO aplicada${NC}"
        echo "   Revisa CORRECCIONES_ENTORNO_CLIENTE.md"
        ((WARNINGS++))
    fi
fi

# Verificar que reviewController.js tenga soporte de imágenes
if [ -f "Backend/controllers/reviewController.js" ]; then
    if grep -q "req.files" "Backend/controllers/reviewController.js"; then
        echo -e "${GREEN}✅ Soporte de imágenes en reviews implementado${NC}"
        ((SUCCESS++))
    else
        echo -e "${YELLOW}⚠️  Soporte de imágenes en reviews NO implementado${NC}"
        ((WARNINGS++))
    fi
fi

# Verificar migración SQL de imágenes
if [ -f "Backend/db/migrations/add_images_to_reviews.sql" ]; then
    echo -e "${GREEN}✅ Migración SQL de imágenes existe${NC}"
    ((SUCCESS++))
else
    echo -e "${YELLOW}⚠️  Migración SQL de imágenes NO EXISTE${NC}"
    ((WARNINGS++))
fi

echo ""

# =========================================================================
# 7. RESUMEN FINAL
# =========================================================================
echo "================================================"
echo "📊 RESUMEN DE VERIFICACIÓN"
echo "================================================"
echo -e "${GREEN}✅ Exitosos: $SUCCESS${NC}"
echo -e "${YELLOW}⚠️  Advertencias: $WARNINGS${NC}"
echo -e "${RED}❌ Errores: $ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡Todo listo para deployment!${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Ejecuta el script SQL en Supabase:"
    echo "   → supabase_migration_complete.sql"
    echo "2. Despliega el Backend en Render"
    echo "3. Actualiza EXPO_PUBLIC_API_URL en Frontend"
    echo "4. ¡Listo para producción!"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Configuración casi lista con algunas advertencias${NC}"
    echo ""
    echo "Revisa las advertencias arriba antes de continuar."
    echo "Algunas son opcionales pero recomendadas."
    exit 0
else
    echo -e "${RED}❌ Se encontraron errores que deben corregirse${NC}"
    echo ""
    echo "Corrige los errores marcados con ❌ antes de continuar."
    exit 1
fi
