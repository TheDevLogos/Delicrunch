/**
 * Migración: Sistema de Cupones para Compradores
 * Crea las tablas necesarias para gestionar cupones y recompensas
 */
const pool = require('./index');

const migrateCoupons = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🎫 Iniciando migración de sistema de cupones...\n');

    // Tabla de definición de cupones (plantillas)
    await client.query(`
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
    `);
    console.log('✓ Tabla coupon_definitions creada');

    // Tabla de cupones de usuario (instancias obtenidas)
    await client.query(`
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
        -- Estado del cupón
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
        -- Fechas
        obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        -- Orden donde se usó (si aplica)
        used_in_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        -- Nivel en que se obtuvo
        level_obtained INTEGER DEFAULT 1,
        -- Fuente: level_reward, promo, flash_deal, challenge, gift
        source VARCHAR(50) DEFAULT 'level_reward',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Tabla user_coupons creada');

    // Tabla para tracking de XP y bonuses
    await client.query(`
      CREATE TABLE IF NOT EXISTS xp_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL, -- purchase, flash_deal, eco_challenge, promo, streak, bonus
        description TEXT,
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        multiplier DECIMAL(3,2) DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Tabla xp_transactions creada');

    // Agregar columnas de gamificación a profiles si no existen
    await client.query(`
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;
    `);
    await client.query(`
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1;
    `);
    await client.query(`
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
    `);
    await client.query(`
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
    `);
    await client.query(`
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_purchase_date DATE;
    `);
    await client.query(`
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_icon_id VARCHAR(50);
    `);
    console.log('✓ Columnas de gamificación agregadas a profiles');

    // Agregar columna de cupón usado a orders
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id INTEGER REFERENCES user_coupons(id) ON DELETE SET NULL;
    `);
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount DECIMAL(10,2) DEFAULT 0;
    `);
    console.log('✓ Columnas de cupón agregadas a orders');

    // Índices para optimización
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON user_coupons(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_coupons_status ON user_coupons(status);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_coupons_expires ON user_coupons(expires_at);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(user_id);
    `);
    console.log('✓ Índices creados');

    // Insertar cupones base (definiciones para recompensas de nivel)
    const couponDefinitions = [
      { code: 'welcome_5', name: '¡Bienvenido Rescatador!', type: 'percentage', value: 5, category: 'ALL', min_purchase: 0, max_discount: 50, valid_days: 30, level_required: 2, icon: 'gift', color: '#34C759' },
      { code: 'bronze_veggie', name: 'Veggie Explorer', type: 'percentage', value: 10, category: 'VEGETARIANO', min_purchase: 50, max_discount: 30, valid_days: 21, level_required: 3, icon: 'leaf', color: '#34C759' },
      { code: 'silver_mex', name: 'Sabor Mexicano', type: 'fixed', value: 15, category: 'MEXICANO', min_purchase: 60, max_discount: 15, valid_days: 21, level_required: 4, icon: 'flame', color: '#FF6B35' },
      { code: 'silver_cafe', name: 'Coffee Lover', type: '2x1', value: 100, category: 'CAFE', min_purchase: 0, max_discount: 80, valid_days: 14, level_required: 5, icon: 'cafe', color: '#8B4513' },
      { code: 'silver_sweet', name: 'Dulce Recompensa', type: 'percentage', value: 15, category: 'REPOSTERIA', min_purchase: 40, max_discount: 50, valid_days: 21, level_required: 6, icon: 'ice-cream', color: '#FF9500' },
      { code: 'gold_all', name: 'Oro Universal', type: 'percentage', value: 12, category: 'ALL', min_purchase: 50, max_discount: 60, valid_days: 30, level_required: 7, icon: 'star', color: '#FFD700' },
      { code: 'gold_sushi', name: 'Sushi Master', type: '2x1', value: 100, category: 'SUSHI', min_purchase: 80, max_discount: 120, valid_days: 14, level_required: 8, icon: 'fish', color: '#E91E63' },
      { code: 'gold_healthy', name: 'Vida Saludable', type: 'fixed', value: 25, category: 'SALUDABLE', min_purchase: 100, max_discount: 25, valid_days: 21, level_required: 9, icon: 'nutrition', color: '#4CAF50' },
      { code: 'platinum_pizza', name: 'Pizza Premium', type: 'percentage', value: 20, category: 'PIZZA', min_purchase: 60, max_discount: 80, valid_days: 30, level_required: 10, icon: 'pizza', color: '#FF5722' },
      { code: 'platinum_bread', name: 'Pan Artesanal', type: '2x1', value: 100, category: 'PANADERIA', min_purchase: 50, max_discount: 100, valid_days: 21, level_required: 11, icon: 'restaurant', color: '#D2691E', extra_discount: 10 },
      { code: 'platinum_elite', name: 'Élite Platino', type: 'percentage', value: 18, category: 'ALL', min_purchase: 80, max_discount: 100, valid_days: 45, level_required: 12, icon: 'diamond', color: '#E5E4E2', priority: true },
      { code: 'diamond_mex_2x1', name: 'Diamante Mexicano', type: '2x1', value: 100, category: 'MEXICANO', min_purchase: 70, max_discount: 150, valid_days: 30, level_required: 13, icon: 'flame', color: '#B9F2FF', extra_discount: 10 },
      { code: 'diamond_super', name: 'Super Diamante', type: 'percentage', value: 25, category: 'ALL', min_purchase: 100, max_discount: 150, valid_days: 60, level_required: 14, icon: 'sparkles', color: '#B9F2FF' },
      { code: 'diamond_legend', name: 'Leyenda Diamante', type: 'percentage', value: 30, category: 'ALL', min_purchase: 0, max_discount: 200, valid_days: 90, level_required: 15, icon: 'trophy', color: '#FFD700', priority: true, free_monthly_pack: true },
    ];

    for (const coupon of couponDefinitions) {
      await client.query(`
        INSERT INTO coupon_definitions (code, name, type, value, category, min_purchase, max_discount, valid_days, level_required, icon, color, extra_discount, priority, free_monthly_pack)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          value = EXCLUDED.value,
          category = EXCLUDED.category,
          min_purchase = EXCLUDED.min_purchase,
          max_discount = EXCLUDED.max_discount,
          valid_days = EXCLUDED.valid_days,
          level_required = EXCLUDED.level_required,
          icon = EXCLUDED.icon,
          color = EXCLUDED.color,
          extra_discount = EXCLUDED.extra_discount,
          priority = EXCLUDED.priority,
          free_monthly_pack = EXCLUDED.free_monthly_pack
      `, [
        coupon.code, coupon.name, coupon.type, coupon.value, coupon.category,
        coupon.min_purchase, coupon.max_discount, coupon.valid_days, coupon.level_required,
        coupon.icon, coupon.color, coupon.extra_discount || 0, coupon.priority || false, coupon.free_monthly_pack || false
      ]);
    }
    console.log(`✓ ${couponDefinitions.length} definiciones de cupones insertadas`);

    console.log('\n✅ Migración de cupones completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  migrateCoupons()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = migrateCoupons;
