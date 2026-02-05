const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Obtener todas las tiendas con ubicación y packs disponibles
// @route   GET /api/stores/with-products
// @access  Público
exports.getStoresWithProducts = asyncHandler(async (req, res, next) => {
    // Solo tiendas con packs disponibles y ubicación
    const result = await pool.query(`
        SELECT s.id, s.nombre_comercio, s.direccion, s.latitud, s.longitud, s.descripcion,
               COUNT(p.id) as productos_disponibles
        FROM stores s
        JOIN products p ON s.user_id = p.seller_id AND p.stock > 0
        WHERE s.latitud IS NOT NULL AND s.longitud IS NOT NULL
        GROUP BY s.id
        HAVING COUNT(p.id) > 0
        ORDER BY s.nombre_comercio ASC
    `);
    res.json(result.rows);
});

// @desc    Obtener detalles de una tienda específica con sus productos y reseñas
// @route   GET /api/stores/:id
// @access  Público
exports.getStoreById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    // Obtener datos de la tienda usando columnas del esquema actual
    const storeResult = await pool.query(`
        SELECT s.id, s.user_id, s.nombre_comercio, s.direccion, s.latitud, s.longitud,
               s.descripcion, s.telefono, s.horario,
               u.name AS owner_nombre, u.email AS owner_email
        FROM stores s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id = $1
    `, [id]);

    if (storeResult.rows.length === 0) {
        return res.status(404).json({ msg: 'Tienda no encontrada' });
    }

    const store = storeResult.rows[0];

    // Productos activos de la tienda con métricas básicas - con aliases en español
    const productsResult = await pool.query(`
        SELECT p.id, 
               p.name AS nombre, 
               p.description AS descripcion, 
               p.price AS precio_descuento, 
               p.compare_price AS precio_original,
               p.image_url AS imagen_url, 
               p.stock AS cantidad_disponible, 
               p.category AS categoria
        FROM products p
        JOIN stores s ON s.id = $1 AND s.user_id = p.seller_id
        WHERE p.is_active = true AND p.stock > 0
        ORDER BY p.created_at DESC
    `, [id]);

    // Reseñas de la tienda (vía productos)
    const reviewsResult = await pool.query(`
        SELECT r.id, r.rating AS calificacion, r.comment AS comentario, r.created_at AS fecha,
               u.name AS nombre_usuario
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN products p ON r.product_id = p.id
        JOIN stores s ON s.id = $1 AND s.user_id = p.seller_id
        ORDER BY r.created_at DESC
        LIMIT 20
    `, [id]);

    // Rating promedio y última reseña
    const totalReviews = reviewsResult.rows.length;
    const avgRating = totalReviews > 0
        ? (reviewsResult.rows.reduce((sum, r) => sum + Number(r.calificacion || 0), 0) / totalReviews)
        : 0;
    const lastReview = reviewsResult.rows[0] || null;

    res.json({
        ...store,
        productos: productsResult.rows,
        resenas: reviewsResult.rows,
        calificacion_promedio: avgRating,
        total_resenas: totalReviews,
        ultima_resena: lastReview,
    });
});
