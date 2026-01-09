#!/usr/bin/env bash
set -euo pipefail

# Start Dev Environment for Delicrunch
# Usage: ./scripts/start-dev.sh

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

echo "1) Levantando Postgres con docker-compose..."
docker compose up -d postgres

echo "2) Esperando a que Postgres esté listo..."
for i in {1..30}; do
  if docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  echo -n "."
  sleep 1
done

echo ""
echo "3) Aplicando migraciones y seeds completos..."
node Backend/db/migrate.js
node Backend/db/seed.js
node Backend/db/seed-demo.js
node Backend/db/seed-delicias.js
node Backend/db/create-buyer.js
node Backend/db/seed-products-complete.js
# Seed con ofertas flash (>=50% descuento) - opcional si existe
if [ -f Backend/db/seed-flash-deals.js ]; then
  echo "   Ejecutando seed-flash-deals.js (ofertas >=50%)..."
  node Backend/db/seed-flash-deals.js || echo "   ⚠️ seed-flash-deals falló pero se continúa"
else
  echo "   seed-flash-deals.js no encontrado; saltando"
fi
node Backend/db/seed-reviews.js

echo "3.1) Validando y limpiando inconsistencias en la base de datos..."
docker compose exec -T postgres psql -U postgres -d delicrunch << 'EOSQL' || echo "⚠️ Validación falló, continuando..."

-- ===============================================
-- VALIDACION Y LIMPIEZA DE DATOS
-- ===============================================

DO $$ BEGIN RAISE NOTICE 'Iniciando validacion de consistencia de datos...'; END $$;

-- 1. USUARIOS DUPLICADOS
DO $$ BEGIN RAISE NOTICE '1. Verificando usuarios duplicados...'; END $$;
DO $$ 
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT email, COUNT(*) as cnt
    FROM users
    GROUP BY email
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE 'ADVERTENCIA: Encontrados % emails duplicados', duplicate_count;
    DELETE FROM users u1
    WHERE id NOT IN (
      SELECT MIN(id)
      FROM users u2
      WHERE u2.email = u1.email
    );
    RAISE NOTICE 'OK: Usuarios duplicados eliminados';
  ELSE
    RAISE NOTICE 'OK: No hay usuarios duplicados';
  END IF;
END $$;

-- 2. TIENDAS DUPLICADAS POR USUARIO
DO $$ BEGIN RAISE NOTICE '2. Verificando tiendas duplicadas por usuario...'; END $$;
DO $$
DECLARE
  duplicate_stores INTEGER;
  affected_users INTEGER;
  main_store_id INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO affected_users
  FROM (
    SELECT user_id, COUNT(*) as store_count
    FROM stores
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) multi_stores;
  
  IF affected_users > 0 THEN
    RAISE NOTICE 'ADVERTENCIA: % usuarios tienen tiendas duplicadas', affected_users;
    
    FOR duplicate_stores IN 
      SELECT user_id FROM (
        SELECT user_id, COUNT(*) as cnt
        FROM stores
        GROUP BY user_id
        HAVING COUNT(*) > 1
      ) dups
    LOOP
      SELECT MIN(id) INTO main_store_id FROM stores WHERE user_id = duplicate_stores;
      
      UPDATE products SET store_id = main_store_id
      WHERE store_id IN (
        SELECT id FROM stores 
        WHERE user_id = duplicate_stores AND id != main_store_id
      );
      
      UPDATE orders SET store_id = main_store_id
      WHERE store_id IN (
        SELECT id FROM stores 
        WHERE user_id = duplicate_stores AND id != main_store_id
      );
      
      UPDATE reviews SET store_id = main_store_id
      WHERE store_id IN (
        SELECT id FROM stores 
        WHERE user_id = duplicate_stores AND id != main_store_id
      );
      
      DELETE FROM stores 
      WHERE user_id = duplicate_stores AND id != main_store_id;
    END LOOP;
    
    RAISE NOTICE 'OK: Tiendas duplicadas consolidadas';
  ELSE
    RAISE NOTICE 'OK: No hay tiendas duplicadas';
  END IF;
END $$;

