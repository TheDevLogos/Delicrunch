/**
 * Admin Routes - Rutas de Administración
 * Endpoints para gestionar comercios, reviews, usuarios y transacciones
 */
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');

// Middleware para verificar que el usuario es admin
const adminOnly = restrictTo('admin');

// =============================================
// USUARIOS
// =============================================

/**
 * GET /admin/users
 * Obtener todos los usuarios del sistema
 */
router.get('/users', protect, adminOnly, asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT 
      id, nombre, email, rol, created_at,
      (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as total_orders
    FROM users
    ORDER BY created_at DESC
  `);
  
  res.json(result.rows);
}));

/**
 * GET /admin/users/:id
 * Obtener detalle de un usuario
 */
router.get('/users/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(`
    SELECT 
      u.id, u.nombre, u.email, u.rol, u.created_at,
      (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as total_orders,
      (SELECT COALESCE(SUM(total), 0) FROM orders WHERE user_id = u.id) as total_spent
    FROM users u
    WHERE u.id = $1
  `, [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  res.json(result.rows[0]);
}));

// =============================================
// COMERCIOS (STORES)
// =============================================

/**
 * GET /admin/stores
 * Obtener todos los comercios del sistema
 */
router.get('/stores', protect, adminOnly, asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT 
      s.*,
      u.nombre as owner_name,
      u.email as owner_email,
      (SELECT COUNT(*) FROM products WHERE store_id = s.id) as total_products,
      (SELECT COUNT(*) FROM orders WHERE store_id = s.id) as total_orders,
      (SELECT COALESCE(SUM(total), 0) FROM orders WHERE store_id = s.id) as total_revenue
    FROM stores s
    LEFT JOIN users u ON s.user_id = u.id
    ORDER BY s.created_at DESC
  `);
  
  res.json(result.rows);
}));

/**
 * GET /admin/stores/revenues/weekly
 * Devuelve ingresos por tienda para esta semana y semana previa
 */
router.get('/stores/revenues/weekly', protect, adminOnly, asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT
      s.id as store_id,
      COALESCE(SUM(o.total) FILTER (WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days'), 0) as revenue_this_week,
      COALESCE(SUM(o.total) FILTER (WHERE o.created_at >= CURRENT_DATE - INTERVAL '14 days' AND o.created_at < CURRENT_DATE - INTERVAL '7 days'), 0) as revenue_prev_week
    FROM stores s
    LEFT JOIN orders o ON o.store_id = s.id
    GROUP BY s.id
    ORDER BY revenue_this_week DESC
  `);

  res.json(result.rows);
}));

/**
 * PUT /admin/stores/:id/approve
 * Aprobar un comercio pendiente
 */
router.put('/stores/:id/approve', protect, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(`
    UPDATE stores 
    SET estado = 'activo', activo = true, updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Comercio no encontrado' });
  }

  res.json({ 
    message: 'Comercio aprobado correctamente', 
    store: result.rows[0] 
  });
}));

/**
 * PUT /admin/stores/:id/toggle
 * Activar/desactivar un comercio
 */
router.put('/stores/:id/toggle', protect, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  const result = await pool.query(`
    UPDATE stores 
    SET activo = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `, [activo, id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Comercio no encontrado' });
  }

  res.json({ 
    message: `Comercio ${activo ? 'activado' : 'desactivado'} correctamente`, 
    store: result.rows[0] 
  });
}));

/**
 * DELETE /admin/stores/:id
 * Eliminar un comercio
 */
router.delete('/stores/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar que no tenga pedidos activos
  const ordersCheck = await pool.query(`
    SELECT COUNT(*) FROM orders WHERE store_id = $1 AND estado NOT IN ('completado', 'cancelado')
  `, [id]);

  if (parseInt(ordersCheck.rows[0].count) > 0) {
    return res.status(400).json({ 
      message: 'No se puede eliminar: el comercio tiene pedidos activos' 
    });
  }

  await pool.query('DELETE FROM stores WHERE id = $1', [id]);
  
  res.json({ message: 'Comercio eliminado correctamente' });
}));

// =============================================
// REVIEWS
// =============================================

/**
 * GET /admin/reviews
 * Obtener todas las reviews del sistema
 */
