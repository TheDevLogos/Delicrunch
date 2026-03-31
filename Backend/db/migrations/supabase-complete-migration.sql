-- =========================================================================
-- MIGRACIÓN COMPLETA PARA SUPABASE - DELICRUNCH
-- Fecha: 2026-02-07
-- Descripción: Asegurar que todas las tablas tienen las columnas correctas
--              en español y las relaciones apropiadas
-- =========================================================================

-- =========================================================================
-- 1. VERIFICAR Y AGREGAR COLUMNAS FALTANTES EN ORDERS
-- =========================================================================

-- Asegurar que orders tiene todas las columnas necesarias
DO $$ 
BEGIN
    -- Agregar columna mercadopago_preference_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'mercadopago_preference_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN mercadopago_preference_id VARCHAR(255);
        CREATE INDEX IF NOT EXISTS idx_orders_mp_preference ON orders(mercadopago_preference_id);
    END IF;

    -- Agregar columna mercadopago_payment_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'mercadopago_payment_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN mercadopago_payment_id VARCHAR(255);
        CREATE INDEX IF NOT EXISTS idx_orders_mp_payment ON orders(mercadopago_payment_id);
    END IF;

    -- Asegurar que existe codigo_recogida
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'codigo_recogida'
    ) THEN
        ALTER TABLE orders ADD COLUMN codigo_recogida VARCHAR(10) NOT NULL DEFAULT '';
        CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_codigo_recogida ON orders(codigo_recogida);
    END IF;

    -- Asegurar índices
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
    CREATE INDEX IF NOT EXISTS idx_orders_estado ON orders(estado);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
END $$;

-- =========================================================================
-- 2. VERIFICAR Y AGREGAR COLUMNAS FALTANTES EN PRODUCTS
-- =========================================================================

DO $$ 
BEGIN
    -- Asegurar que products tiene store_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'store_id'
    ) THEN
        ALTER TABLE products ADD COLUMN store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
    END IF;

    -- Asegurar índices adicionales
    CREATE INDEX IF NOT EXISTS idx_products_activo ON products(activo);
    CREATE INDEX IF NOT EXISTS idx_products_categoria ON products(categoria);
    CREATE INDEX IF NOT EXISTS idx_products_destacado ON products(destacado) WHERE destacado = true;
END $$;

-- =========================================================================
-- 3. VERIFICAR Y AGREGAR COLUMNAS FALTANTES EN STORES
-- =========================================================================

DO $$ 
BEGIN
    -- Asegurar columnas de MercadoPago
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' AND column_name = 'mercadopago_user_id'
    ) THEN
        ALTER TABLE stores ADD COLUMN mercadopago_user_id VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' AND column_name = 'mercadopago_public_key'
    ) THEN
        ALTER TABLE stores ADD COLUMN mercadopago_public_key TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' AND column_name = 'mercadopago_access_token'
    ) THEN
        ALTER TABLE stores ADD COLUMN mercadopago_access_token TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' AND column_name = 'mercadopago_onboarding_complete'
    ) THEN
        ALTER TABLE stores ADD COLUMN mercadopago_onboarding_complete BOOLEAN DEFAULT FALSE;
    END IF;

    -- Asegurar comision_plataforma
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' AND column_name = 'comision_plataforma'
    ) THEN
        ALTER TABLE stores ADD COLUMN comision_plataforma NUMERIC(5,2) DEFAULT 25.00;
    END IF;

    -- Índices
    CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);
    CREATE INDEX IF NOT EXISTS idx_stores_activo ON stores(activo) WHERE activo = true;
END $$;

-- =========================================================================
-- 4. VERIFICAR Y CREAR TABLA PAYMENT_PREFERENCES
-- =========================================================================

CREATE TABLE IF NOT EXISTS payment_preferences (
    id SERIAL PRIMARY KEY,
    mercadopago_preference_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    store_id INTEGER,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'MXN',
    platform_fee_amount NUMERIC(10,2),
    merchant_amount NUMERIC(10,2),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    metadata JSONB,
    external_reference TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para payment_preferences
CREATE INDEX IF NOT EXISTS idx_payment_preferences_user ON payment_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_preferences_product ON payment_preferences(product_id);
CREATE INDEX IF NOT EXISTS idx_payment_preferences_store ON payment_preferences(store_id);
CREATE INDEX IF NOT EXISTS idx_payment_preferences_status ON payment_preferences(status);

-- Comentarios
COMMENT ON TABLE payment_preferences IS 'Registro de preferencias de Mercado Pago Checkout Pro';

-- =========================================================================
-- 5. VERIFICAR COLUMNAS EN ORDER_ITEMS
-- =========================================================================

DO $$ 
BEGIN
    -- Asegurar que order_items tiene las columnas en español
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'cantidad'
    ) THEN
        ALTER TABLE order_items ADD COLUMN cantidad INTEGER NOT NULL DEFAULT 1;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'precio_unitario'
    ) THEN
        ALTER TABLE order_items ADD COLUMN precio_unitario NUMERIC(10,2) NOT NULL DEFAULT 0;
    END IF;

    -- Índices
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
END $$;

-- =========================================================================
-- 6. VERIFICAR COLUMNAS EN USERS
-- =========================================================================