-- 3. PRODUCTOS HUERFANOS
DO $$ BEGIN RAISE NOTICE '3. Verificando productos huerfanos...'; END $$;
DO $$
DECLARE
  orphan_products INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_products
  FROM products p
  WHERE NOT EXISTS (SELECT 1 FROM stores s WHERE s.id = p.store_id);
  
  IF orphan_products > 0 THEN
    RAISE NOTICE 'ADVERTENCIA: % productos sin tienda valida encontrados', orphan_products;
    DELETE FROM products 
    WHERE NOT EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id);
    RAISE NOTICE 'OK: Productos huerfanos eliminados';
  ELSE
    RAISE NOTICE 'OK: No hay productos huerfanos';
  END IF;
END $$;

-- 4. PEDIDOS HUERFANOS
DO $$ BEGIN RAISE NOTICE '4. Verificando pedidos huerfanos...'; END $$;
DO $$
DECLARE
  orphan_orders INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_orders
  FROM orders o
  WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = o.user_id)
     OR NOT EXISTS (SELECT 1 FROM stores s WHERE s.id = o.store_id);
  
  IF orphan_orders > 0 THEN
    RAISE NOTICE 'ADVERTENCIA: % pedidos huerfanos encontrados', orphan_orders;
    DELETE FROM order_items
    WHERE order_id IN (
      SELECT o.id FROM orders o
      WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = o.user_id)
         OR NOT EXISTS (SELECT 1 FROM stores s WHERE s.id = o.store_id)
    );
    DELETE FROM orders 
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = user_id)
       OR NOT EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id);
    RAISE NOTICE 'OK: Pedidos huerfanos eliminados';
  ELSE
    RAISE NOTICE 'OK: No hay pedidos huerfanos';
  END IF;
END $$;

-- 5. ORDER_ITEMS HUERFANOS
DO $$ BEGIN RAISE NOTICE '5. Verificando items de pedido huerfanos...'; END $$;
DO $$
DECLARE
  orphan_items INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_items
  FROM order_items oi
  WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.id = oi.order_id)
     OR NOT EXISTS (SELECT 1 FROM products p WHERE p.id = oi.product_id);
  
  IF orphan_items > 0 THEN
    RAISE NOTICE 'ADVERTENCIA: % items de pedido huerfanos encontrados', orphan_items;
    DELETE FROM order_items 
    WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id)
       OR NOT EXISTS (SELECT 1 FROM products p WHERE p.id = product_id);
    RAISE NOTICE 'OK: Items de pedido huerfanos eliminados';
  ELSE
    RAISE NOTICE 'OK: No hay items de pedido huerfanos';
  END IF;
END $$;

-- 6. REVIEWS HUERFANAS
DO $$ BEGIN RAISE NOTICE '6. Verificando reviews huerfanas...'; END $$;
DO $$
DECLARE
  orphan_reviews INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_reviews
  FROM reviews r
  WHERE (r.order_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.id = r.order_id))
     OR NOT EXISTS (SELECT 1 FROM users u WHERE u.id = r.user_id)
     OR NOT EXISTS (SELECT 1 FROM stores s WHERE s.id = r.store_id)
     OR (r.product_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM products p WHERE p.id = r.product_id));
  
  IF orphan_reviews > 0 THEN
    RAISE NOTICE 'ADVERTENCIA: % reviews huerfanas encontradas', orphan_reviews;
    DELETE FROM reviews 
    WHERE (order_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id))
       OR NOT EXISTS (SELECT 1 FROM users u WHERE u.id = user_id)
       OR NOT EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id)
       OR (product_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM products p WHERE p.id = product_id));
    RAISE NOTICE 'OK: Reviews huerfanas eliminadas';
  ELSE
    RAISE NOTICE 'OK: No hay reviews huerfanas';
  END IF;
END $$;

-- 7. PERFILES HUERFANOS
DO $$ BEGIN RAISE NOTICE '7. Verificando perfiles huerfanos...'; END $$;
DO $$
DECLARE
  orphan_profiles INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_profiles
  FROM profiles p
  WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.user_id);
  
  IF orphan_profiles > 0 THEN
    RAISE NOTICE 'ADVERTENCIA: % perfiles huerfanos encontrados', orphan_profiles;
    DELETE FROM profiles 
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = user_id);
    RAISE NOTICE 'OK: Perfiles huerfanos eliminados';
  ELSE
    RAISE NOTICE 'OK: No hay perfiles huerfanos';
  END IF;
