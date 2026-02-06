const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Recalcula y actualiza la calificación promedio de un producto.
 * @param {number} productId - El ID del producto.
 * @param {object} client - El cliente de la base de datos para la transacción.
 */
const updateProductAverageRating = async (productId, client) => {
    const dbClient = client || pool;
    // Calculamos promedio desde reviews que tienen ese product_id
    const avgResult = await dbClient.query(
         `SELECT AVG(rating) as average, COUNT(*) as total
         FROM reviews 
         WHERE product_id = $1`,
        [productId]
    );
    const average = parseFloat(avgResult.rows[0].average) || 0;
    const total = parseInt(avgResult.rows[0].total) || 0;
    await dbClient.query(
        'UPDATE products SET rating = $1, reviews_count = $2 WHERE id = $3',
        [average.toFixed(2), total, productId]
    );
    return { average, total };
};

/**
 * Recalcula y actualiza la calificación promedio de una tienda.
 * @param {number} storeId - El ID de la tienda.
 * @param {object} client - El cliente de la base de datos para la transacción.
 */
const updateStoreAverageRating = async (storeId, client) => {
    // Función deshabilitada - no hay tabla stores separada
    // Los vendedores están en users
    return { average: 0, total: 0 };
};

// @desc    Crear una nueva reseña
// @acceso  Privado (Comprador)
exports.createReview = asyncHandler(async (req, res, next) => {
    // Aceptamos múltiples nombres de campos para flexibilidad
    const { 
        orderId, order_id, pedido_id,
        productId, producto_id, product_id,
        puntuacion, calificacion, rating,
        comentario 
    } = req.body;
    
    const finalOrderId = orderId || order_id || pedido_id;
    const finalProductId = productId || producto_id || product_id;
    const finalRating = puntuacion || calificacion || rating;
    
    const userId = req.user.id;

    if (!finalRating || finalRating < 1 || finalRating > 5) {
        return res.status(400).json({ msg: 'La calificación debe ser entre 1 y 5.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let storeId, productIdToUse, productName;

        // Si viene un orderId, validamos que el pedido pertenezca al usuario
        if (finalOrderId) {
            const orderResult = await client.query(
                `SELECT o.user_id, o.seller_id, oi.product_id, p.name as product_name
                 FROM orders o
                 LEFT JOIN order_items oi ON o.id = oi.order_id
                 LEFT JOIN products p ON oi.product_id = p.id
                 WHERE o.id = $1`,
                [finalOrderId]
            );
            
            if (orderResult.rows.length === 0) {
                throw new Error('El pedido no existe.');
            }
            
            if (orderResult.rows[0].user_id !== userId) {
                throw new Error('No tiene permiso para reseñar este pedido.');
            }

            // Verificar que no exista ya una reseña para este pedido
            const reviewExists = await client.query(
                'SELECT id FROM reviews WHERE order_id = $1 AND user_id = $2',
                [finalOrderId, userId]
            );
            if (reviewExists.rows.length > 0) {
                throw new Error('Ya ha enviado una reseña para este pedido.');
            }

            productIdToUse = orderResult.rows[0].product_id || finalProductId;
            productName = orderResult.rows[0].product_name;
        } 
        // Si viene productId sin orderId, verificamos que el usuario haya comprado ese producto
        else if (finalProductId) {
            const purchaseCheck = await client.query(
                `SELECT o.id as order_id, p.name as product_name
                 FROM orders o
                 JOIN order_items oi ON o.id = oi.order_id
                 JOIN products p ON oi.product_id = p.id
                 WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status IN ('ready', 'delivered', 'completed', 'confirmed')
                 ORDER BY o.created_at DESC
                 LIMIT 1`,
                [userId, finalProductId]
            );
            
            if (purchaseCheck.rows.length === 0) {
                throw new Error('Debe comprar este producto antes de poder reseñarlo.');
            }

            // Verificar que no exista ya una reseña para este producto por este usuario
            const reviewExists = await client.query(
                'SELECT id FROM reviews WHERE product_id = $1 AND user_id = $2',
                [finalProductId, userId]
            );
            if (reviewExists.rows.length > 0) {
                throw new Error('Ya ha enviado una reseña para este producto.');
            }

            productIdToUse = finalProductId;
            productName = purchaseCheck.rows[0].product_name;
        } else {
            throw new Error('Debe proporcionar un ID de pedido o producto.');
        }

        // Crear la reseña
        const newReview = await client.query(
            `INSERT INTO reviews (
                order_id, user_id, product_id, 
                rating, comment, is_verified
            ) VALUES ($1, $2, $3, $4, $5, FALSE) 
            RETURNING *`,
            [finalOrderId, userId, productIdToUse, finalRating, comentario || '']
        );

        // Recalcular promedios del producto
        if (productIdToUse) {
            await updateProductAverageRating(productIdToUse, client);
        }

        await client.query('COMMIT');
        
        res.status(201).json({
            ...newReview.rows[0],
            msg: '¡Gracias por tu reseña!'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating review:', error.message);
        return res.status(400).json({ msg: error.message });
    } finally {
        client.release();
    }
});

// @desc    Obtener todas las reseñas de un producto
// @acceso  Público
exports.getProductReviews = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    
    const reviews = await pool.query(
        `SELECT r.id, r.calificacion as rating, r.comentario as comment, r.created_at, r.is_verified,
                u.nombre as nombre_usuario,
                p.foto_perfil as user_avatar
         FROM reviews r 
         JOIN users u ON r.user_id = u.id 
         LEFT JOIN profiles p ON r.user_id = p.user_id
         WHERE r.product_id = $1
         ORDER BY r.created_at DESC`,
        [productId]
    );
    res.json(reviews.rows);
});

// @desc    Obtener todas las reseñas de una tienda (productos de un vendedor)
// @acceso  Público
exports.getStoreReviews = asyncHandler(async (req, res, next) => {
    const { storeId } = req.params;
    
    // Primero obtener el user_id del vendedor desde stores
    const storeResult = await pool.query(
        'SELECT user_id FROM stores WHERE id = $1',
        [storeId]
    );
    
    if (storeResult.rows.length === 0) {
        return res.status(404).json({ msg: 'Tienda no encontrada.' });
    }
    
    const sellerId = storeResult.rows[0].user_id;
    
    // Obtener reseñas de todos los productos de este vendedor
    const reviews = await pool.query(
        `SELECT r.id, r.calificacion as rating, r.comentario as comment, r.created_at, r.is_verified,
                u.nombre as nombre_usuario,
                prof.foto_perfil as user_avatar,
                p.nombre as nombre_producto
         FROM reviews r 
         JOIN users u ON r.user_id = u.id 
         LEFT JOIN profiles prof ON r.user_id = prof.user_id
         LEFT JOIN products p ON r.product_id = p.id
         WHERE p.store_id = (SELECT id FROM stores WHERE user_id = $1 LIMIT 1)
         ORDER BY r.created_at DESC`,
        [sellerId]
    );
    res.json(reviews.rows);
});

// @desc    Obtener todas las reseñas del usuario autenticado
// @acceso  Privado
exports.getUserReviews = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const reviews = await pool.query(
        `SELECT r.*, 
                s.nombre_comercio, 
                p.nombre as nombre_producto, 
                p.imagen_url as product_image
         FROM reviews r
         LEFT JOIN products p ON r.product_id = p.id
         LEFT JOIN stores s ON (p.store_id = s.id OR r.store_id = s.id)
         WHERE r.user_id = $1
         ORDER BY r.created_at DESC`,
        [userId]
    );
    res.json(reviews.rows);
});