DO $$ 
BEGIN
    -- Asegurar que users tiene 'rol' y no 'role'
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'rol'
    ) THEN
        ALTER TABLE users ADD COLUMN rol VARCHAR(50) NOT NULL DEFAULT 'cliente';
        CREATE INDEX IF NOT EXISTS idx_users_rol ON users(rol);
    END IF;

    -- Asegurar que users tiene 'nombre'
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'nombre'
    ) THEN
        ALTER TABLE users ADD COLUMN nombre VARCHAR(255);
    END IF;

    -- Índices adicionales
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
END $$;

-- =========================================================================
-- 7. VERIFICAR Y AGREGAR COLUMNAS EN PROFILES
-- =========================================================================

DO $$ 
BEGIN
    -- Asegurar columnas de gamificación
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'total_xp'
    ) THEN
        ALTER TABLE profiles ADD COLUMN total_xp INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'total_packs_saved'
    ) THEN
        ALTER TABLE profiles ADD COLUMN total_packs_saved INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'unlocked_badges'
    ) THEN
        ALTER TABLE profiles ADD COLUMN unlocked_badges JSONB DEFAULT '[]';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'mercadopago_customer_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN mercadopago_customer_id VARCHAR(255);
    END IF;

    -- Índice
    CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
END $$;

-- =========================================================================
-- 8. VERIFICAR COLUMNAS EN REVIEWS
-- =========================================================================

DO $$ 
BEGIN
    -- Asegurar que reviews tiene todas las columnas necesarias
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reviews' AND column_name = 'product_id'
    ) THEN
        ALTER TABLE reviews ADD COLUMN product_id BIGINT REFERENCES products(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reviews' AND column_name = 'calidad_comida'
    ) THEN
        ALTER TABLE reviews ADD COLUMN calidad_comida INTEGER;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reviews' AND column_name = 'valor_precio'
    ) THEN
        ALTER TABLE reviews ADD COLUMN valor_precio INTEGER;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reviews' AND column_name = 'experiencia_recogida'
    ) THEN
        ALTER TABLE reviews ADD COLUMN experiencia_recogida INTEGER;
    END IF;

    -- Índices
    CREATE INDEX IF NOT EXISTS idx_reviews_store_id ON reviews(store_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
END $$;

-- =========================================================================
-- 9. ACTUALIZAR VALORES DEFAULT Y RESTRICCIONES
-- =========================================================================

-- Actualizar defaults en orders
ALTER TABLE orders ALTER COLUMN estado SET DEFAULT 'pendiente';
ALTER TABLE orders ALTER COLUMN comision_plataforma SET DEFAULT 0.00;

-- Actualizar defaults en products
ALTER TABLE products ALTER COLUMN activo SET DEFAULT TRUE;
ALTER TABLE products ALTER COLUMN destacado SET DEFAULT FALSE;
ALTER TABLE products ALTER COLUMN producto_listo SET DEFAULT FALSE;

-- Actualizar defaults en stores
ALTER TABLE stores ALTER COLUMN activo SET DEFAULT TRUE;

-- =========================================================================
-- 10. AGREGAR COMENTARIOS A LAS TABLAS (DOCUMENTACIÓN)
-- =========================================================================

COMMENT ON TABLE orders IS 'Pedidos realizados por usuarios (columnas en español)';
COMMENT ON TABLE products IS 'Productos disponibles en las tiendas (columnas en español)';
COMMENT ON TABLE stores IS 'Tiendas/Comercios registrados (columnas en español)';
COMMENT ON TABLE order_items IS 'Ítems de cada pedido (columnas en español)';
COMMENT ON TABLE reviews IS 'Reseñas de usuarios sobre productos y tiendas';
COMMENT ON TABLE profiles IS 'Perfiles extendidos de usuarios con estadísticas';

-- =========================================================================
-- 11. VERIFICAR INTEGRIDAD REFERENCIAL
-- =========================================================================

-- Asegurar que todas las FK estén correctamente definidas
DO $$ 
BEGIN
    -- FK de orders a stores
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_store_id_fkey' AND table_name = 'orders'
    ) THEN
        ALTER TABLE orders ADD CONSTRAINT orders_store_id_fkey 
            FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
    END IF;

    -- FK de orders a users
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_user_id_fkey' AND table_name = 'orders'
    ) THEN
        ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- FK de products a stores
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'products_store_id_fkey' AND table_name = 'products'
    ) THEN
        ALTER TABLE products ADD CONSTRAINT products_store_id_fkey 
            FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =========================================================================
-- 12. LIMPIAR POSIBLES DATOS INCONSISTENTES
-- =========================================================================

-- Actualizar estados nulos a valores por defecto
UPDATE orders SET estado = 'pendiente' WHERE estado IS NULL;
UPDATE products SET activo = TRUE WHERE activo IS NULL;
UPDATE stores SET activo = TRUE WHERE activo IS NULL;

-- =========================================================================
-- FIN DE LA MIGRACIÓN
-- =========================================================================

-- Verificar que todo esté correcto
SELECT 'Migración completada exitosamente' AS status;

-- Mostrar resumen de tablas
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS columnas,
    (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = t.table_name AND constraint_type = 'FOREIGN KEY') AS foreign_keys
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