END $$;

-- 8. ACTUALIZAR PROMEDIOS DE CALIFICACION
DO $$ BEGIN RAISE NOTICE '8. Recalculando promedios de calificacion...'; END $$;
UPDATE products p
SET calificacion_promedio = COALESCE((
  SELECT ROUND(AVG(calificacion)::numeric, 2)
  FROM reviews r
  WHERE r.product_id = p.id AND r.visible = TRUE
), 0),
total_reviews = COALESCE((
  SELECT COUNT(*)
  FROM reviews r
  WHERE r.product_id = p.id AND r.visible = TRUE
), 0);

UPDATE stores s
SET calificacion_promedio = COALESCE((
  SELECT ROUND(AVG(calificacion)::numeric, 2)
  FROM reviews r
  WHERE r.store_id = s.id AND r.visible = TRUE
), 0),
total_reviews = COALESCE((
  SELECT COUNT(*)
  FROM reviews r
  WHERE r.store_id = s.id AND r.visible = TRUE
), 0);

DO $$ BEGIN RAISE NOTICE 'OK: Promedios actualizados'; END $$;

-- RESUMEN FINAL
DO $$ BEGIN RAISE NOTICE '==========================================='; END $$;
DO $$ BEGIN RAISE NOTICE 'VALIDACION DE DATOS COMPLETADA'; END $$;
DO $$ BEGIN RAISE NOTICE '==========================================='; END $$;

-- Estadisticas finales
DO $$
DECLARE
  total_usuarios INTEGER;
  total_tiendas INTEGER;
  total_productos INTEGER;
  total_pedidos INTEGER;
  total_items INTEGER;
  total_reviews INTEGER;
  total_perfiles INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_usuarios FROM users;
  SELECT COUNT(*) INTO total_tiendas FROM stores;
  SELECT COUNT(*) INTO total_productos FROM products;
  SELECT COUNT(*) INTO total_pedidos FROM orders;
  SELECT COUNT(*) INTO total_items FROM order_items;
  SELECT COUNT(*) INTO total_reviews FROM reviews;
  SELECT COUNT(*) INTO total_perfiles FROM profiles;
  
  RAISE NOTICE 'Estadisticas: Usuarios=%, Tiendas=%, Productos=%, Pedidos=%, Items=%, Reviews=%, Perfiles=%',
    total_usuarios, total_tiendas, total_productos, total_pedidos, total_items, total_reviews, total_perfiles;
END $$;

DO $$ BEGIN RAISE NOTICE 'Base de datos validada y optimizada'; END $$;

EOSQL

echo "4) Iniciando backend (puerto 5001, 0.0.0.0)..."
pids=$(lsof -ti:5001 || true)
if [ -n "$pids" ]; then
  echo "Matando procesos en 5001: $pids"
  kill $pids || true
fi
cd Backend
PORT=5001 HOST=0.0.0.0 node server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
# Guardar PID para gestión
echo "$BACKEND_PID" > "$ROOT/scripts/backend.pid"
cd "$ROOT"

echo "   Esperando a que backend responda..."
for i in {1..30}; do
  if curl -sSf http://localhost:5001/ >/dev/null 2>&1; then
    echo "   Backend listo (PID: $BACKEND_PID)"
    break
  fi
  sleep 1
  if [ "$i" -eq 30 ]; then
    echo "Backend no respondió a tiempo" >&2
    exit 1
  fi
done

# Función: asegurar que el perfil de comprador de demo exista y sea accesible
ensure_demo_profile() {
  echo "   Verificando perfil demo de comprador (/profiles/me)..."
  for attempt in {1..6}; do
    # Intentar login y extraer token usando python para parsear JSON
    LOGIN_RESP=$(curl -s -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"email":"comprador@delicrunch.com","password":"Comprador123"}') || true
    TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys, json
try:
    print(json.load(sys.stdin).get('token',''))
except Exception:
    print('')")

    if [ -n "$TOKEN" ]; then
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "x-auth-token: $TOKEN" http://localhost:5001/api/profiles/me || echo "000")
      if [ "$STATUS" = "200" ]; then
        echo "   ✅ Perfil demo accesible (attempt: $attempt)"
        return 0
      fi
      echo "   Perfil no encontrado (status: $STATUS). Intento: $attempt"
    else
      echo "   Login demo falló o no devolvió token. Intento: $attempt"
    fi

    # Re-intentar crear el usuario/perfil desde el script en caso de 404 o token ausente
    echo "   Ejecutando Backend/db/create-buyer.js para asegurar perfil demo..."
    node Backend/db/create-buyer.js || true
    sleep 1
  done

  echo "   ⚠️ No se pudo verificar el perfil demo después de varios intentos." >&2
  return 1
}