router.get('/reviews', protect, adminOnly, asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT 
      r.*,
      r.calificacion as rating,
      u.nombre as usuario_nombre,
      COALESCE(p.nombre, 'Producto') as producto_nombre,
      COALESCE(s.nombre_comercio, 'Comercio') as comercio_nombre
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN stores s ON r.store_id = s.id
    LEFT JOIN products p ON r.product_id = p.id
    ORDER BY r.created_at DESC
  `);

  res.json(result.rows);
}));

/**
 * PUT /admin/reviews/:id/respond
 * Responder a una review
 */
router.put('/reviews/:id/respond', protect, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { respuesta } = req.body;

  const result = await pool.query(`
    UPDATE reviews 
    SET respuesta_admin = $1, fecha_respuesta = NOW(), updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `, [respuesta, id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Review no encontrada' });
  }

  res.json({ 
    message: 'Respuesta enviada correctamente', 
    review: result.rows[0] 
  });
}));

/**
 * DELETE /admin/reviews/:id
 * Eliminar una review
 */
router.delete('/reviews/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;

  await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
  
  res.json({ message: 'Review eliminada correctamente' });
}));

// =============================================
// TRANSACCIONES/ÓRDENES
// =============================================

/**
 * GET /admin/transactions
 * Obtener todas las transacciones
 */
router.get('/transactions', protect, adminOnly, asyncHandler(async (req, res) => {
  const { period, startDate, endDate } = req.query;
  
  let dateFilter = '';
  const params = [];

  if (period) {
    switch (period) {
      case 'day':
        dateFilter = "AND o.created_at >= CURRENT_DATE";
        break;
      case 'week':
        dateFilter = "AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND o.created_at >= DATE_TRUNC('month', CURRENT_DATE)";
        break;
      case 'year':
        dateFilter = "AND o.created_at >= DATE_TRUNC('year', CURRENT_DATE)";
        break;
    }
  }

  if (startDate && endDate) {
    dateFilter = "AND o.created_at BETWEEN $1 AND $2";
    params.push(startDate, endDate);
  }

  const result = await pool.query(`
    SELECT 
      o.*,
      u.nombre as buyer_name,
      s.nombre_comercio as store_name
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN stores s ON o.store_id = s.id
    WHERE 1=1 ${dateFilter}
    ORDER BY o.created_at DESC
  `, params);

  res.json(result.rows);
}));

/**
 * GET /admin/transactions/stats
 * Obtener estadísticas de transacciones
 */
router.get('/transactions/stats', protect, adminOnly, asyncHandler(async (req, res) => {
  const { period } = req.query;
  
  let dateFilter = '';
  switch (period) {
    case 'day':
      dateFilter = "WHERE created_at >= CURRENT_DATE";
      break;
    case 'week':
      dateFilter = "WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'";
      break;
    case 'month':
      dateFilter = "WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)";
      break;
    case 'year':
      dateFilter = "WHERE created_at >= DATE_TRUNC('year', CURRENT_DATE)";
      break;
    default:
      dateFilter = '';
  }

  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_orders,
      COALESCE(SUM(total), 0) as total_revenue,
      COALESCE(AVG(total), 0) as avg_order_value,
      COUNT(CASE WHEN estado = 'completado' THEN 1 END) as completed_orders,
      COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as cancelled_orders
    FROM orders
    ${dateFilter}
  `);

  res.json(result.rows[0]);
}));

// =============================================
// MÉTRICAS GENERALES
// =============================================

/**
 * GET /admin/metrics/overview
 * Obtener métricas generales del sistema
 */
router.get('/metrics/overview', protect, adminOnly, asyncHandler(async (req, res) => {
  const [users, stores, products, orders, financials] = await Promise.all([
    pool.query('SELECT COUNT(*) as count, rol FROM users GROUP BY rol'),
    pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN activo THEN 1 END) as active FROM stores'),
    pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN cantidad_disponible > 0 THEN 1 END) as available FROM products'),
    pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN estado = 'recogido' THEN 1 END) as completadas,
        COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as canceladas,
        COALESCE(SUM(CASE WHEN estado = 'recogido' THEN total ELSE 0 END), 0) as revenue_total,
        COALESCE(AVG(CASE WHEN estado = 'recogido' THEN total ELSE NULL END), 0) as avg_value,
        COALESCE(SUM(CASE WHEN estado = 'recogido' THEN comision_plataforma ELSE 0 END), 0) as comision_total
      FROM orders
    `),
    pool.query(`
      SELECT 
        COALESCE(SUM(total_ventas), 0) as ventas_totales,
        COALESCE(SUM(total_comisiones), 0) as comisiones_totales,
        COALESCE(SUM(total_ordenes), 0) as ordenes_totales
      FROM admin_metrics
      WHERE fecha >= CURRENT_DATE - INTERVAL '30 days'
    `),
  ]);

  res.json({
    users: users.rows,
    stores: stores.rows[0],
    products: products.rows[0],
    orders: orders.rows[0],
    financials_last_30_days: financials.rows[0],
  });
}));

/**
 * GET /admin/metrics/by-city
 * Obtener métricas agrupadas por ciudad
 */
router.get('/metrics/by-city', protect, adminOnly, asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT 
      COALESCE(s.ciudad, 'Sin ciudad') as ciudad,
      COUNT(DISTINCT s.id) as stores,
      COUNT(DISTINCT p.id) as products,
      COUNT(DISTINCT o.id) as orders,
      COALESCE(SUM(o.total), 0) as revenue
    FROM stores s
    LEFT JOIN products p ON p.store_id = s.id
    LEFT JOIN orders o ON o.store_id = s.id
    GROUP BY s.ciudad
    ORDER BY revenue DESC
  `);

  res.json(result.rows);
}));

