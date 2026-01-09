#!/bin/bash
# Script para consolidar tiendas duplicadas y asociar productos a la tienda principal

set -e

echo "🔧 Consolidación de tiendas duplicadas para Panadería La Espiga"
echo ""

# Ejecutar consolidación en PostgreSQL
docker compose exec -T postgres psql -U postgres -d delicrunch << 'EOSQL'

-- 1. Ver el problema actual
SELECT '=== ANTES DE LA CONSOLIDACIÓN ===' as status;
SELECT COUNT(*) as tiendas_duplicadas FROM stores WHERE user_id = 2;
SELECT COUNT(*) as productos_esparcidos FROM products WHERE store_id IN (SELECT id FROM stores WHERE user_id = 2);

-- 2. Consolidar: Mantener solo la tienda ID 1, mover todos los productos a ella
UPDATE products 
SET store_id = 1 
WHERE store_id IN (SELECT id FROM stores WHERE user_id = 2 AND id != 1);

-- 3. Mover todos los pedidos a la tienda principal
UPDATE orders 
SET store_id = 1 
WHERE store_id IN (SELECT id FROM stores WHERE user_id = 2 AND id != 1);

-- 4. Eliminar tiendas duplicadas (mantener solo ID 1)
DELETE FROM stores WHERE user_id = 2 AND id != 1;

-- 5. Verificar resultado
SELECT '=== DESPUÉS DE LA CONSOLIDACIÓN ===' as status;
SELECT COUNT(*) as tiendas_restantes FROM stores WHERE user_id = 2;
SELECT COUNT(*) as productos_consolidados FROM products WHERE store_id = 1;
SELECT COUNT(*) as pedidos_consolidados FROM orders WHERE store_id = 1;

-- 6. Mostrar resumen
SELECT 
  s.id, 
  s.nombre_comercio, 
  s.user_id,
  u.email,
  COUNT(DISTINCT p.id) as total_productos,
  COUNT(DISTINCT o.id) as total_pedidos
FROM stores s
JOIN users u ON s.user_id = u.id
LEFT JOIN products p ON p.store_id = s.id
LEFT JOIN orders o ON o.store_id = s.id
WHERE s.user_id = 2
GROUP BY s.id, s.nombre_comercio, s.user_id, u.email;

EOSQL

echo ""
echo "✅ Consolidación completada"
echo ""
echo "Reiniciando backend para aplicar cambios..."
pkill -f "node.*server.js" || true
sleep 2
cd /workspaces/Delicrunch/Backend && PORT=5001 HOST=0.0.0.0 node server.js > ../backend.log 2>&1 &
sleep 3
echo "✅ Backend reiniciado"
