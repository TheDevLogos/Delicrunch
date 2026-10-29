/**
 * Coupon Controller
 * Gestión de cupones para el sistema de recompensas
 */
const pool = require('../db');

/**
 * Obtener todos los cupones del usuario
 */
const getMyCoupons = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT 
        id, code, name, description, type, value, category,
        min_purchase, max_discount, icon, color, extra_discount,
        status, obtained_at, expires_at, used_at, level_obtained, source,
        CASE WHEN status = 'used' THEN 'used'
             WHEN expires_at < NOW() THEN 'expired' ELSE status END as current_status
      FROM user_coupons 
      WHERE user_id = $1
    `;
    const params = [userId];

    if (status === 'active') {
      query += ` AND status = 'active' AND expires_at > NOW()`;
    } else if (status === 'used') {
      query += ` AND status = 'used'`;
    } else if (status === 'expired') {
      query += ` AND (status = 'expired' OR expires_at < NOW())`;
    }

    query += ` ORDER BY 
      CASE WHEN status = 'active' AND expires_at > NOW() THEN 0 ELSE 1 END,
      expires_at ASC`;

    const result = await pool.query(query, params);

    // Agrupar por estado
    const coupons = {
      active: result.rows.filter(c => c.current_status === 'active' && new Date(c.expires_at) > new Date()),
      used: result.rows.filter(c => c.current_status === 'used'),
      expired: result.rows.filter(c => c.current_status === 'expired')
    };

    res.json({
      success: true,
      coupons: status ? result.rows : coupons,
      counts: {
        active: coupons.active.length,
        used: coupons.used.length,
        expired: coupons.expired.length
      }
    });
  } catch (error) {
    console.error('Error getting coupons:', error);
    res.status(500).json({ success: false, error: 'Error al obtener cupones' });
  }
};

/**
 * Obtener cupones disponibles para aplicar a una compra
 */
const getAvailableCoupons = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, total } = req.query;
    const purchaseTotal = parseFloat(total) || 0;

    let query = `
      SELECT 
        id, code, name, description, type, value, category,
        min_purchase, max_discount, icon, color, extra_discount
      FROM user_coupons 
      WHERE user_id = $1 
        AND status = 'active' 
        AND expires_at > NOW()
        AND min_purchase <= $2
    `;
    const params = [userId, purchaseTotal];

    // Filtrar por categoría si se especifica
    if (category && category !== 'ALL') {
      query += ` AND (UPPER(category) = 'ALL' OR UPPER(category) = UPPER($3))`;
      params.push(category);
    }

    query += ` ORDER BY value DESC, expires_at ASC`;

    const result = await pool.query(query, params);

    // Calcular descuento potencial para cada cupón
    const couponsWithDiscount = result.rows.map(coupon => {
      let discount = 0;
      
      switch (coupon.type) {
        case 'percentage':
          discount = Math.min(purchaseTotal * (coupon.value / 100), coupon.max_discount);
          break;
        case 'fixed':
          discount = Math.min(coupon.value, coupon.max_discount, purchaseTotal);
          break;
        case '2x1':
          discount = purchaseTotal / 2;
          break;
        case 'free_item':
          discount = purchaseTotal;
          break;
      }

      return {
        ...coupon,
        potential_discount: Math.round(discount * 100) / 100
      };
    });

    res.json({
      success: true,
      coupons: couponsWithDiscount,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error getting available coupons:', error);
    res.status(500).json({ success: false, error: 'Error al obtener cupones disponibles' });
  }
};

/**
 * Otorgar cupón por subir de nivel
 */
const grantLevelCoupon = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const level = Number(req.body.level);
    if (!Number.isInteger(level) || level < 1 || level > 15) {
      return res.status(400).json({ success: false, error: 'Nivel inválido' });
    }

    await client.query('BEGIN');

    const profileResult = await client.query(
      'SELECT COALESCE(total_xp, 0) AS total_xp FROM profiles WHERE user_id = $1 FOR UPDATE',
      [userId]
    );
    const levelThresholds = [0, 135, 340, 675, 1150, 1755, 2700, 4050, 6075, 8775, 12150, 16875, 23625, 33750, 47250];
    if (Number(profileResult.rows[0]?.total_xp || 0) < levelThresholds[level - 1]) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, error: 'Aún no alcanzas este nivel' });
    }

    // Buscar definición de cupón para este nivel
    const defResult = await client.query(`
      SELECT * FROM coupon_definitions 
      WHERE level_required = $1 AND is_active = true
      ORDER BY id LIMIT 1
    `, [level]);

    if (defResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.json({ success: true, message: 'No hay cupón para este nivel', coupon: null });
    }

    const couponDef = defResult.rows[0];

    // Verificar si ya tiene este cupón
    const existing = await client.query(`
      SELECT id FROM user_coupons 
      WHERE user_id = $1 AND coupon_definition_id = $2 AND level_obtained = $3
    `, [userId, couponDef.id, level]);

    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.json({ success: true, message: 'Cupón ya otorgado', coupon: null });
    }

    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + couponDef.valid_days);

    // Crear instancia de cupón para el usuario
    const insertResult = await client.query(`
      INSERT INTO user_coupons (
        user_id, coupon_definition_id, code, name, description, type, value,
        category, min_purchase, max_discount, icon, color, extra_discount,
        expires_at, level_obtained, source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'level_reward')
      RETURNING *
    `, [
      userId, couponDef.id, `${couponDef.code}_${userId}_${Date.now()}`,
      couponDef.name, couponDef.description || `Recompensa por alcanzar nivel ${level}`,
      couponDef.type, couponDef.value, couponDef.category,
      couponDef.min_purchase, couponDef.max_discount,
      couponDef.icon, couponDef.color, couponDef.extra_discount,
      expiresAt, level
    ]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `¡Felicidades! Has desbloqueado: ${couponDef.name}`,
      coupon: insertResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error granting level coupon:', error);
    res.status(500).json({ success: false, error: 'Error al otorgar cupón' });
  } finally {
    client.release();
  }
};

/**
 * Obtener historial de XP
 */
const getXpHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const result = await pool.query(`
      SELECT * FROM xp_transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `, [userId, parseInt(limit)]);

    // Obtener total
    const totalResult = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total_xp FROM xp_transactions WHERE user_id = $1
    `, [userId]);

    res.json({
      success: true,
      transactions: result.rows,
      totalXp: parseInt(totalResult.rows[0].total_xp)
    });
  } catch (error) {
    console.error('Error getting XP history:', error);
    res.status(500).json({ success: false, error: 'Error al obtener historial de XP' });
  }
};

