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
        CASE WHEN expires_at < NOW() THEN 'expired' ELSE status END as current_status
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
      expired: result.rows.filter(c => c.current_status === 'expired' || new Date(c.expires_at) < new Date())
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
      query += ` AND (category = 'ALL' OR category = $3)`;
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
 * Aplicar cupón a una orden (validación)
 */
const validateCoupon = async (req, res) => {
  try {
    const userId = req.user.id;
    const { couponId, total, category } = req.body;

    if (!couponId) {
      return res.status(400).json({ success: false, error: 'ID de cupón requerido' });
    }

    const result = await pool.query(`
      SELECT * FROM user_coupons 
      WHERE id = $1 AND user_id = $2
    `, [couponId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cupón no encontrado' });
    }

    const coupon = result.rows[0];

    // Validaciones
    if (coupon.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Este cupón ya fue utilizado' });
    }

    if (new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ success: false, error: 'Este cupón ha expirado' });
    }

    if (total < coupon.min_purchase) {
      return res.status(400).json({ 
        success: false, 
        error: `Compra mínima de $${coupon.min_purchase} requerida para este cupón` 
      });
    }

    if (coupon.category !== 'ALL' && category && category !== coupon.category) {
      return res.status(400).json({ 
        success: false, 
        error: `Este cupón solo es válido para la categoría ${coupon.category}` 
      });
    }

    // Calcular descuento
    let discount = 0;
    let discountType = '';
    
    switch (coupon.type) {
      case 'percentage':
        discount = Math.min(total * (coupon.value / 100), coupon.max_discount);
        discountType = `${coupon.value}% de descuento`;
        break;
      case 'fixed':
        discount = Math.min(coupon.value, coupon.max_discount, total);
        discountType = `$${coupon.value} de descuento`;
        break;
      case '2x1':
        discount = total / 2;
        discountType = '2x1 (pagas uno, te llevas dos)';
        break;
      case 'free_item':
        discount = total;
        discountType = 'Producto gratis';
        break;
    }

    res.json({
      success: true,
      valid: true,
      coupon: {
        id: coupon.id,
        name: coupon.name,
        type: coupon.type,
        discount: Math.round(discount * 100) / 100,
        discountType,
        finalTotal: Math.max(0, Math.round((total - discount) * 100) / 100)
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ success: false, error: 'Error al validar cupón' });
  }
};

/**
 * Marcar cupón como usado (llamado al completar orden)
 */
const useCoupon = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { couponId, orderId } = req.body;

    await client.query('BEGIN');

    const result = await client.query(`
      UPDATE user_coupons 
      SET status = 'used', used_at = NOW(), used_in_order_id = $3
      WHERE id = $1 AND user_id = $2 AND status = 'active'
      RETURNING *
    `, [couponId, userId, orderId]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'No se pudo usar el cupón' });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Cupón aplicado exitosamente',
      coupon: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error using coupon:', error);
    res.status(500).json({ success: false, error: 'Error al usar cupón' });
  } finally {
    client.release();
  }
};

/**
 * Otorgar cupón por subir de nivel
 */
const grantLevelCoupon = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { level } = req.body;

    await client.query('BEGIN');

    // Buscar definición de cupón para este nivel
    const defResult = await client.query(`
      SELECT * FROM coupon_definitions 
      WHERE level_required = $1 AND is_active = true
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
 * Registrar transacción de XP
 */
const recordXpTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, type, description, orderId, multiplier = 1.0 } = req.body;

    const result = await pool.query(`
      INSERT INTO xp_transactions (user_id, amount, type, description, order_id, multiplier)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [userId, amount, type, description, orderId, multiplier]);

    // Actualizar XP total en el perfil
    await pool.query(`
      UPDATE profiles 
      SET total_xp = COALESCE(total_xp, 0) + $2
      WHERE user_id = $1
    `, [userId, amount]);

    res.json({
      success: true,
      transaction: result.rows[0]
    });
  } catch (error) {
    console.error('Error recording XP:', error);
    res.status(500).json({ success: false, error: 'Error al registrar XP' });
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

    // Obtener nivel actual del perfil
    const profileRes = await pool.query('SELECT current_level, total_pedidos FROM profiles WHERE user_id = $1', [userId]);
    const currentLevel = (profileRes.rows[0] && profileRes.rows[0].current_level) || 1;

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
  validateCoupon,
  useCoupon,
  grantLevelCoupon,
  recordXpTransaction,
  getXpHistory,
  getGamificationStats
  ,getLevelCoupons
};