# Ejecutar verificación de perfil demo (no fatal)
ensure_demo_profile || echo "   ⚠️ ensure_demo_profile falló: continúa pero puede causar errores en la app"

echo "5) Configurando API_URL para Expo..."
if [ -n "${CODESPACE_NAME:-}" ] && [ -n "${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-}" ]; then
  API_URL="https://${CODESPACE_NAME}-5001.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/api"
  echo "   Detectado Codespace. API_URL=${API_URL}"
  if command -v gh >/dev/null 2>&1; then
    gh codespace ports visibility 5001:public -c "$CODESPACE_NAME" 2>/dev/null || true
  fi
else
  API_URL="http://localhost:5001/api"
  echo "   Entorno local. API_URL=${API_URL}"
fi
echo "EXPO_PUBLIC_API_URL=${API_URL}" > Frontend/.env
echo "   Frontend/.env actualizado"

echo "5.1) Verificando dependencias críticas..."
# Verificar en directorio raíz
if ! npm list react-native-worklets-core >/dev/null 2>&1; then
  echo "   Instalando react-native-worklets-core en raíz (requerido por reanimated)..."
  npm install react-native-worklets-core --legacy-peer-deps
else
  echo "   react-native-worklets-core ya está instalado en raíz"
fi

# Verificar en Frontend
cd Frontend
if ! npm list react-native-worklets-core >/dev/null 2>&1; then
  echo "   Instalando react-native-worklets-core en Frontend..."
  npm install react-native-worklets-core
else
  echo "   react-native-worklets-core ya está instalado en Frontend"
fi
cd "$ROOT"

echo "6) Iniciando Expo en /Frontend (intentar túnel, con fallback a LAN/Web)..."
# Definir puerto y rutas de logs
EXPO_PORT=${EXPO_PORT:-8081}
EXPO_LOG="$ROOT/scripts/expo.log"
EXPO_PID_FILE="$ROOT/scripts/expo.pid"
rm -f "$EXPO_LOG" "$EXPO_PID_FILE"

# Asegurarse de matar procesos previos
pkill -f "expo start" 2>/dev/null || true
pkill -f "@expo/ngrok" 2>/dev/null || true

# Función para iniciar Expo con modo dado
start_expo() {
  MODE=$1 # tunnel | lan | web
  echo "   Iniciando Expo (modo: $MODE, puerto: $EXPO_PORT). Logs: $EXPO_LOG"
  if [ "$MODE" = "web" ]; then
    (cd Frontend && EXPO_NO_DEBUG=1 npx expo start --web --tunnel --clear > "$EXPO_LOG" 2>&1 &)
  else
    (cd Frontend && EXPO_NO_DEBUG=1 npx expo start --$MODE --tunnel --port "$EXPO_PORT" --clear > "$EXPO_LOG" 2>&1 &)
  fi
  # Guardar PID
  sleep 1
  local pid
  pid=$(pgrep -f "expo start" | head -n1 || true)
  if [ -n "$pid" ]; then
    echo "$pid" > "$EXPO_PID_FILE"
  fi
}

# Intentar iniciar en el modo deseado (puedes forzar con EXPO_MODE=lan|tunnel|web)
MODE=${EXPO_MODE:-tunnel}
start_expo "$MODE"

# Esperar a que el modo elegido se estabilice ('Tunnel ready' o 'Web waiting')
READY=0
for i in {1..40}; do
  if grep -q "Tunnel ready" "$EXPO_LOG" 2>/dev/null || grep -q "Tunnel connected" "$EXPO_LOG" 2>/dev/null || grep -q "Web is waiting" "$EXPO_LOG" 2>/dev/null || grep -q "Local host" "$EXPO_LOG" 2>/dev/null; then
    READY=1
    break
  fi
  sleep 1
