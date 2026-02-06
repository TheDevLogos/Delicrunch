#!/bin/bash

# =============================================
# SCRIPT DE CONFIGURACIÓN DE SUPABASE
# =============================================

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  CONFIGURACIÓN DE SUPABASE PARA DELICRUNCH ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================
# PASO 1: Verificar que estamos en el directorio correcto
# =============================================

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Este script debe ejecutarse desde la raíz del proyecto${NC}"
    exit 1
fi

echo -e "${BLUE}📍 Directorio actual: $(pwd)${NC}"
echo ""

# =============================================
# PASO 2: Instalar dependencias de Supabase
# =============================================

echo -e "${YELLOW}📦 Instalando dependencias de Supabase...${NC}"
echo ""

# Backend
echo -e "${BLUE}Backend:${NC}"
cd Backend
if npm list @supabase/supabase-js >/dev/null 2>&1; then
    echo -e "${GREEN}✅ @supabase/supabase-js ya está instalado${NC}"
else
    echo "Instalando @supabase/supabase-js..."
    npm install @supabase/supabase-js
fi
cd ..

# Frontend
echo ""
echo -e "${BLUE}Frontend:${NC}"
cd Frontend
if npm list @supabase/supabase-js >/dev/null 2>&1; then
    echo -e "${GREEN}✅ @supabase/supabase-js ya está instalado${NC}"
else
    echo "Instalando @supabase/supabase-js..."
    npm install @supabase/supabase-js
fi
cd ..

echo ""
echo -e "${GREEN}✅ Dependencias instaladas${NC}"
echo ""

# =============================================
# PASO 3: Verificar configuración de .env
# =============================================

echo -e "${YELLOW}🔍 Verificando configuración de .env...${NC}"
echo ""

# Backend .env
if [ ! -f "Backend/.env" ]; then
    echo -e "${RED}❌ No se encontró Backend/.env${NC}"
    exit 1
fi

# Verificar variables de Supabase en Backend
if grep -q "SUPABASE_URL" Backend/.env; then
    echo -e "${GREEN}✅ SUPABASE_URL configurada en Backend/.env${NC}"
else
    echo -e "${RED}❌ Falta SUPABASE_URL en Backend/.env${NC}"
fi

if grep -q "SUPABASE_ANON_KEY" Backend/.env; then
    echo -e "${GREEN}✅ SUPABASE_ANON_KEY configurada en Backend/.env${NC}"
else
    echo -e "${RED}❌ Falta SUPABASE_ANON_KEY en Backend/.env${NC}"
fi

# Frontend .env
echo ""
if [ ! -f "Frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  No se encontró Frontend/.env${NC}"
else
    if grep -q "EXPO_PUBLIC_SUPABASE_URL" Frontend/.env; then
        echo -e "${GREEN}✅ EXPO_PUBLIC_SUPABASE_URL configurada en Frontend/.env${NC}"
    else
        echo -e "${RED}❌ Falta EXPO_PUBLIC_SUPABASE_URL en Frontend/.env${NC}"
    fi
    
    if grep -q "EXPO_PUBLIC_SUPABASE_KEY" Frontend/.env; then
        echo -e "${GREEN}✅ EXPO_PUBLIC_SUPABASE_KEY configurada en Frontend/.env${NC}"
    else
        echo -e "${RED}❌ Falta EXPO_PUBLIC_SUPABASE_KEY en Frontend/.env${NC}"
    fi
fi

echo ""

# =============================================
# PASO 4: Instrucciones para el usuario
# =============================================

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  PRÓXIMOS PASOS                            ║"
echo "╚════════════════════════════════════════════╝"
echo ""

echo -e "${BLUE}1. Configura tu contraseña de base de datos Supabase:${NC}"
echo "   - Ve a: https://supabase.com/dashboard/project/pruesizqytpscldieivb/settings/database"
echo "   - Copia la contraseña de la base de datos"
echo "   - Actualiza DB_PASSWORD en Backend/.env"
echo ""

echo -e "${BLUE}2. Obtén tu Service Role Key (para operaciones de backend):${NC}"
echo "   - Ve a: https://supabase.com/dashboard/project/pruesizqytpscldieivb/settings/api"
echo "   - Copia el 'service_role' key (secret)"
echo "   - Actualiza SUPABASE_SERVICE_KEY en Backend/.env"
echo ""

echo -e "${BLUE}3. Ejecuta el esquema SQL en Supabase:${NC}"
echo "   - Ve a: https://supabase.com/dashboard/project/pruesizqytpscldieivb/sql/new"
echo "   - Copia y pega el contenido de: supabase-migration/01-initial-schema.sql"
echo "   - Ejecuta el script"
echo ""

echo -e "${BLUE}4. (Opcional) Migra tus datos existentes:${NC}"
echo "   - Asegúrate de que tu base de datos local esté activa"
echo "   - Ejecuta: cd supabase-migration && node migrate-to-supabase.js"
echo ""

echo -e "${BLUE}5. Prueba la conexión:${NC}"
echo "   - Backend: cd Backend && node db/supabase.js"
echo "   - Frontend: Abre la app y verifica que no haya errores de Supabase"
echo ""

echo -e "${GREEN}✅ Configuración completada${NC}"
echo ""

echo "📚 Documentación útil:"
echo "   - Supabase JS Client: https://supabase.com/docs/reference/javascript"
echo "   - PostgreSQL en Supabase: https://supabase.com/docs/guides/database"
echo "   - Auth con Supabase: https://supabase.com/docs/guides/auth"
echo ""