/**
 * GET /admin/metrics/by-store
 * Obtener métricas agrupadas por comercio
 */
router.get('/metrics/by-store', protect, adminOnly, asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT 
      s.id,
      s.nombre_comercio as nombre,
      COALESCE(s.ciudad, 'Sin ciudad') as ciudad,
      s.activo,
      COUNT(DISTINCT p.id) as products,
      COUNT(DISTINCT o.id) as orders,
      COALESCE(SUM(o.total), 0) as revenue,
      COALESCE(AVG(r.calificacion), 0) as avg_rating
    FROM stores s
    LEFT JOIN products p ON p.store_id = s.id
    LEFT JOIN orders o ON o.store_id = s.id
    LEFT JOIN reviews r ON r.store_id = s.id
    GROUP BY s.id, s.nombre_comercio, s.ciudad, s.activo
    ORDER BY revenue DESC
    LIMIT 50
  `);

  res.json(result.rows);
}));

/**
 * GET /admin/metrics/trends
 * Obtener tendencias de ventas
 */
router.get('/metrics/trends', protect, adminOnly, asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;

  const result = await pool.query(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as orders,
      COUNT(CASE WHEN estado = 'recogido' THEN 1 END) as completed_orders,
      COALESCE(SUM(CASE WHEN estado = 'recogido' THEN total ELSE 0 END), 0) as revenue,
      COALESCE(SUM(CASE WHEN estado = 'recogido' THEN comision_plataforma ELSE 0 END), 0) as commission
    FROM orders
    WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);

  res.json(result.rows);
}));

/**
 * GET /admin/metrics/financial
 * Obtener métricas financieras detalladas para el admin
 */
router.get('/metrics/financial', protect, adminOnly, asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = 'day' } = req.query;

  // Validar fechas
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  // Métricas agregadas del período
  const summaryResult = await pool.query(`
    SELECT 
      COUNT(*) as total_ordenes,
      COUNT(CASE WHEN estado = 'recogido' THEN 1 END) as ordenes_completadas,
      COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as ordenes_canceladas,
      COALESCE(SUM(CASE WHEN estado = 'recogido' THEN total ELSE 0 END), 0) as ventas_totales,
      COALESCE(SUM(CASE WHEN estado = 'recogido' THEN comision_plataforma ELSE 0 END), 0) as comisiones_totales,
      COALESCE(SUM(CASE WHEN estado = 'recogido' THEN (total - comision_plataforma) ELSE 0 END), 0) as pagos_a_comercios
    FROM orders
    WHERE created_at >= $1 AND created_at <= $2
  `, [start, end]);

  // Por comercio
  const byStoreResult = await pool.query(`
    SELECT 
      s.id as store_id,
      s.nombre_comercio,
      COUNT(o.id) as total_ordenes,
      COUNT(CASE WHEN o.estado = 'recogido' THEN 1 END) as ordenes_completadas,
      COALESCE(SUM(CASE WHEN o.estado = 'recogido' THEN o.total ELSE 0 END), 0) as ventas_totales,
      COALESCE(SUM(CASE WHEN o.estado = 'recogido' THEN o.comision_plataforma ELSE 0 END), 0) as comisiones_generadas,
      COALESCE(SUM(CASE WHEN o.estado = 'recogido' THEN (o.total - o.comision_plataforma) ELSE 0 END), 0) as pago_al_comercio
    FROM stores s
    LEFT JOIN orders o ON o.store_id = s.id AND o.created_at >= $1 AND o.created_at <= $2
    GROUP BY s.id, s.nombre_comercio
    HAVING COUNT(o.id) > 0
    ORDER BY comisiones_generadas DESC
    LIMIT 20
  `, [start, end]);

  // Por fecha
  const dateFormat = groupBy === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';
  const byDateResult = await pool.query(`
    SELECT 
      TO_CHAR(created_at, '${dateFormat}') as periodo,
      COUNT(*) as total_ordenes,
      COUNT(CASE WHEN estado = 'recogido' THEN 1 END) as ordenes_completadas,
      COALESCE(SUM(CASE WHEN estado = 'recogido' THEN total ELSE 0 END), 0) as ventas,
      COALESCE(SUM(CASE WHEN estado = 'recogido' THEN comision_plataforma ELSE 0 END), 0) as comisiones
    FROM orders
    WHERE created_at >= $1 AND created_at <= $2
    GROUP BY TO_CHAR(created_at, '${dateFormat}')
    ORDER BY periodo ASC
  `, [start, end]);

  res.json({
    summary: summaryResult.rows[0],
    byStore: byStoreResult.rows,
    byDate: byDateResult.rows,
  });
}));

module.exports = router;
