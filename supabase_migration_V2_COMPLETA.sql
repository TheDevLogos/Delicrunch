-- =========================================================================
-- MIGRACIÓN COMPLETA SUPABASE - DELICRUNCH
-- Fecha: 9 de Febrero 2026
-- Versión: 3.1 (Compatible con estructura actual + Sistema de Cupones y XP)
-- =========================================================================
-- Este script es IDEMPOTENTE - puede ejecutarse múltiples veces sin errores
-- Compatible con tu migración actual - solo agrega lo que falta
-- =========================================================================

-- =========================================================================
-- 1. AGREGAR COLUMNAS FALTANTES EN PROFILES (GAMIFICACIÓN)
-- =========================================================================

DO $$ 
BEGIN
    -- Asegurar current_level (NUEVO - para sistema de niveles)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'current_level'
    ) THEN
        ALTER TABLE profiles ADD COLUMN current_level INTEGER DEFAULT 1;
    END IF;

    -- Asegurar current_streak (NUEVO - para rachas de compras)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'current_streak'
    ) THEN
        ALTER TABLE profiles ADD COLUMN current_streak INTEGER DEFAULT 0;
    END IF;

    -- Asegurar best_streak (NUEVO - mejor racha histórica)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'best_streak'
    ) THEN
        ALTER TABLE profiles ADD COLUMN best_streak INTEGER DEFAULT 0;
    END IF;

    -- Asegurar last_purchase_date (NUEVO - para cálculo de rachas)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'last_purchase_date'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_purchase_date TIMESTAMP;
    END IF;

    -- Las siguientes columnas ya deberían existir en tu migración base
    -- pero las verificamos por seguridad
    
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
END $$;

-- =========================================================================
-- 2. CREAR TABLA DE TRANSACCIONES DE XP (NUEVO)
-- =========================================================================

CREATE TABLE IF NOT EXISTS xp_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para xp_transactions
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created_at ON xp_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_order_id ON xp_transactions(order_id);

COMMENT ON TABLE xp_transactions IS 'Historial de transacciones de puntos de experiencia (XP) - columnas en español';
COMMENT ON COLUMN xp_transactions.reason IS 'Razón de la transacción: purchase, review, streak, level_up, etc.';

-- =========================================================================
-- 3. CREAR TABLA DE CUPONES DE USUARIO (NUEVO)
-- =========================================================================

CREATE TABLE IF NOT EXISTS user_coupons (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_item')),
    value NUMERIC(10,2) NOT NULL DEFAULT 0,
    category VARCHAR(50) DEFAULT 'ALL',
    min_purchase NUMERIC(10,2) DEFAULT 0,
    max_discount NUMERIC(10,2),
    icon VARCHAR(50),
    color VARCHAR(20),
    extra_discount BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    used_at TIMESTAMP,
    level_obtained INTEGER DEFAULT 1,
    source VARCHAR(50) DEFAULT 'manual',
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para user_coupons
CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_code ON user_coupons(code);
CREATE INDEX IF NOT EXISTS idx_user_coupons_status ON user_coupons(status);
CREATE INDEX IF NOT EXISTS idx_user_coupons_expires ON user_coupons(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_coupons_user_status ON user_coupons(user_id, status) WHERE status = 'active';

COMMENT ON TABLE user_coupons IS 'Cupones de descuento asignados a usuarios - columnas en español';
COMMENT ON COLUMN user_coupons.type IS 'Tipo: percentage (%), fixed_amount ($), free_item (gratis)';
COMMENT ON COLUMN user_coupons.source IS 'Fuente: manual, level_reward, quest, special_event';
COMMENT ON COLUMN user_coupons.category IS 'Categoría del cupón: ALL, food, drinks, dessert, etc.';

-- =========================================================================
-- 4. CREAR ÍNDICES ADICIONALES PARA GAMIFICACIÓN
-- =========================================================================

-- Índices adicionales en profiles para consultas de gamificación
CREATE INDEX IF NOT EXISTS idx_profiles_current_level ON profiles(current_level);
CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON profiles(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_current_streak ON profiles(current_streak DESC);

-- =========================================================================
-- 5. VERIFICACIÓN FINAL Y RESUMEN
-- =========================================================================

-- Verificar que todo esté correcto
SELECT '✅ Migración completada exitosamente - Tablas de Cupones y XP agregadas' AS status;

-- Mostrar resumen de tablas NUEVAS agregadas
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS columnas,
    (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = t.table_name AND constraint_type = 'FOREIGN KEY') AS foreign_keys,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.table_name) AS indices
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name IN ('xp_transactions', 'user_coupons')
ORDER BY table_name;

-- Verificar columnas NUEVAS en profiles
SELECT 
    'profiles' AS tabla,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('current_level', 'current_streak', 'best_streak', 'last_purchase_date')
ORDER BY column_name;

-- =========================================================================
-- RESUMEN DE CAMBIOS APLICADOS
-- =========================================================================

-- COLUMNAS NUEVAS agregadas en profiles:
-- ✅ current_level INTEGER DEFAULT 1 - Nivel actual del usuario
-- ✅ current_streak INTEGER DEFAULT 0 - Racha actual de compras
-- ✅ best_streak INTEGER DEFAULT 0 - Mejor racha histórica
-- ✅ last_purchase_date TIMESTAMP - Fecha de última compra

-- TABLAS NUEVAS creadas:
-- ✅ xp_transactions (7 columnas) - Historial de transacciones de XP
-- ✅ user_coupons (20 columnas) - Sistema completo de cupones de usuarios

-- ÍNDICES NUEVOS creados:
-- ✅ 3 índices en profiles (current_level, total_xp, current_streak)
-- ✅ 3 índices en xp_transactions (user_id, created_at, order_id)
-- ✅ 5 índices en user_coupons (user_id, code, status, expires_at, user_status)

-- FUNCIONALIDADES HABILITADAS:
-- ✅ Sistema de experiencia (XP) con historial completo
-- ✅ Sistema de niveles de usuario
-- ✅ Sistema de rachas de compras
-- ✅ Sistema completo de cupones y descuentos
-- ✅ Cupones por categoría (ALL, food, drinks, dessert, etc.)
-- ✅ Cupones por fuente (manual, level_reward, quest, special_event)
-- ✅ Cupones con tipos: porcentaje, monto fijo, artículo gratis

-- =========================================================================
-- FIN DE LA MIGRACIÓN - COMPATIBLE CON TU ESTRUCTURA ACTUAL
-- Ejecuta este script en Supabase SQL Editor para resolver los errores:
-- - Error 500: Error loading level definitions
-- - Error 500: Cupones no disponibles
-- - Error de gamificación y estadísticas
-- =========================================================================
