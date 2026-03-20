-- ============================================================
-- MIGRACIÓN: Sistema de Gamificación (Cupones, XP, Niveles)
-- Ejecutar en: Supabase SQL Editor → New Query → Run
-- Seguro de re-ejecutar (usa IF NOT EXISTS y ON CONFLICT)
-- ============================================================

-- 1. Tabla de definiciones de cupones (plantillas por nivel)
CREATE TABLE IF NOT EXISTS coupon_definitions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed', '2x1', 'free_item')),
  value DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) DEFAULT 'ALL',
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2) DEFAULT 999,
  valid_days INTEGER DEFAULT 30,
  level_required INTEGER DEFAULT 1,
  icon VARCHAR(50) DEFAULT 'gift',
  color VARCHAR(20) DEFAULT '#34C759',
  extra_discount DECIMAL(10,2) DEFAULT 0,
  priority BOOLEAN DEFAULT FALSE,
  free_monthly_pack BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de cupones por usuario (instancias obtenidas)
CREATE TABLE IF NOT EXISTS user_coupons (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  coupon_definition_id INTEGER REFERENCES coupon_definitions(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) DEFAULT 'ALL',
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2) DEFAULT 999,
  icon VARCHAR(50) DEFAULT 'gift',
  color VARCHAR(20) DEFAULT '#34C759',
  extra_discount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  used_in_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  level_obtained INTEGER DEFAULT 1,
  source VARCHAR(50) DEFAULT 'level_reward',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de transacciones de XP
CREATE TABLE IF NOT EXISTS xp_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  multiplier DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Columnas de gamificación en profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_purchase_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_icon_id VARCHAR(50);

-- 5. Columnas de cupón en orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id INTEGER REFERENCES user_coupons(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount DECIMAL(10,2) DEFAULT 0;

-- 6. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_status ON user_coupons(status);
CREATE INDEX IF NOT EXISTS idx_user_coupons_expires ON user_coupons(expires_at);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(user_id);

-- 7. Definiciones de cupones por nivel (idempotente)
INSERT INTO coupon_definitions (code, name, type, value, category, min_purchase, max_discount, valid_days, level_required, icon, color, extra_discount, priority, free_monthly_pack)
VALUES
  ('welcome_5',       '¡Bienvenido Rescatador!', 'percentage', 5,   'ALL',         0,   50,  30, 2,  'gift',       '#34C759', 0,  false, false),
  ('bronze_veggie',   'Veggie Explorer',          'percentage', 10,  'VEGETARIANO', 50,  30,  21, 3,  'leaf',       '#34C759', 0,  false, false),
  ('silver_mex',      'Sabor Mexicano',            'fixed',      15,  'MEXICANO',    60,  15,  21, 4,  'flame',      '#FF6B35', 0,  false, false),
  ('silver_cafe',     'Coffee Lover',              '2x1',        100, 'CAFE',        0,   80,  14, 5,  'cafe',       '#8B4513', 0,  false, false),
  ('silver_sweet',    'Dulce Recompensa',           'percentage', 15,  'REPOSTERIA',  40,  50,  21, 6,  'ice-cream',  '#FF9500', 0,  false, false),
  ('gold_all',        'Oro Universal',              'percentage', 12,  'ALL',         50,  60,  30, 7,  'star',       '#FFD700', 0,  false, false),
  ('gold_sushi',      'Sushi Master',               '2x1',        100, 'SUSHI',       80,  120, 14, 8,  'fish',       '#E91E63', 0,  false, false),
  ('gold_healthy',    'Vida Saludable',              'fixed',      25,  'SALUDABLE',   100, 25,  21, 9,  'nutrition',  '#4CAF50', 0,  false, false),
  ('platinum_pizza',  'Pizza Premium',              'percentage', 20,  'PIZZA',       60,  80,  30, 10, 'pizza',      '#FF5722', 0,  false, false),
  ('platinum_bread',  'Pan Artesanal',              '2x1',        100, 'PANADERIA',   50,  100, 21, 11, 'restaurant', '#D2691E', 10, false, false),
  ('platinum_elite',  'Élite Platino',              'percentage', 18,  'ALL',         80,  100, 45, 12, 'diamond',    '#E5E4E2', 0,  true,  false),
  ('diamond_mex_2x1', 'Diamante Mexicano',          '2x1',        100, 'MEXICANO',    70,  150, 30, 13, 'flame',      '#B9F2FF', 10, false, false),
  ('diamond_super',   'Super Diamante',             'percentage', 25,  'ALL',         100, 150, 60, 14, 'sparkles',   '#B9F2FF', 0,  false, false),
  ('diamond_legend',  'Leyenda Diamante',           'percentage', 30,  'ALL',         0,   200, 90, 15, 'trophy',     '#FFD700', 0,  true,  true)
ON CONFLICT (code) DO UPDATE SET
  name           = EXCLUDED.name,
  type           = EXCLUDED.type,
  value          = EXCLUDED.value,
  category       = EXCLUDED.category,
  min_purchase   = EXCLUDED.min_purchase,
  max_discount   = EXCLUDED.max_discount,
  valid_days     = EXCLUDED.valid_days,
  level_required = EXCLUDED.level_required,
  icon           = EXCLUDED.icon,
  color          = EXCLUDED.color,
  extra_discount = EXCLUDED.extra_discount,
  priority       = EXCLUDED.priority,
  free_monthly_pack = EXCLUDED.free_monthly_pack;

-- Verificación final
SELECT 'coupon_definitions' AS tabla, COUNT(*) AS filas FROM coupon_definitions
UNION ALL
SELECT 'user_coupons', COUNT(*) FROM user_coupons
UNION ALL
SELECT 'xp_transactions', COUNT(*) FROM xp_transactions
UNION ALL
SELECT 'profiles_con_total_xp', COUNT(*) FROM profiles WHERE total_xp IS NOT NULL;
