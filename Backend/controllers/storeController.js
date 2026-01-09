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
        JOIN products p ON s.id = p.store_id AND p.cantidad_disponible > 0
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
               u.nombre AS owner_nombre, u.email AS owner_email
        FROM stores s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id = $1
    `, [id]);

    if (storeResult.rows.length === 0) {
        return res.status(404).json({ msg: 'Tienda no encontrada' });
    }

    const store = storeResult.rows[0];

    // Productos activos de la tienda con métricas básicas
    const productsResult = await pool.query(`
        SELECT p.id, p.nombre, p.descripcion, p.precio_original, p.precio_descuento,
               p.imagen_url, p.cantidad_disponible, p.categoria
        FROM products p
        WHERE p.store_id = $1 AND p.activo = TRUE
        ORDER BY p.created_at DESC
    `, [id]);

    // Reseñas de la tienda (directamente por store_id)
    const reviewsResult = await pool.query(`
        SELECT r.id, r.calificacion, r.comentario, r.created_at,
               u.nombre AS user_nombre
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.store_id = $1
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