// @desc    Obtener reseñas de los productos de MI tienda (para comercios)
// @acceso  Privado (Comercio)
exports.getMyStoreReviews = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    
    // Buscar reseñas de la tienda del usuario autenticado
    const reviews = await pool.query(
        `SELECT r.id, 
                r.calificacion as rating, 
                r.comentario as comment, 
                r.created_at, 
                r.calidad_comida,
                r.valor_precio,
                r.experiencia_recogida,
                r.visible,
                u.nombre as nombre_usuario, 
                u.email as user_email,
                s.nombre_comercio,
                COALESCE(p.nombre, 'Producto eliminado') as nombre_producto
         FROM reviews r
         JOIN users u ON r.user_id = u.id
         JOIN stores s ON r.store_id = s.id
         LEFT JOIN products p ON r.product_id = p.id
         WHERE s.user_id = $1
         ORDER BY r.created_at DESC`,
        [userId]
    );
    res.json(reviews.rows);
});

// @desc    Obtener TODAS las reseñas (Admin)
// @acceso  Privado (Admin)
exports.getAllReviews = asyncHandler(async (req, res, next) => {
    // Verificar que el usuario es admin - aceptar ambos idiomas
    const userRole = (req.user.rol || req.user.role || '').toLowerCase();
    if (!['admin', 'administrador'].includes(userRole)) {
        return res.status(403).json({ msg: 'Acceso denegado. Solo administradores.' });
    }
    
    const { sellerId, storeId, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
        SELECT r.id, 
               r.calificacion as rating, 
               r.comentario as comment, 
               r.created_at,
               r.calidad_comida,
               r.valor_precio,
               r.experiencia_recogida,
               r.visible,
               u.name as nombre_usuario, 
               u.email as user_email,
               s.nombre_comercio,
               COALESCE(r.nombre_producto, p.name) as nombre_producto
         FROM reviews r
         JOIN users u ON r.user_id = u.id
         LEFT JOIN stores s ON r.store_id = s.id
         LEFT JOIN products p ON r.product_id = p.id
         WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (sellerId) {
        query += ` AND s.user_id = $${paramIndex}`;
        params.push(sellerId);
        paramIndex++;
    }
    
    if (storeId) {
        query += ` AND r.store_id = $${paramIndex}`;
        params.push(storeId);
        paramIndex++;
    }
    
    query += ` ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const reviews = await pool.query(query, params);
    
    // Obtener conteo total
    let countQuery = `SELECT COUNT(*) FROM reviews r LEFT JOIN stores s ON r.store_id = s.id WHERE 1=1`;
    const countParams = [];
    let countIndex = 1;
    
    if (sellerId) {
        countQuery += ` AND s.user_id = $${countIndex}`;
        countParams.push(sellerId);
        countIndex++;
    }
    if (storeId) {
        countQuery += ` AND r.store_id = $${countIndex}`;
        countParams.push(storeId);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
        reviews: reviews.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
});

// @desc    Responder a una reseña (Admin)
// @acceso  Privado (Admin)
exports.respondToReview = asyncHandler(async (req, res, next) => {
    // Verificar que el usuario es admin
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ msg: 'Acceso denegado. Solo administradores.' });
    }
    
    const { reviewId } = req.params;
    const { respuesta } = req.body;
    
    // Nota: La tabla reviews no tiene columnas para respuestas de admin
    // Retornamos error indicando que la funcionalidad no está disponible
    return res.status(501).json({ 
        msg: 'Funcionalidad de respuestas de admin no implementada en el schema actual.' 
    });
});

// @desc    Responder a una reseña de mi tienda (Comercio)
// @acceso  Privado (Comercio) - FUNCIONALIDAD NO DISPONIBLE
exports.storeRespondToReview = asyncHandler(async (req, res, next) => {
    // Nota: La tabla reviews no tiene columnas para respuestas
    return res.status(501).json({ 
        msg: 'Funcionalidad de respuestas de comercio no implementada en el schema actual.' 
    });
});

// @desc    Ocultar/Mostrar una reseña (Admin) - FUNCIONALIDAD NO DISPONIBLE
// @acceso  Privado (Admin)
exports.toggleReviewVisibility = asyncHandler(async (req, res, next) => {
    // Nota: La tabla reviews no tiene columna 'visible'
    return res.status(501).json({ 
        msg: 'Funcionalidad de visibilidad no implementada en el schema actual.' 
    });
});

// @desc    Eliminar una reseña (Admin o dueño)
// @acceso  Privado (Admin o propietario de la reseña)
exports.deleteReview = asyncHandler(async (req, res, next) => {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const userRole = (req.user.rol || req.user.role || '').toLowerCase();
    
    // Obtener la reseña primero
    const reviewResult = await pool.query(
        'SELECT * FROM reviews WHERE id = $1',
        [reviewId]
    );
    
    if (reviewResult.rows.length === 0) {
        return res.status(404).json({ msg: 'Reseña no encontrada.' });
    }
    
    const review = reviewResult.rows[0];
    
    // Verificar permisos: admin puede eliminar cualquiera, usuario solo las suyas
    if (!['admin', 'administrador'].includes(userRole) && review.user_id !== userId) {
        return res.status(403).json({ msg: 'No tiene permiso para eliminar esta reseña.' });
    }
    
    // Eliminar la reseña
    await pool.query('DELETE FROM reviews WHERE id = $1', [reviewId]);
    
    // Recalcular promedios
    if (review.product_id) {
        await updateProductAverageRating(review.product_id);
    }
    
    res.json({ msg: 'Reseña eliminada correctamente.' });
});

// @desc    Obtener estadísticas de reseñas para una tienda
// @acceso  Público
exports.getStoreReviewStats = asyncHandler(async (req, res, next) => {
    const { storeId } = req.params;
    
    // Obtener el user_id del vendedor desde stores
    const storeResult = await pool.query(
        'SELECT user_id FROM stores WHERE id = $1',
        [storeId]
    );
    
    if (storeResult.rows.length === 0) {
        return res.status(404).json({ msg: 'Tienda no encontrada.' });
    }
    
    const sellerId = storeResult.rows[0].user_id;
    
    // Obtener estadísticas de reseñas de productos de este vendedor
    const stats = await pool.query(
        `SELECT 
            COUNT(*) as total_reviews,
            AVG(r.rating) as promedio,
            COUNT(CASE WHEN r.rating = 5 THEN 1 END) as cinco_estrellas,
            COUNT(CASE WHEN r.rating = 4 THEN 1 END) as cuatro_estrellas,
            COUNT(CASE WHEN r.rating = 3 THEN 1 END) as tres_estrellas,
            COUNT(CASE WHEN r.rating = 2 THEN 1 END) as dos_estrellas,
            COUNT(CASE WHEN r.rating = 1 THEN 1 END) as una_estrella
         FROM reviews r
         JOIN products p ON r.product_id = p.id
         WHERE p.seller_id = $1`,
        [sellerId]
    );
    
    const result = stats.rows[0];
    res.json({
        total: parseInt(result.total_reviews) || 0,
        promedio: parseFloat(result.promedio) || 0,
        distribucion: {
            5: parseInt(result.cinco_estrellas) || 0,
            4: parseInt(result.cuatro_estrellas) || 0,
            3: parseInt(result.tres_estrellas) || 0,
            2: parseInt(result.dos_estrellas) || 0,
            1: parseInt(result.una_estrella) || 0
        }
    });
});

// @desc    Editar una reseña (solo el propietario)
// @acceso  Privado
exports.updateReview = asyncHandler(async (req, res, next) => {
    const { reviewId } = req.params;
    const { calificacion, rating, comentario, comment } = req.body;
    const finalRating = calificacion || rating;
    const finalComment = comentario || comment;
    const userId = req.user.id;
    
    // Verificar que la reseña pertenece al usuario
    const reviewResult = await pool.query(
        'SELECT * FROM reviews WHERE id = $1 AND user_id = $2',
        [reviewId, userId]
    );
    
    if (reviewResult.rows.length === 0) {
        return res.status(404).json({ msg: 'Reseña no encontrada o no tiene permiso.' });
    }
    
    const review = reviewResult.rows[0];
    
    // Actualizar la reseña usando campos correctos del schema
    const result = await pool.query(
        `UPDATE reviews 
         SET rating = COALESCE($1, rating),
             comment = COALESCE($2, comment)
         WHERE id = $3
         RETURNING *`,
        [finalRating, finalComment, reviewId]
    );
    
    // Recalcular promedios si cambió la calificación
    if (finalRating && finalRating !== review.rating) {
        if (review.product_id) {
            await updateProductAverageRating(review.product_id);
        }
    }
    
    res.json({
        ...result.rows[0],
        msg: 'Reseña actualizada correctamente.'
    });
});