done

if [ "$READY" -eq 0 ]; then
  echo "   El túnel no respondió a tiempo o ngrok falló. Reintentando con LAN..."
  # Matar y reintentar con LAN
  if [ -f "$EXPO_PID_FILE" ]; then
    kill "$(cat $EXPO_PID_FILE)" 2>/dev/null || true
    rm -f "$EXPO_PID_FILE"
  fi
  start_expo "lan"
  for i in {1..30}; do
    if grep -q "Local host" "$EXPO_LOG" 2>/dev/null || grep -q "Metro waiting" "$EXPO_LOG" 2>/dev/null || grep -q "Web is waiting" "$EXPO_LOG" 2>/dev/null; then
      READY=1
      break
    fi
    sleep 1
  done
fi

if [ "$READY" -eq 0 ]; then
  echo "   No se pudo iniciar Expo en modo tunnel/lan; iniciando en modo web como último recurso. Revisa $EXPO_LOG para detalles."
  start_expo "web"
fi

# Mostrar credenciales
echo "\nListo. Revisa Metro y las credenciales de prueba. Logs de Expo: $EXPO_LOG"
cat <<'EOF'
Admin: admindeli@delicrunch.com / Admin1234
Comercio: espiga@demo.com / Admin1234
Comprador: comprador@delicrunch.com / Comprador123
Delicias: taqueria.lasdelicias@delicrunch.com / Comercio123
EOF

echo "Prueba rápida de login (local):"
cat <<'CMD'
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admindeli@delicrunch.com","password":"Admin1234"}' || true
CMD

# Verificar credenciales básicas y avisar
echo "Verificando logins de prueba..."
LOGIN_ADMIN=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admindeli@delicrunch.com","password":"Admin1234"}' || echo "000")
LOGIN_COM=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"email":"espiga@demo.com","password":"Admin1234"}' || echo "000")
LOGIN_BUYER=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"email":"comprador@delicrunch.com","password":"Comprador123"}' || echo "000")

if [ "$LOGIN_ADMIN" = "200" ] && [ "$LOGIN_COM" = "200" ] && [ "$LOGIN_BUYER" = "200" ]; then
  echo "   ✅ Logins de prueba verificados correctamente"
else
  echo "   ⚠️ Problema verificando logins: admin=$LOGIN_ADMIN comercio=$LOGIN_COM comprador=$LOGIN_BUYER" >&2
  echo "   Revisa que seeds se hayan aplicado correctamente y consulta $EXPO_LOG para issues de Expo"
fi

# Comprobar cantidad de productos públicos
PRODUCTS_JSON=$(curl -s http://localhost:5001/api/products || echo "[]")
PRODUCTS_COUNT=$(echo "$PRODUCTS_JSON" | grep -o '"id"' | wc -l | tr -d ' ')
if [ "$PRODUCTS_COUNT" -ge 10 ]; then
  echo "   ✅ Productos públicos verificados: $PRODUCTS_COUNT productos"
else
  echo "   ⚠️ Se detectaron solo $PRODUCTS_COUNT productos públicos. Esperado >= 10" >&2
  echo "   Revisa los seeds de productos y vuelve a ejecutar: node Backend/db/seed-products-complete.js"
fi

# Comprobar tiendas con productos
STORES_JSON=$(curl -s http://localhost:5001/api/stores/with-products || echo "[]")
STORES_COUNT=$(echo "$STORES_JSON" | grep -o '"id"' | wc -l | tr -d ' ')
if [ "$STORES_COUNT" -ge 3 ]; then
  echo "   ✅ Tiendas con productos verificadas: $STORES_COUNT tiendas"
else
  echo "   ⚠️ Se detectaron solo $STORES_COUNT tiendas con productos. Esperado >= 3" >&2
  echo "   Revisa los seeds de tiendas: node Backend/db/seed-delicias.js"
fi

# Verificar que EXPO_PUBLIC_API_URL está configurada
if grep -q '^EXPO_PUBLIC_API_URL=' Frontend/.env 2>/dev/null; then
  echo "   ✅ EXPO_PUBLIC_API_URL presente en Frontend/.env"
else
  echo "   ⚠️ EXPO_PUBLIC_API_URL no configurada en Frontend/.env" >&2
fi
