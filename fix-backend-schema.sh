#!/bin/bash

# Script para corregir nombres de columnas en controladores
# según el esquema real de Supabase

echo "🔧 Corrigiendo controladores de Backend..."

# Directorio de trabajo
cd /workspaces/Delicrunch/Backend/controllers

# 1. Reemplazar seller_id por store_id en productController.js
echo "📝 Corrigiendo productController.js..."
sed -i 's/seller_id/store_id/g' productController.js
sed -i 's/store_id = req\.user\.id/user_id = req.user.id; const storeResult = await pool.query("SELECT id FROM stores WHERE user_id = \$1", [user_id]); if (storeResult.rows.length === 0) return res.status(404).json({ msg: "No se encontró tienda asociada" }); const store_id = storeResult.rows[0].id/g' productController.js

# 2. Corregir nombres de columnas en inglés a español
echo "📝 Corrigiendo nombres de columnas..."

# Users
sed -i 's/u\.name AS/u.nombre AS/g' *.js
sed -i 's/users\.name/users.nombre/g' *.js

# Products (en SELECTs)
sed -i 's/p\.name as /p.nombre as /g' *.js
sed -i 's/p\.description as /p.descripcion as /g' *.js  
sed -i 's/p\.price as /p.precio_descuento as /g' *.js
sed -i 's/p\.compare_price as /p.precio_original as /g' *.js
sed -i 's/p\.stock as /p.cantidad_disponible as /g' *.js
sed -i 's/p\.category as /p.categoria as /g' *.js
sed -i 's/p\.image_url as /p.imagen_url as /g' *.js
sed -i 's/p\.is_active as /p.activo as /g' *.js

# Reviews
sed -i 's/r\.rating/r.calificacion/g' *.js
sed -i 's/r\.comment/r.comentario/g' *.js

echo "✅ Correcciones completadas"
echo ""
echo "📋 Archivos modificados:"
ls -1 *.js
