const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Recalcula y actualiza la calificación promedio de un producto.
 * @param {number} productId - El ID del producto.
 * @param {object} client - El cliente de la base de datos para la transacción.
 */
const updateProductAverageRating = async (productId, client) => {
    // Como la tabla 'reviews' no tiene product_id, unimos con 'orders' para encontrar las reseñas de un producto.
    const avgResult = await client.query(
        `SELECT AVG(r.puntuacion) as average 
         FROM reviews r
         JOIN orders o ON r.order_id = o.id
         WHERE o.product_id = $1`,
        [productId]
    );
    const average = avgResult.rows[0].average || 0;
    await client.query(
        'UPDATE products SET calificacion_promedio = $1 WHERE id = $2',
        [average, productId]
    );
};

/**
 * Recalcula y actualiza la calificación promedio de un vendedor (tienda).
 * @param {number} storeId - El ID de la tienda.
 * @param {object} client - El cliente de la base de datos para la transacción.
 */
const updateStoreAverageRating = async (storeId, client) => {
    // Esta consulta ahora es más simple porque 'reviews' ya tiene store_id.
    const avgResult = await client.query(
        'SELECT AVG(puntuacion) as average FROM reviews WHERE store_id = $1',
        [storeId]
    );
    const average = avgResult.rows[0].average || 0;
    await client.query(
        'UPDATE stores SET calificacion_promedio_vendedor = $1 WHERE id = $2',
        [average, storeId]
    );
};

// @desc    Crear una nueva reseña
// @acceso  Privado (Comprador)
exports.createReview = asyncHandler(async (req, res, next) => {
    // El frontend enviará 'puntuacion' en lugar de 'calificacion'
    const { orderId, puntuacion, comentario } = req.body;
    const userId = req.user.id;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Verificar que el pedido pertenece al usuario y obtener store_id y product_id
        const orderResult = await client.query('SELECT user_id, store_id, product_id FROM orders WHERE id = $1', [orderId]);
        if (orderResult.rows.length === 0 || orderResult.rows[0].user_id !== userId) {
            throw new Error('No tiene permiso para reseñar este pedido o el pedido no existe.');
        }
        const { store_id, product_id } = orderResult.rows[0];

        // 2. Verificar que no exista ya una reseña para este pedido (la DB tiene un UNIQUE constraint, pero esto da un mejor error)
        const reviewExists = await client.query('SELECT id FROM reviews WHERE order_id = $1', [orderId]);
        if (reviewExists.rows.length > 0) {
            throw new Error('Ya ha enviado una reseña para este pedido.');
        }

        // 3. Crear la reseña usando la estructura de tu tabla (store_id, puntuacion)
        const newReview = await client.query(
            'INSERT INTO reviews (order_id, user_id, store_id, puntuacion, comentario) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [orderId, userId, store_id, puntuacion, comentario]
        );

        // 4. Recalcular y actualizar promedios
        await updateProductAverageRating(product_id, client);
        await updateStoreAverageRating(store_id, client);

        await client.query('COMMIT');
        res.status(201).json(newReview.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        // Manejo de errores personalizado para mensajes más claros
        if (error.message.includes('reseñar') || error.message.includes('enviado')) {
            return res.status(403).json({ msg: error.message });
        }
        next(error); // Pasa a errorHandler para errores genéricos
    } finally {
        client.release();
    }
});

// @desc    Obtener todas las reseñas de un producto
// @acceso  Público
exports.getProductReviews = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    // Para obtener las reseñas de un producto, necesitamos unir 'reviews' con 'orders'
    const reviews = await pool.query(
        `SELECT r.*, u.nombre as nombre_usuario 
         FROM reviews r 
         JOIN users u ON r.user_id = u.id 
         JOIN orders o ON r.order_id = o.id
         WHERE o.product_id = $1 
         ORDER BY r.fecha_creacion DESC`,
        [productId]
    );
    res.json(reviews.rows);
});