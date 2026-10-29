-- Apply before deploying cash ticket rewards. The checks deliberately fail if
-- existing duplicate codes or level rewards need manual reconciliation.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM orders WHERE codigo_recogida IS NOT NULL
             GROUP BY codigo_recogida HAVING COUNT(*) > 1) THEN
    RAISE EXCEPTION 'Duplicate pickup codes require manual reconciliation';
  END IF;
  IF EXISTS (SELECT 1 FROM user_coupons WHERE coupon_definition_id IS NOT NULL
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
ALTER TABLE user_coupons ADD COLUMN IF NOT EXISTS used_in_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL;
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