/**
 * Obtener estadísticas de gamificación del usuario
 */
const getGamificationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Stats del perfil
    const profileResult = await pool.query(`
      SELECT total_xp, current_level, current_streak, best_streak, last_purchase_date
      FROM profiles WHERE user_id = $1
    `, [userId]);

    // Cupones activos
    const couponsResult = await pool.query(`
      SELECT COUNT(*) as active_coupons 
      FROM user_coupons 
      WHERE user_id = $1 AND status = 'active' AND expires_at > NOW()
    `, [userId]);

    // Cupones usados este mes
    const usedThisMonthResult = await pool.query(`
      SELECT COUNT(*) as used_this_month, COALESCE(SUM(value), 0) as savings_this_month
      FROM user_coupons 
      WHERE user_id = $1 AND status = 'used' 
        AND used_at >= DATE_TRUNC('month', CURRENT_DATE)
    `, [userId]);

    // XP ganado este mes
    const xpThisMonthResult = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as xp_this_month
      FROM xp_transactions 
      WHERE user_id = $1 
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `, [userId]);

    const profile = profileResult.rows[0] || {};
    
    res.json({
      success: true,
      stats: {
        totalXp: profile.total_xp || 0,
        currentLevel: profile.current_level || 1,
        currentStreak: profile.current_streak || 0,
        bestStreak: profile.best_streak || 0,
        lastPurchaseDate: profile.last_purchase_date,
        activeCoupons: parseInt(couponsResult.rows[0].active_coupons),
        usedThisMonth: parseInt(usedThisMonthResult.rows[0].used_this_month),
        savingsThisMonth: parseFloat(usedThisMonthResult.rows[0].savings_this_month),
        xpThisMonth: parseInt(xpThisMonthResult.rows[0].xp_this_month)
      }
    });
  } catch (error) {
    console.error('Error getting gamification stats:', error);
    res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
  }
};

/**
 * Obtener definiciones de cupones agrupadas por nivel indicando si el usuario las tiene
 * @route GET /api/coupons/definitions
 */
const getLevelCoupons = async (req, res) => {
  try {
    const userId = req.user.id;

    // Calcular nivel desde total_xp (no leer current_level que puede estar desactualizado)
    const LEVEL_XP = [0, 135, 340, 675, 1150, 1755, 2700, 4050, 6075, 8775, 12150, 16875, 23625, 33750, 47250];
    const profileRes = await pool.query('SELECT total_xp, total_pedidos FROM profiles WHERE user_id = $1', [userId]);
    const totalXP = parseInt((profileRes.rows[0] || {}).total_xp) || 0;
    let currentLevel = 1;
    for (let i = LEVEL_XP.length - 1; i >= 0; i--) {
      if (totalXP >= LEVEL_XP[i]) { currentLevel = i + 1; break; }
    }

    // Obtener todas las definiciones activas
    const defsRes = await pool.query('SELECT * FROM coupon_definitions WHERE is_active = true ORDER BY level_required ASC');
    const defs = defsRes.rows;

    // Obtener cupones del usuario para saber qué ya tiene
    const userCouponsRes = await pool.query('SELECT coupon_definition_id, id, status FROM user_coupons WHERE user_id = $1', [userId]);
    const owned = new Map();
    userCouponsRes.rows.forEach(r => {
      if (!owned.has(r.coupon_definition_id)) owned.set(r.coupon_definition_id, []);
      owned.get(r.coupon_definition_id).push({ id: r.id, status: r.status });
    });

    // Agrupar por nivel
    const byLevel = {};
    defs.forEach(def => {
      const lvl = def.level_required || 1;
      if (!byLevel[lvl]) byLevel[lvl] = { level: lvl, definitions: [] };

      const has = owned.has(def.id) ? true : false;
      const unlocked = lvl <= currentLevel;

      byLevel[lvl].definitions.push({
        definition: def,
        unlocked,
        has,
        ownedInstances: owned.get(def.id) || []
      });
    });

    res.json({ success: true, currentLevel, levels: Object.values(byLevel) });
  } catch (error) {
    console.error('Error getting level coupons:', error);
    res.status(500).json({ success: false, error: 'Error al obtener definiciones de cupones' });
  }
};

module.exports = {
  getMyCoupons,
  getAvailableCoupons,
  grantLevelCoupon,
  getXpHistory,
  getGamificationStats
  ,getLevelCoupons
};
