-- ========================================
-- MAPEO DE COMPATIBILIDAD: seller_id <-> store_id
-- Adaptación para integración de Mercado Pago
-- ========================================

-- Nota: La base de datos actual usa seller_id (referencia a users)
-- El código del backend usa store_id (referencia a stores)
-- Esta migración crea las columnas necesarias y mapeos

-- ========================================
-- 1. PRODUCTS: Agregar store_id y mantener seller_id
-- ========================================
-- Agregar columna store_id si no existe
ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);

-- Actualizar store_id basándose en seller_id
-- Asumiendo que cada seller (user) tiene una store
UPDATE products p
SET store_id = s.id
FROM stores s
WHERE p.seller_id = s.user_id
AND p.store_id IS NULL;

-- ========================================
-- 2. ORDERS: Agregar store_id y mapear desde seller_id
-- ========================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES stores(id) ON DELETE SET NULL;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);

-- Actualizar store_id basándose en seller_id
UPDATE orders o
SET store_id = s.id
FROM stores s
WHERE o.seller_id = s.user_id
AND o.store_id IS NULL;

-- ========================================
-- 3. REVIEWS: Agregar store_id si falta
-- ========================================
-- Ya debería existir, pero por si acaso
CREATE INDEX IF NOT EXISTS idx_reviews_store_id ON reviews(store_id);

-- ========================================
-- 4. TRIGGER: Mantener sincronizado store_id cuando se inserta/actualiza
-- ========================================

-- Para PRODUCTS
CREATE OR REPLACE FUNCTION sync_products_store_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se establece seller_id, buscar su store_id
    IF NEW.seller_id IS NOT NULL THEN
        SELECT id INTO NEW.store_id
        FROM stores
        WHERE user_id = NEW.seller_id
        LIMIT 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_products_store_id ON products;
CREATE TRIGGER trigger_sync_products_store_id
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    WHEN (NEW.seller_id IS NOT NULL)
    EXECUTE FUNCTION sync_products_store_id();

-- Para ORDERS
CREATE OR REPLACE FUNCTION sync_orders_store_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se establece seller_id, buscar su store_id
    IF NEW.seller_id IS NOT NULL THEN
        SELECT id INTO NEW.store_id
        FROM stores
        WHERE user_id = NEW.seller_id
        LIMIT 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_orders_store_id ON orders;
CREATE TRIGGER trigger_sync_orders_store_id
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    WHEN (NEW.seller_id IS NOT NULL)
    EXECUTE FUNCTION sync_orders_store_id();

-- ========================================
-- 5. ACTUALIZAR VISTAS para usar store_id de manera consistente
-- ========================================

-- Vista de detalles de pago (ya corregida usa seller_id)
-- No requiere cambios adicionales

-- ========================================
-- VERIFICACIÓN
-- ========================================
-- Contar productos sin store_id asignado
DO $$
DECLARE
    productos_sin_store INTEGER;
    ordenes_sin_store INTEGER;
BEGIN
    SELECT COUNT(*) INTO productos_sin_store
    FROM products
    WHERE seller_id IS NOT NULL AND store_id IS NULL;
    
    SELECT COUNT(*) INTO ordenes_sin_store
    FROM orders
    WHERE seller_id IS NOT NULL AND store_id IS NULL;
    
    RAISE NOTICE 'Productos sin store_id: %', productos_sin_store;
    RAISE NOTICE 'Órdenes sin store_id: %', ordenes_sin_store;
    
    IF productos_sin_store > 0 OR ordenes_sin_store > 0 THEN
        RAISE WARNING 'Algunos registros no tienen store_id asignado. Puede ser que no exista una tienda para ese seller.';
    ELSE
        RAISE NOTICE 'Todos los registros tienen store_id asignado correctamente.';
    END IF;
END $$;

-- ========================================
-- REGISTRAR MIGRACIÓN
-- ========================================
INSERT INTO migration_history (migration_name) 
VALUES ('seller_id_store_id_mapping_2026_01_23')
ON CONFLICT (migration_name) DO NOTHING;

-- Mostrar resumen
SELECT 
    'products' as tabla,
    COUNT(*) as total,
    COUNT(store_id) as con_store_id,
    COUNT(*) - COUNT(store_id) as sin_store_id
FROM products
UNION ALL
SELECT 
    'orders',
    COUNT(*),
    COUNT(store_id),
    COUNT(*) - COUNT(store_id)
FROM orders;
