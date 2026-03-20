-- ============================================================
-- PARCHE: Actualizar schema de user_coupons existente
-- Ejecutar en: Supabase SQL Editor → New Query → Run
-- Seguro de re-ejecutar (usa IF NOT EXISTS y IF EXISTS)
-- ============================================================
-- Este parche es necesario porque user_coupons ya existía con
-- un schema antiguo (supabase_migration_V2_COMPLETA.sql) y la
-- migración gamification_migration.sql usó IF NOT EXISTS por lo
-- que no recreó la tabla.
-- ============================================================

-- 1. Agregar columna coupon_definition_id (la que causaba el error 500)
ALTER TABLE user_coupons
  ADD COLUMN IF NOT EXISTS coupon_definition_id INTEGER REFERENCES coupon_definitions(id) ON DELETE CASCADE;

-- 2. Agregar columna used_in_order_id (la que se usa en UPDATE al consumir un cupón)
ALTER TABLE user_coupons
  ADD COLUMN IF NOT EXISTS used_in_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL;

-- 3. Cambiar extra_discount de BOOLEAN a DECIMAL(10,2)
--    Si ya es DECIMAL no hace nada; si es BOOLEAN lo convierte (FALSE→0, TRUE→10)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_coupons'
      AND column_name = 'extra_discount'
      AND data_type = 'boolean'
  ) THEN
    ALTER TABLE user_coupons
      ALTER COLUMN extra_discount TYPE DECIMAL(10,2)
      USING CASE WHEN extra_discount THEN 10 ELSE 0 END;
    ALTER TABLE user_coupons
      ALTER COLUMN extra_discount SET DEFAULT 0;
  END IF;
END $$;

-- 4. Actualizar CHECK constraint de 'type' para incluir 'fixed' y '2x1'
--    (el schema viejo solo tenía 'percentage', 'fixed_amount', 'free_item')
ALTER TABLE user_coupons DROP CONSTRAINT IF EXISTS user_coupons_type_check;
ALTER TABLE user_coupons
  ADD CONSTRAINT user_coupons_type_check
  CHECK (type IN ('percentage', 'fixed', 'fixed_amount', '2x1', 'free_item'));

-- 5. Índice en coupon_definition_id para rendimiento
CREATE INDEX IF NOT EXISTS idx_user_coupons_def_id ON user_coupons(coupon_definition_id);

-- Verificación: muestra las columnas actuales de user_coupons
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_coupons'
ORDER BY ordinal_position;
