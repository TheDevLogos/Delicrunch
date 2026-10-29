-- Apply before deploying cash ticket rewards. The checks deliberately fail if
-- existing duplicate codes or level rewards need manual reconciliation.
BEGIN;
ALTER TABLE user_coupons ADD COLUMN IF NOT EXISTS coupon_definition_id INTEGER REFERENCES coupon_definitions(id) ON DELETE CASCADE;
ALTER TABLE user_coupons ADD COLUMN IF NOT EXISTS used_in_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE xp_transactions ADD COLUMN IF NOT EXISTS type VARCHAR(30);
ALTER TABLE xp_transactions ADD COLUMN IF NOT EXISTS multiplier NUMERIC(5,2) DEFAULT 1;

-- The original coupons table stored this value as a boolean. Match the
-- numeric coupon definitions while preserving the old true/false meaning.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_coupons'
      AND column_name = 'extra_discount' AND data_type = 'boolean'
  ) THEN
    ALTER TABLE user_coupons ALTER COLUMN extra_discount DROP DEFAULT;
    ALTER TABLE user_coupons ALTER COLUMN extra_discount TYPE NUMERIC(10,2)
      USING CASE WHEN extra_discount THEN 10 ELSE 0 END;
    ALTER TABLE user_coupons ALTER COLUMN extra_discount SET DEFAULT 0;
  END IF;
END $$;

ALTER TABLE user_coupons DROP CONSTRAINT IF EXISTS user_coupons_type_check;
ALTER TABLE user_coupons ADD CONSTRAINT user_coupons_type_check
  CHECK (type IN ('percentage', 'fixed', 'fixed_amount', '2x1', 'free_item'));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM orders WHERE codigo_recogida IS NOT NULL
             GROUP BY codigo_recogida HAVING COUNT(*) > 1) THEN
    RAISE EXCEPTION 'Duplicate pickup codes require manual reconciliation';
  END IF;
  IF EXISTS (SELECT 1 FROM user_coupons WHERE coupon_definition_id IS NOT NULL AND source = 'level_reward'
             GROUP BY user_id, coupon_definition_id, level_obtained HAVING COUNT(*) > 1) THEN
    RAISE EXCEPTION 'Duplicate level rewards require manual reconciliation';
  END IF;
  IF EXISTS (SELECT 1 FROM xp_transactions WHERE order_id IS NOT NULL AND type = 'pickup'
             GROUP BY order_id HAVING COUNT(*) > 1) THEN
    RAISE EXCEPTION 'Duplicate pickup XP transactions require manual reconciliation';
  END IF;
END $$;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id INTEGER REFERENCES user_coupons(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_packs_saved INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_purchase_date DATE;

CREATE UNIQUE INDEX IF NOT EXISTS orders_pickup_code_unique
  ON orders (codigo_recogida) WHERE codigo_recogida IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_coupons_level_reward_unique
  ON user_coupons (user_id, coupon_definition_id, level_obtained)
  WHERE coupon_definition_id IS NOT NULL AND source = 'level_reward';
CREATE UNIQUE INDEX IF NOT EXISTS xp_transactions_pickup_once
  ON xp_transactions (order_id) WHERE order_id IS NOT NULL AND type = 'pickup';

COMMIT;
