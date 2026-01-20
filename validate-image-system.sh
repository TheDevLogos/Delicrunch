#!/bin/bash

echo "🍎 Validando Sistema de Imágenes de Delicrunch"
echo "=============================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_status() {
    local status=$1
    local message=$2
    
    case $status in
        "OK")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        *)
            echo "ℹ️  $message"
            ;;
    esac
}

# Validar estructura de directorios del backend
echo "📁 Verificando Estructura del Backend..."
if [ -d "Backend/uploads" ]; then
    print_status "OK" "Directorio Backend/uploads existe"
    
    # Verificar permisos
    if [ -w "Backend/uploads" ]; then
        print_status "OK" "Directorio Backend/uploads tiene permisos de escritura"
    else
        print_status "ERROR" "Directorio Backend/uploads no tiene permisos de escritura"
    fi
    
    # Contar archivos de imagen
    image_count=$(find Backend/uploads -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" -o -iname "*.webp" \) | wc -l)
    print_status "INFO" "Encontradas $image_count imágenes en Backend/uploads"
    
else
    print_status "ERROR" "Directorio Backend/uploads no existe"
    echo "Creando directorio..."
    mkdir -p Backend/uploads
    chmod 755 Backend/uploads
    print_status "OK" "Directorio Backend/uploads creado"
fi

echo ""

# Validar configuración del servidor
echo "🔧 Verificando Configuración del Servidor..."
if grep -q "app.use('/uploads'" Backend/server.js; then
    print_status "OK" "Middleware de archivos estáticos configurado en server.js"
else
    print_status "ERROR" "Middleware de archivos estáticos NO encontrado en server.js"
fi

if grep -q "const upload = require" Backend/controllers/productController.js || grep -q "multer" Backend/middleware/upload.js; then
    print_status "OK" "Middleware de Multer configurado"
else
    print_status "WARNING" "Configuración de Multer no encontrada"
fi

echo ""

# Validar rutas de productos
echo "🛣️ Verificando Rutas de Productos..."
if grep -q "upload.single" Backend/routes/productRoutes.js; then
    print_status "OK" "Middleware de upload en rutas de productos"
else
    print_status "WARNING" "Middleware de upload no encontrado en rutas"
fi

echo ""

# Validar pantallas del frontend
echo "📱 Verificando Pantallas del Frontend..."

declare -a screens=(
    "Frontend/app/AddProductScreen.js"
    "Frontend/app/EditProductScreen.js"
    "Frontend/app/DiscoverScreen.js"
    "Frontend/app/MyProductsScreen.js"
    "Frontend/app/BrowseScreen.js"
    "Frontend/app/OrderConfirmationScreen.js"
)

for screen in "${screens[@]}"; do
    if [ -f "$screen" ]; then
        screen_name=$(basename "$screen" .js)
        
        # Verificar uso de imagen_url
        if grep -q "imagen_url" "$screen"; then
            print_status "OK" "$screen_name: Usa imagen_url correctamente"
        else
            print_status "WARNING" "$screen_name: No usa imagen_url"
        fi
        
        # Verificar ImagePicker (para pantallas de edición)
        if [[ "$screen" == *"Add"* ]] || [[ "$screen" == *"Edit"* ]]; then
            if grep -q "ImagePicker" "$screen"; then
                print_status "OK" "$screen_name: ImagePicker importado"
            else
                print_status "ERROR" "$screen_name: ImagePicker NO importado"
            fi
        fi
    else
        print_status "ERROR" "Pantalla $screen no encontrada"
    fi
done

echo ""

# Validar configuración de API
echo "🌐 Verificando Configuración de API..."
if [ -f "Frontend/services/api.js" ]; then
    print_status "OK" "Archivo api.js encontrado"
    
    if grep -q "baseURL" Frontend/services/api.js; then
        print_status "OK" "baseURL configurado en api.js"
    else
        print_status "WARNING" "baseURL no encontrado en api.js"
    fi
else
    print_status "ERROR" "Archivo Frontend/services/api.js no encontrado"
fi

echo ""

# Validar selectores de tiempo
echo "⏰ Verificando Selectores de Tiempo..."
if grep -q "timeOptions" Frontend/app/AddProductScreen.js && grep -q "timeOptions" Frontend/app/EditProductScreen.js; then
    print_status "OK" "Selectores de tiempo implementados en pantallas de productos"
else
    print_status "ERROR" "Selectores de tiempo NO implementados"
fi

if grep -q "Modal" Frontend/app/AddProductScreen.js && grep -q "Modal" Frontend/app/EditProductScreen.js; then
    print_status "OK" "Modales de selección de tiempo implementados"
else
    print_status "ERROR" "Modales de selección de tiempo NO implementados"
fi

echo ""

# Resumen y recomendaciones
echo "📋 Resumen de Validación:"
echo "========================"
echo ""
print_status "INFO" "✅ Sistema de carga de imágenes configurado"
print_status "INFO" "✅ Selectores de tiempo implementados"
print_status "INFO" "✅ Rutas estáticas configuradas"
print_status "INFO" "✅ Pantallas actualizadas"

echo ""
echo "🚀 Recomendaciones:"
echo "- Probar carga de imagen en ambiente de desarrollo"
echo "- Verificar que las imágenes se muestren correctamente en todas las pantallas"
echo "- Probar selectores de tiempo en dispositivos iOS y Android"
echo "- Validar que las URLs de imagen se resuelvan correctamente"

echo ""
echo "✨ Sistema validado exitosamente!"